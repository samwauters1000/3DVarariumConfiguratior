import { useEffect, useMemo } from 'react'
import { DoubleSide, Vector3 } from 'three'
import { createRandom, getPlantShape, intRange, range, seedFromString, varyColor } from '../plants/variation.js'
import { FlatMaterial, Leaf } from '../plants/PlantPlaceholder.jsx'
import { createRockGeometry, createTaperedTube } from '../geometry/organic.js'
import { getSupportPath } from '../../utils/organicShapes.js'

// Decoration models built in code, in the same low-poly, flat-shaded style as the plants.
// Shapes are organic: lumpy rocks, curved and tapering wood that leans and bows (nothing
// stands perfectly straight). Every object varies based on its instance id. Upright
// climbable wood follows getSupportPath(), the same path climbing plants use.

const TWO_PI = Math.PI * 2

// Builders get a `make` helper that remembers created geometries so they can be freed.
function createContext(item, seed) {
  const geometries = []
  const keep = (geometry) => {
    geometries.push(geometry)
    return geometry
  }
  const path = getSupportPath(item, seed)
  return {
    geometries,
    rock: (key, options) => keep(createRockGeometry(`${seed}:${key}`, options)),
    tube: (points, radiusAt, radial) => keep(createTaperedTube(points, radiusAt, radial)),
    // Points along the object's own natural centre line, from the ground to `height`.
    trunkPoints: (height, steps = 8) =>
      Array.from({ length: steps + 1 }, (_, index) => {
        const t = index / steps
        const offset = path(t)
        return new Vector3(offset.x * height, t * height, offset.z * height)
      }),
  }
}

// Crooked branch from `start` in direction (yaw, rise), bending as it goes.
function branchPoints(random, start, { yaw, rise, length, steps = 5, curl = 0.35 }) {
  const points = [start.clone()]
  let direction = new Vector3(Math.sin(yaw) * Math.cos(rise), Math.sin(rise), Math.cos(yaw) * Math.cos(rise))
  const stepLength = length / steps
  for (let step = 0; step < steps; step++) {
    direction = direction
      .clone()
      .add(new Vector3((random() - 0.5) * curl, (random() - 0.5) * curl * 0.6, (random() - 0.5) * curl))
      .normalize()
    points.push(points[points.length - 1].clone().addScaledVector(direction, stepLength))
  }
  return points
}

const taper = (base, tip) => (t) => base + (tip - base) * t

function Wood({ geometry, color, roughness = 0.95 }) {
  return (
    <mesh geometry={geometry}>
      <FlatMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

function RockMesh({ geometry, color, position = [0, 0, 0], scale, rotation }) {
  return (
    <mesh geometry={geometry} position={position} scale={scale} rotation={rotation}>
      <FlatMaterial color={color} roughness={0.95} />
    </mesh>
  )
}

// Roots spreading over the ground from the base of a trunk.
function roots(random, context, { count, radius, length, color }) {
  return Array.from({ length: count }, (_, index) => {
    const yaw = (index / count) * TWO_PI + random() * 0.6
    const points = branchPoints(random, new Vector3(0, radius * 0.6, 0), { yaw, rise: -0.35, length, steps: 4, curl: 0.25 })
    points.forEach((point) => (point.y = Math.max(0.004, point.y)))
    return <Wood key={`root-${index}`} geometry={context.tube(points, taper(radius * 0.55, radius * 0.12), 5)} color={varyColor(color, random, 0.08)} />
  })
}

// ---------- Climbable wood ----------

function buildBranch(random, { item, color, context }) {
  const { height, radius } = item.climbable
  const trunk = context.trunkPoints(height)
  const twigs = Array.from({ length: intRange(random, 2, 4) }, (_, index) => {
    const start = trunk[intRange(random, 3, trunk.length - 2)]
    const points = branchPoints(random, start, { yaw: random() * TWO_PI, rise: range(random, 0.3, 0.9), length: range(random, 0.08, 0.16), steps: 3 })
    return <Wood key={`twig-${index}`} geometry={context.tube(points, taper(radius * 0.45, radius * 0.12), 5)} color={varyColor(color, random, 0.08)} />
  })
  return [
    <Wood key="trunk" geometry={context.tube(trunk, taper(radius * 1.25, radius * 0.45), 6)} color={color} />,
    ...twigs,
    ...roots(random, context, { count: intRange(random, 2, 4), radius, length: 0.08, color }),
  ]
}

function buildCorkTube(random, { item, color, context }) {
  const { height, radius } = item.climbable
  const trunk = context.trunkPoints(height, 6)
  // Knobbly cork: every ring a little thicker or thinner.
  const bumps = trunk.map(() => range(random, 0.88, 1.12))
  const top = trunk[trunk.length - 1]
  return [
    <Wood key="tube" geometry={context.tube(trunk, (t) => radius * bumps[Math.round(t * (trunk.length - 1))], 8)} color={color} roughness={1} />,
    // Dark opening on top
    <mesh key="opening" position={[top.x, top.y + 0.003, top.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius * 0.7, 8]} />
      <FlatMaterial color="#3b2c20" roughness={1} />
    </mesh>,
  ]
}

function buildCorkFlat(random, { item, color, context }) {
  // Curved slab of bark that leans with the object's natural path.
  const { height, radius } = item.climbable
  const top = context.trunkPoints(height, 1)[1]
  const tilt = [Math.atan2(top.z, height), random() * TWO_PI, -Math.atan2(top.x, height)]
  return [
    <group key="slab" rotation={[tilt[0], 0, tilt[2]]}>
      <mesh position={[0, height / 2, 0]} rotation={[0, tilt[1], 0]}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.55, height, 7, 4, true, 0, Math.PI * 0.9]} />
        <FlatMaterial color={color} roughness={1} side={DoubleSide} />
      </mesh>
    </group>,
  ]
}

