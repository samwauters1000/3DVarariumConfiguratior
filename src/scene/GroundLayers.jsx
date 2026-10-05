import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, ExtrudeGeometry, Object3D } from 'three'
import { getHeartSlice, getHeartWidthAt } from '../geometry/heart.js'
import { toShape } from './geometry/shape.js'

// Ground layers fill the bottom of the terrarium. The terrarium defines the shape
// (round, box or heart), the ground type defines the colours and surface detail.
export function getSoilSurfaceY(terrarium) {
  const { floorY, drainage, soil } = terrarium.interior
  return floorY + drainage.height + soil.height
}

// ---------- Layer shapes ----------

function RoundLayer({ layer, bottomY, radialSegments, color, roughness }) {
  return (
    <mesh position={[0, bottomY + layer.height / 2, 0]}>
      <cylinderGeometry args={[layer.topRadius, layer.bottomRadius, layer.height, radialSegments]} />
      <meshStandardMaterial color={color} roughness={roughness} flatShading />
    </mesh>
  )
}

function BoxLayer({ height, bottomY, width, depth, color, roughness }) {
  return (
    <mesh position={[0, bottomY + height / 2, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={roughness} flatShading />
    </mesh>
  )
}

// A horizontal slice of the heart, extruded through the depth of the container.
function HeartLayer({ bottomY, topY, floorY, depth, inset, color, roughness }) {
  const geometry = useMemo(() => {
    const slice = getHeartSlice(bottomY - floorY, topY - floorY, inset)
    const extruded = new ExtrudeGeometry(toShape(slice), { depth, bevelEnabled: false })
    extruded.translate(0, floorY, -depth / 2)
    return extruded
  }, [bottomY, topY, floorY, depth, inset])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={roughness} flatShading />
    </mesh>
  )
}

// Returns the area (for surface detail) as a sampler: picks a random point on the soil.
function getSurfaceSampler(terrarium) {
  const { groundShape, soil } = terrarium.interior
  if (groundShape.type === 'box') {
    const halfWidth = (groundShape.width / 2) * 0.94
    const halfDepth = (groundShape.depth / 2) * 0.9
    return { area: halfWidth * halfDepth * 4, sample: (random) => [(random() * 2 - 1) * halfWidth, (random() * 2 - 1) * halfDepth] }
  }
  if (groundShape.type === 'heart') {
    const surfaceY = getSoilSurfaceY(terrarium) - terrarium.interior.floorY
    const halfWidth = (getHeartWidthAt(surfaceY, groundShape.inset) / 2) * 0.9
    const halfDepth = (groundShape.depth / 2) * 0.88
    return { area: halfWidth * halfDepth * 4, sample: (random) => [(random() * 2 - 1) * halfWidth, (random() * 2 - 1) * halfDepth] }
  }
  // Round: keep pieces inside polygonal containers (e.g. the hexagonal prism).
  const segments = groundShape.radialSegments
  const inscribedFactor = segments < 24 ? Math.cos(Math.PI / segments) : 1
  const radius = soil.topRadius * inscribedFactor * 0.92
  return {
    area: Math.PI * radius * radius,
    sample: (random) => {
      const distance = Math.sqrt(random()) * radius
      const angle = random() * Math.PI * 2
      return [Math.cos(angle) * distance, Math.sin(angle) * distance]
    },
  }
}

// ---------- Surface detail ----------

// Small deterministic random generator so the surface looks the same on every render.
function createRandom(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

// Density per square unit of soil, so small and large containers look alike. All pieces
// are low-poly and flat-shaded, in the style of the plants.
const SURFACE_SHAPES = {
  pebbles: { density: 60, scale: [0.034, 0.02, 0.028], tilt: 0.3, roughness: 0.8, geometry: <icosahedronGeometry args={[1, 0]} /> },
  chips: { density: 38, scale: [0.07, 0.018, 0.038], tilt: 0.35, roughness: 1, geometry: <boxGeometry args={[1, 1, 1]} /> },
  tufts: { density: 28, scale: [0.06, 0.035, 0.06], tilt: 0.1, roughness: 1, geometry: <icosahedronGeometry args={[1, 0]} /> },
  // Soil: small, flat clumps of earth.
  clumps: { density: 34, scale: [0.05, 0.014, 0.045], tilt: 0.2, roughness: 1, geometry: <icosahedronGeometry args={[1, 0]} /> },
  // Sand: wide, very low dunes.
  dunes: { density: 10, scale: [0.14, 0.012, 0.09], tilt: 0.05, roughness: 1, geometry: <icosahedronGeometry args={[1, 0]} /> },
}

function GroundSurface({ surface, sampler, surfaceY, pieceScale }) {
  const meshRef = useRef(null)
  const shape = SURFACE_SHAPES[surface.type]
  const count = Math.max(12, Math.round((shape.density * sampler.area) / (pieceScale * pieceScale)))

  useLayoutEffect(() => {
    const mesh = meshRef.current
    const random = createRandom(count * 131 + surface.type.length)
    const dummy = new Object3D()
    const color = new Color()

    for (let index = 0; index < count; index++) {
      const [x, z] = sampler.sample(random)
      const size = (0.7 + random() * 0.6) * pieceScale
      dummy.position.set(x, surfaceY, z)
      dummy.rotation.set((random() - 0.5) * shape.tilt, random() * Math.PI * 2, (random() - 0.5) * shape.tilt)
      dummy.scale.set(shape.scale[0] * size, shape.scale[1] * size, shape.scale[2] * size)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      mesh.setColorAt(index, color.set(surface.colors[Math.floor(random() * surface.colors.length)]))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [shape, surface, sampler, surfaceY, pieceScale, count])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {shape.geometry}
      <meshStandardMaterial color="#ffffff" roughness={shape.roughness} flatShading />
    </instancedMesh>
  )
}

// ---------- Ground ----------

export default function GroundLayers({ terrarium, ground }) {
  const { floorY, drainage, soil, groundShape } = terrarium.interior
  const surfaceY = getSoilSurfaceY(terrarium)
  const drainageTop = floorY + drainage.height
  const sampler = useMemo(() => getSurfaceSampler(terrarium), [terrarium])
  const colors = ground.layers

  let layers
  if (groundShape.type === 'box') {
    layers = (
      <>
        <BoxLayer height={drainage.height} bottomY={floorY} width={groundShape.width} depth={groundShape.depth} color={colors.drainage} roughness={0.9} />
        <BoxLayer height={soil.height} bottomY={drainageTop} width={groundShape.width} depth={groundShape.depth} color={colors.top} roughness={1} />
      </>
    )
  } else if (groundShape.type === 'heart') {
    const shared = { floorY, depth: groundShape.depth, inset: groundShape.inset }
    layers = (
      <>
        <HeartLayer {...shared} bottomY={floorY} topY={drainageTop} color={colors.drainage} roughness={0.9} />
        <HeartLayer {...shared} bottomY={drainageTop} topY={surfaceY} color={colors.top} roughness={1} />
      </>
    )
  } else {
    layers = (
      <>
        <RoundLayer layer={drainage} bottomY={floorY} radialSegments={groundShape.radialSegments} color={colors.drainage} roughness={0.9} />
        <RoundLayer layer={soil} bottomY={drainageTop} radialSegments={groundShape.radialSegments} color={colors.top} roughness={1} />
      </>
    )
  }

  return (
    <group>
      {layers}
      {ground.surface && (
        <GroundSurface
          key={`${ground.id}-${terrarium.id}`}
          surface={ground.surface}
          sampler={sampler}
          surfaceY={surfaceY}
          pieceScale={terrarium.plantScale ?? 1}
        />
      )}
    </group>
  )
}
