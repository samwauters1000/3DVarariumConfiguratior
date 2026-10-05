import { useMemo } from 'react'
import { ExtrudeGeometry, Vector2 } from 'three'
import { HEART_BASE_WIDTH, HEART_CUSP_Y, HEART_OUTLINE } from '../../geometry/heart.js'
import { toShape } from '../geometry/shape.js'
import ModelWithFallback from '../models/ModelWithFallback.jsx'
import { Edges } from '@react-three/drei'
import { brassMaterialProps, glassMaterialProps, GLASS_RENDER_ORDER, woodMaterialProps } from '../materials.js'

// Temporary geometry for each terrarium until the final .glb models are available.

function GlassDome() {
  const profile = useMemo(() => {
    const radius = 0.95
    const wallHeight = 0.85
    const points = [new Vector2(radius, 0), new Vector2(radius, wallHeight)]
    for (let step = 1; step <= 16; step++) {
      const angle = (step / 16) * (Math.PI / 2)
      points.push(new Vector2(Math.max(radius * Math.cos(angle), 0.001), wallHeight + radius * 0.85 * Math.sin(angle)))
    }
    return points
  }, [])

  return (
    <group>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.05, 1.08, 0.14, 12]} />
        <meshStandardMaterial {...woodMaterialProps} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <latheGeometry args={[profile, 12]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
      </mesh>
      <mesh position={[0, 0.12 + 0.85 + 0.95 * 0.85 + 0.05, 0]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshPhysicalMaterial {...glassMaterialProps} opacity={0.45} />
      </mesh>
    </group>
  )
}

function GeometricPrism() {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1, 1, 0.06, 6]} />
        <meshStandardMaterial {...brassMaterialProps} flatShading />
      </mesh>
      <mesh position={[0, 0.06 + 0.5, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <cylinderGeometry args={[0.95, 0.95, 1, 6, 1, true]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
        <Edges color={brassMaterialProps.color} threshold={15} />
      </mesh>
      <mesh position={[0, 0.06 + 1 + 0.275, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <coneGeometry args={[0.95, 0.55, 6, 1, true]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
        <Edges color={brassMaterialProps.color} threshold={15} />
      </mesh>
      <mesh position={[0, 0.06 + 1 + 0.55 + 0.03, 0]}>
        <icosahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial {...brassMaterialProps} flatShading />
      </mesh>
    </group>
  )
}

function OpenBowl() {
  const profile = useMemo(
    () =>
      [
        [0.6, 0],
        [0.84, 0.07],
        [1.03, 0.22],
        [1.14, 0.45],
        [1.14, 0.66],
        [1.06, 0.86],
        [1.0, 0.95],
        [1.03, 0.96],
      ].map(([x, y]) => new Vector2(x, y)),
    [],
  )

  return (
    <group>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <circleGeometry args={[0.6, 12]} />
        <meshPhysicalMaterial {...glassMaterialProps} opacity={0.3} />
      </mesh>
      <mesh renderOrder={GLASS_RENDER_ORDER}>
        <latheGeometry args={[profile, 12]} />
        <meshPhysicalMaterial {...glassMaterialProps} />
      </mesh>
    </group>
  )
}

// ---------- Special shapes ----------

function BrassHeart({ terrarium }) {
  const { floorY } = terrarium.interior
  const depth = 0.9
  const geometry = useMemo(() => {
    const extruded = new ExtrudeGeometry(toShape(HEART_OUTLINE), { depth, bevelEnabled: false })
    extruded.translate(0, 0, -depth / 2)
    return extruded
  }, [])

  return (
    <group>
      {/* Brass base plate under the flat bottom of the heart */}
      <mesh position={[0, floorY / 2, 0]}>
        <boxGeometry args={[HEART_BASE_WIDTH + 0.16, floorY, depth + 0.08]} />
        <meshStandardMaterial {...brassMaterialProps} flatShading />
      </mesh>
      <mesh geometry={geometry} position={[0, floorY, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <meshPhysicalMaterial {...glassMaterialProps} />
        <Edges color={brassMaterialProps.color} threshold={10} />
      </mesh>
      {/* Small brass handle on the top cusp */}
      <mesh position={[0, floorY + HEART_CUSP_Y + 0.02, 0]}>
        <icosahedronGeometry args={[0.035, 0]} />
        <meshStandardMaterial {...brassMaterialProps} flatShading />
      </mesh>
    </group>
  )
}

function TinyBottle() {
  const profile = useMemo(
    () =>
      [
        [0.001, 0],
        [0.33, 0],
        [0.37, 0.03],
        [0.38, 0.1],
        [0.38, 0.45],
        [0.35, 0.58],
        [0.26, 0.69],
        [0.16, 0.76],
        [0.125, 0.82],
        [0.125, 0.98],
        [0.145, 1.0],
      ].map(([x, y]) => new Vector2(x, y)),
    [],
  )

  return (
    <group>
      <mesh renderOrder={GLASS_RENDER_ORDER}>
        <latheGeometry args={[profile, 10]} />
        <meshPhysicalMaterial {...glassMaterialProps} opacity={0.2} />
      </mesh>
      {/* Cork */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.14, 8]} />
        <meshStandardMaterial color="#c49a6c" roughness={0.95} flatShading />
      </mesh>
    </group>
  )
}

function PanoramaTank({ terrarium }) {
  const { floorY, groundShape } = terrarium.interior
  const width = groundShape.width + 0.1
  const depth = groundShape.depth + 0.1
  const height = 1.35

  return (
    <group>
      {/* Dark wooden plinth */}
      <mesh position={[0, floorY / 2, 0]}>
        <boxGeometry args={[width + 0.12, floorY, depth + 0.12]} />
        <meshStandardMaterial color="#4a3a2c" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, floorY + height / 2, 0]} renderOrder={GLASS_RENDER_ORDER}>
        <boxGeometry args={[width, height, depth]} />
        <meshPhysicalMaterial {...glassMaterialProps} opacity={0.12} />
        <Edges color="#2d3529" threshold={15} />
      </mesh>
    </group>
  )
}

const placeholders = {
  dome: GlassDome,
  prism: GeometricPrism,
  bowl: OpenBowl,
  heart: BrassHeart,
  bottle: TinyBottle,
  panorama: PanoramaTank,
}

// The terrarium's .glb model when available, otherwise its placeholder shape.
export default function TerrariumModel({ terrarium }) {
  const Placeholder = placeholders[terrarium.placeholder] ?? GlassDome
  return <ModelWithFallback url={terrarium.model} placeholder={<Placeholder terrarium={terrarium} />} />
}