function buildMossPole(random, { item, color, context }) {
  const { height, radius } = item.climbable
  const trunk = context.trunkPoints(height, 6)
  const tufts = Array.from({ length: intRange(random, 9, 15) }, (_, index) => {
    const point = trunk[intRange(random, 0, trunk.length - 1)]
    const angle = random() * TWO_PI
    return (
      <mesh key={index} position={[point.x + Math.cos(angle) * radius, point.y, point.z + Math.sin(angle) * radius]}>
        <icosahedronGeometry args={[radius * range(random, 0.35, 0.6), 0]} />
        <FlatMaterial color={varyColor(color, random, 0.12)} roughness={1} />
      </mesh>
    )
  })
  return [<Wood key="pole" geometry={context.tube(trunk, taper(radius, radius * 0.9), 7)} color={color} roughness={1} />, ...tufts]
}

function buildSpiderWood(random, { item, color, context }) {
  // Twisting main root with several thin arms reaching out and up.
  const { height, radius } = item.climbable
  const trunk = context.trunkPoints(height, 10)
  const arms = Array.from({ length: intRange(random, 3, 5) }, (_, index) => {
    const start = trunk[intRange(random, 2, trunk.length - 2)]
    const points = branchPoints(random, start, { yaw: random() * TWO_PI, rise: range(random, -0.1, 0.8), length: range(random, 0.15, 0.3), steps: 6, curl: 0.5 })
    return <Wood key={`arm-${index}`} geometry={context.tube(points, taper(radius * 0.6, radius * 0.12), 5)} color={varyColor(color, random, 0.08)} />
  })
  return [
    <Wood key="trunk" geometry={context.tube(trunk, taper(radius * 1.3, radius * 0.35), 6)} color={color} />,
    ...arms,
    ...roots(random, context, { count: intRange(random, 3, 5), radius, length: 0.12, color }),
  ]
}

function buildManzanita(random, { item, color, context }) {
  // Smooth red-brown trunk that forks into two or three leaning branches.
  const { height, radius } = item.climbable
  const trunk = context.trunkPoints(height, 8)
  const fork = trunk[Math.round(trunk.length * 0.55)]
  const branches = Array.from({ length: intRange(random, 2, 3) }, (_, index) => {
    const points = branchPoints(random, fork, { yaw: random() * TWO_PI, rise: range(random, 0.5, 1.1), length: range(random, 0.14, 0.24), steps: 4, curl: 0.3 })
    return <Wood key={`fork-${index}`} geometry={context.tube(points, taper(radius * 0.7, radius * 0.18), 6)} color={varyColor(color, random, 0.06)} roughness={0.6} />
  })
  return [
    <Wood key="trunk" geometry={context.tube(trunk, taper(radius * 1.2, radius * 0.5), 6)} color={color} roughness={0.6} />,
    ...branches,
    ...roots(random, context, { count: 3, radius, length: 0.08, color }),
  ]
}

// ---------- Other wood ----------

function buildRootStump(random, { color, context }) {
  const height = range(random, 0.12, 0.16)
  const radius = range(random, 0.06, 0.075)
  const trunk = context.trunkPoints(height, 4)
  const top = trunk[trunk.length - 1]
  return [
    <Wood key="stump" geometry={context.tube(trunk, taper(radius * 1.15, radius), 8)} color={color} />,
    // Pale cut surface with a darker ring
    <mesh key="cut" position={[top.x, top.y + 0.001, top.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius * 0.98, 8]} />
      <FlatMaterial color="#c9a57a" />
    </mesh>,
    <mesh key="ring" position={[top.x, top.y + 0.002, top.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.45, radius * 0.55, 8]} />
      <FlatMaterial color="#9c7a52" />
    </mesh>,
    ...roots(random, context, { count: intRange(random, 4, 6), radius: radius * 0.8, length: 0.1, color }),
  ]
}

function buildMossyLog(random, { item, color, context }) {
  // Fallen log lying on its side, bending slightly, with moss on top.
  const length = range(random, 0.3, 0.4)
  const radius = range(random, 0.045, 0.06)
  const bend = range(random, -0.05, 0.05)
  const points = Array.from({ length: 7 }, (_, index) => {
    const t = index / 6
    return new Vector3((t - 0.5) * length, radius * 0.85, Math.sin(Math.PI * t) * bend)
  })
  const moss = Array.from({ length: intRange(random, 4, 7) }, (_, index) => {
    const point = points[intRange(random, 1, points.length - 2)]
    const size = range(random, 0.03, 0.05)
    return (
      <mesh key={index} position={[point.x + range(random, -0.02, 0.02), point.y + radius * 0.8, point.z]} scale={[size, size * 0.45, size * 0.8]}>
        <icosahedronGeometry args={[1, 0]} />
        <FlatMaterial color={varyColor(item.accent, random, 0.12)} roughness={1} />
      </mesh>
    )
  })
  const ends = [points[0], points[points.length - 1]].map((point, index) => (
    <mesh key={`end-${index}`} position={point} rotation={[0, Math.PI / 2, 0]}>
      <circleGeometry args={[radius * 0.9, 8]} />
      <FlatMaterial color="#b89468" side={DoubleSide} />
    </mesh>
  ))
  return [<Wood key="log" geometry={context.tube(points, (t) => radius * (0.9 + 0.1 * Math.sin(Math.PI * t)), 8)} color={color} />, ...moss, ...ends]
}

function buildBarkChunks(random, { color }) {
  // Curved pieces of bark (thin slices of a cylinder) lying on the ground.
  return Array.from({ length: intRange(random, 3, 5) }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = index === 0 ? 0 : range(random, 0.03, 0.08)
    const length = range(random, 0.06, 0.1)
    return (
      <mesh
        key={index}
        position={[Math.cos(angle) * distance, 0.012, Math.sin(angle) * distance]}
        rotation={[Math.PI / 2 + range(random, -0.2, 0.2), 0, random() * TWO_PI]}
      >
        <cylinderGeometry args={[0.03, 0.034, length, 6, 1, true, 0, range(random, 1.2, 2)]} />
        <FlatMaterial color={varyColor(color, random, 0.12)} roughness={1} side={DoubleSide} />
      </mesh>
    )
  })
}

function buildTwigs(random, { color, context }) {
  return Array.from({ length: intRange(random, 4, 7) }, (_, index) => {
    const start = new Vector3(range(random, -0.05, 0.05), 0.006, range(random, -0.05, 0.05))
    const points = branchPoints(random, start, { yaw: random() * TWO_PI, rise: 0, length: range(random, 0.08, 0.14), steps: 4, curl: 0.4 })
    points.forEach((point) => (point.y = 0.006))
    return <Wood key={index} geometry={context.tube(points, taper(0.006, 0.003), 4)} color={varyColor(color, random, 0.12)} />
  })
}

function buildLeafLitter(random, { color }) {
  // Dried leaves lying on the ground, curled a little, in brown and ochre shades.
  const count = intRange(random, 7, 11)
  const palette = [color, '#b58a54', '#7d5a36', '#a36b3f']
  return Array.from({ length: count }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = range(random, 0, 0.1)
    const size = range(random, 0.05, 0.08)
    return (
      <Leaf
        key={index}
        shape={index % 3 === 0 ? 'oval' : 'lance'}
        position={[Math.cos(angle) * distance, 0.004 + index * 0.0015, Math.sin(angle) * distance]}
        yaw={random() * TWO_PI}
        pitch={range(random, -0.05, 0.12)}
        roll={range(random, -0.2, 0.2)}
        length={size}
        width={size * 0.55}
        color={varyColor(palette[index % palette.length], random, 0.1)}
      />
    )
  })
}

// ---------- Stones ----------

function buildRiverStones(random, { color, context }) {
  return Array.from({ length: intRange(random, 3, 5) }, (_, index) => {
    const distance = index === 0 ? 0 : range(random, 0.04, 0.08)
    const angle = random() * TWO_PI
    const size = range(random, 0.028, 0.045)
    return (
      <RockMesh
        key={index}
        geometry={context.rock(`stone-${index}`, { detail: 1, roughness: 0.12 })}
        color={varyColor(color, random, 0.12)}
        position={[Math.cos(angle) * distance, size * 0.3, Math.sin(angle) * distance]}
        scale={[size * range(random, 1, 1.3), size * range(random, 0.5, 0.7), size]}
        rotation={[0, random() * TWO_PI, 0]}
      />
    )
  })
}

function buildLavaRock(random, { color, context }) {
  const size = range(random, 0.06, 0.085)
  return [
    <RockMesh
      key="rock"
      geometry={context.rock('lava', { detail: 1, roughness: 0.35 })}
      color={color}
      position={[0, size * 0.45, 0]}
      scale={[size, size * range(random, 0.75, 0.95), size * range(random, 0.85, 1.1)]}
      rotation={[0, random() * TWO_PI, 0]}
    />,
  ]
}

function buildMossyPebble(random, { item, color, context }) {
  const size = range(random, 0.045, 0.06)
  return [
    <RockMesh key="rock" geometry={context.rock('pebble', { detail: 1, roughness: 0.15 })} color={color} position={[0, size * 0.4, 0]} scale={[size, size * 0.7, size * 0.9]} />,
    <RockMesh
      key="moss"
      geometry={context.rock('moss', { detail: 1, roughness: 0.25 })}
      color={varyColor(item.accent, random, 0.1)}
      position={[0, size * 0.78, 0]}
      scale={[size * 0.8, size * 0.28, size * 0.72]}
    />,
  ]
}

function buildSeiryuStone(random, { color, context }) {
  // Tall, ridged main rock with a smaller one leaning against it: classic hardscape.
  const main = range(random, 0.07, 0.085)
  return [
    <RockMesh
      key="main"
      geometry={context.rock('main', { detail: 1, roughness: 0.32 })}
      color={varyColor(color, random, 0.06)}
      position={[0, main * 1.3, 0]}
      scale={[main * 0.9, main * 1.9, main * 0.7]}
      rotation={[range(random, -0.12, 0.12), random() * TWO_PI, range(random, -0.18, 0.18)]}
    />,
    <RockMesh
      key="side"
      geometry={context.rock('side', { detail: 1, roughness: 0.3 })}
      color={varyColor(color, random, 0.08)}
      position={[range(random, 0.06, 0.09), main * 0.5, range(random, -0.04, 0.04)]}
      scale={[main * 0.7, main * 0.8, main * 0.6]}
      rotation={[0, random() * TWO_PI, 0]}
    />,
  ]
}

function buildDragonStone(random, { color, context }) {
  // Rough, clay-coloured rock with dark holes and crevices.
  const size = range(random, 0.075, 0.095)
  const holes = Array.from({ length: intRange(random, 4, 7) }, (_, index) => {
    const angle = random() * TWO_PI
    return (
      <mesh key={index} position={[Math.cos(angle) * size * 0.78, size * range(random, 0.3, 0.9), Math.sin(angle) * size * 0.78]}>
        <icosahedronGeometry args={[size * range(random, 0.1, 0.18), 0]} />
        <FlatMaterial color="#5a4432" roughness={1} />
      </mesh>
    )
  })
  return [
    <RockMesh
      key="rock"
      geometry={context.rock('dragon', { detail: 1, roughness: 0.3 })}
      color={color}
      position={[0, size * 0.6, 0]}
      scale={[size, size * range(random, 0.8, 1), size * 0.9]}
      rotation={[0, random() * TWO_PI, 0]}
    />,
    ...holes,
  ]
}

function buildRockFormation(random, { color, context }) {
  // Several rocks stacked into a small cliff: big ones at the bottom, smaller on top.
  const count = intRange(random, 4, 6)
  return Array.from({ length: count }, (_, index) => {
    const level = index < 3 ? 0 : 1
    const size = level === 0 ? range(random, 0.07, 0.1) : range(random, 0.05, 0.075)
    const angle = (index / 3) * TWO_PI + random()
    const distance = level === 0 ? range(random, 0.05, 0.1) : range(random, 0, 0.05)
    return (
      <RockMesh
        key={index}
        geometry={context.rock(`formation-${index}`, { detail: 1, roughness: 0.3 })}
        color={varyColor(color, random, 0.1)}
        position={[Math.cos(angle) * distance, size * 0.6 + level * 0.1, Math.sin(angle) * distance]}
        scale={[size * range(random, 0.9, 1.3), size * range(random, 0.8, 1.4), size]}
        rotation={[range(random, -0.2, 0.2), random() * TWO_PI, range(random, -0.2, 0.2)]}
      />
    )
  })
}

// ---------- Accents ----------

function buildPineCone(random, { color }) {
  // Rings of woody scales around a short axis, lying slightly tilted.
  const rings = 5
  return [
    <group key="cone" position={[0, 0.03, 0]} rotation={[range(random, 1.1, 1.4), random() * TWO_PI, 0]}>
      {Array.from({ length: rings }, (_, ring) =>
        Array.from({ length: 7 }, (_, index) => {
          const t = ring / (rings - 1)
          return (
            <Leaf
              key={`${ring}-${index}`}
              shape="oval"
              position={[0, (t - 0.5) * 0.07, 0]}
              yaw={(index / 7) * TWO_PI + ring * 0.45}
              pitch={0.5 - t * 0.7}
              length={0.028 * (1 - Math.abs(t - 0.35) * 0.8)}
              width={0.02}
              color={varyColor(color, random, 0.1)}
            />
          )
        }),
      )}
    </group>,
  ]
}

function buildMushrooms(random, { color }) {
  return Array.from({ length: 3 }, (_, index) => {
    const angle = (index / 3) * TWO_PI + random() * 0.8
    const distance = index === 0 ? 0 : range(random, 0.03, 0.05)
    const height = range(random, 0.03, 0.06) * (index === 0 ? 1.3 : 1)
    const capRadius = height * range(random, 0.55, 0.75)
    return (
      <group key={index} position={[Math.cos(angle) * distance, 0, Math.sin(angle) * distance]} rotation={[range(random, -0.15, 0.15), 0, range(random, -0.15, 0.15)]}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[capRadius * 0.25, capRadius * 0.32, height, 6]} />
          <FlatMaterial color="#efe6d6" roughness={0.6} />
        </mesh>
        <mesh position={[0, height, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[capRadius, 8, 3, 0, TWO_PI, 0, Math.PI / 2]} />
          <FlatMaterial color={varyColor(color, random, 0.08)} roughness={0.5} />
        </mesh>
        {Array.from({ length: 3 }, (_, dot) => {
          const dotAngle = random() * TWO_PI
          return (
            <mesh key={dot} position={[Math.cos(dotAngle) * capRadius * 0.55, height + capRadius * 0.42, Math.sin(dotAngle) * capRadius * 0.55]}>
              <icosahedronGeometry args={[capRadius * 0.14, 0]} />
              <FlatMaterial color="#f6f1e7" roughness={0.6} />
            </mesh>
          )
        })}
      </group>
    )
  })
}

function buildCoconutHide(random, { color }) {
  // Half a coconut shell lying open side down, with an entrance cut out of the side.
  const radius = range(random, 0.07, 0.085)
  return [
    <group key="shell" rotation={[0, random() * TWO_PI, 0]}>
      <mesh scale={[1, 0.8, 1]}>
        <sphereGeometry args={[radius, 9, 4, 0.9, TWO_PI - 0.9, 0, Math.PI / 2]} />
        <FlatMaterial color={color} roughness={1} side={DoubleSide} />
      </mesh>
    </group>,
  ]
}

function buildGlowMushrooms(random, { color }) {
  // Thin pale stems with small caps that glow softly.
  return Array.from({ length: intRange(random, 4, 6) }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = index === 0 ? 0 : range(random, 0.02, 0.045)
    const height = range(random, 0.025, 0.05)
    const capRadius = range(random, 0.009, 0.014)
    return (
      <group key={index} position={[Math.cos(angle) * distance, 0, Math.sin(angle) * distance]} rotation={[range(random, -0.2, 0.2), 0, range(random, -0.2, 0.2)]}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[capRadius * 0.2, capRadius * 0.3, height, 5]} />
          <FlatMaterial color="#e8e2d0" roughness={0.6} />
        </mesh>
        <mesh position={[0, height, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[capRadius, 7, 3, 0, TWO_PI, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.4} flatShading />
        </mesh>
      </group>
    )
  })
}

function buildMiniPond(random, { color, context }) {
  // Shallow dish with still water, edged with small pebbles.
  const radius = range(random, 0.11, 0.13)
  const pebbles = intRange(random, 9, 13)
  return [
    <mesh key="dish" position={[0, 0.008, 0]}>
      <cylinderGeometry args={[radius * 1.05, radius * 0.9, 0.016, 12]} />
      <FlatMaterial color="#6f6a60" roughness={0.9} />
    </mesh>,
    <mesh key="water" position={[0, 0.0175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius * 0.95, 12]} />
      <meshStandardMaterial color={color} roughness={0.08} metalness={0.3} transparent opacity={0.85} />
    </mesh>,
    ...Array.from({ length: pebbles }, (_, index) => {
      const angle = (index / pebbles) * TWO_PI + random() * 0.3
      const size = range(random, 0.014, 0.022)
      return (
        <RockMesh
          key={`pebble-${index}`}
          geometry={context.rock(`pond-${index}`, { detail: 0, roughness: 0.15 })}
          color={varyColor('#9c978c', random, 0.12)}
          position={[Math.cos(angle) * radius * 1.05, 0.012, Math.sin(angle) * radius * 1.05]}
          scale={[size, size * 0.7, size]}
        />
      )
    }),
  ]
}

function buildCorkBackground(random, { item, color, context }) {
  // Tall, curved wall of cork bark: several overlapping slabs in an arc.
  const { height, radius } = item.climbable
  const top = context.trunkPoints(height, 1)[1]
  const tilt = [Math.atan2(top.z, height), -Math.atan2(top.x, height)]
  return Array.from({ length: 3 }, (_, index) => {
    const slabHeight = height * range(random, 0.75, 1)
    return (
      <group key={index} rotation={[tilt[0], 0, tilt[1]]}>
        <mesh position={[0, slabHeight / 2, 0]} rotation={[0, (index - 1) * 0.8 + random() * 0.2, 0]}>
          <cylinderGeometry args={[radius * 1.2, radius * 1.35, slabHeight, 7, 5, true, 0, Math.PI * 0.55]} />
          <FlatMaterial color={varyColor(color, random, 0.1)} roughness={1} side={DoubleSide} />
        </mesh>
      </group>
    )
  })
}

const builders = {
  branch: buildBranch,
  corkTube: buildCorkTube,
  corkFlat: buildCorkFlat,
  mossPole: buildMossPole,
  spiderWood: buildSpiderWood,
  manzanita: buildManzanita,
  rootStump: buildRootStump,
  mossyLog: buildMossyLog,
  barkChunks: buildBarkChunks,
  twigs: buildTwigs,
  leafLitter: buildLeafLitter,
  riverStones: buildRiverStones,
  lavaRock: buildLavaRock,
  mossyPebble: buildMossyPebble,
  seiryuStone: buildSeiryuStone,
  dragonStone: buildDragonStone,
  rockFormation: buildRockFormation,
  pineCone: buildPineCone,
  mushrooms: buildMushrooms,
  coconutHide: buildCoconutHide,
  glowMushrooms: buildGlowMushrooms,
  miniPond: buildMiniPond,
  corkBackground: buildCorkBackground,
}

export default function DecorationPlaceholder({ item, seed = item.id }) {
  const built = useMemo(() => {
    const random = createRandom(seedFromString(seed))
    const shape = getPlantShape(item, seed)
    const context = createContext(item, seed)
    const build = builders[item.placeholder] ?? buildRiverStones
    return {
      geometries: context.geometries,
      scale: [shape.growth * shape.width, shape.growth * shape.height, shape.growth * shape.width],
      content: build(random, { item, color: varyColor(item.swatch, random, 0.1, shape.hue), context }),
    }
  }, [item, seed])

  // Free generated geometry when the object is removed or rebuilt.
  useEffect(() => () => built.geometries.forEach((geometry) => geometry.dispose()), [built])

  return <group scale={built.scale}>{built.content}</group>
}
