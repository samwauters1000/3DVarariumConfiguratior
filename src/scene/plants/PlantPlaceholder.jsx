import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { chance, createRandom, getPlantShape, intRange, pickOne, range, richColor, seedFromString, varyColor } from './variation.js'
import { getLeafGeometry, getLeafSurfacePoint } from './leafGeometry.js'

// Plant models built in code, in the low-poly style of 3DStylePlants.jpg: flat-shaded
// facets, real leaf outlines (oval, lance, sword, round, heart, monstera), folded leaves,
// thin stems and matte materials. Every model starts at y = 0 (the soil surface).
//
// Each builder receives a seeded random generator, so every plant instance has its own
// natural variation: leaf count, leaf length and width, angles and colour shades.

const TWO_PI = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const STEM_COLOR = '#6f7f45'
// Leaves are drawn a bit larger than their nominal size: in the reference style leaves are
// big and clearly defined compared to the stems.
const LEAF_SCALE = 1.3

// ---------- Building blocks ----------

// Matte, flat-shaded material: the facets show, like in the style reference.
export function FlatMaterial({ color, roughness = 0.8, metalness = 0, side }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} flatShading side={side} />
}

// One leaf. It grows from `position` along its own length: `yaw` turns it around the
// vertical axis, `pitch` raises the tip above horizontal (negative = hanging), `roll`
// tilts it sideways.
export function Leaf({ shape = 'oval', length, width, color, position, yaw = 0, pitch = 0, roll = 0, children, metalness }) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group rotation={[-pitch, 0, roll]}>
        <mesh geometry={getLeafGeometry(shape)} scale={[width * LEAF_SCALE, width * LEAF_SCALE, length * LEAF_SCALE]}>
          <FlatMaterial color={color} side={DoubleSide} metalness={metalness} roughness={metalness ? 0.35 : 0.8} />
        </mesh>
        {/* Details that follow the leaf (veins, speckles) in the same scaled space. */}
        {children && <group scale={[width * LEAF_SCALE, width * LEAF_SCALE, length * LEAF_SCALE]}>{children}</group>}
      </group>
    </group>
  )
}

// Thin, slightly tapering stem along +y.
function Stem({ length, radius = 0.006, color = STEM_COLOR, position = [0, 0, 0] }) {
  return (
    <mesh position={[position[0], position[1] + length / 2, position[2]]}>
      <cylinderGeometry args={[radius * 0.7, radius, length, 5]} />
      <FlatMaterial color={color} />
    </mesh>
  )
}

// A leaf on its own stalk (petiole): the stalk leans `lean` rad away from vertical in the
// `yaw` direction; the leaf at its tip points `pitch` above horizontal (world angle).
function StalkedLeaf({ yaw, lean, stemLength, stemColor, stemRadius, leaf }) {
  return (
    <group rotation={[0, yaw, 0]}>
      <group rotation={[lean, 0, 0]}>
        <Stem length={stemLength} radius={stemRadius} color={stemColor} />
        {/* Inside the leaning frame, "forward" is tilted down by `lean`; compensate. */}
        <Leaf {...leaf} position={[0, stemLength, 0]} pitch={(leaf.pitch ?? 0) + lean} />
      </group>
    </group>
  )
}

// Feathery frond (ferns): a stalk with pairs of small leaflets that get shorter to the tip.
function Frond({ random, yaw, lean, length, pairs, leafletLength, leafletWidth, color, metalness }) {
  return (
    <group rotation={[0, yaw, 0]}>
      <group rotation={[lean, 0, 0]}>
        <Stem length={length} radius={0.004} color={varyColor(STEM_COLOR, random, 0.1)} />
        {Array.from({ length: pairs }, (_, index) => {
          const t = (index + 1) / (pairs + 1)
          const size = 1 - t * 0.65
          return [-1, 1].map((side) => (
            <Leaf
              key={`${index}-${side}`}
              shape="lance"
              position={[0, t * length, 0]}
              yaw={(side * Math.PI) / 2}
              pitch={0.35 + t * 0.3}
              length={leafletLength * size * range(random, 0.85, 1.15)}
              width={leafletWidth * size}
              color={varyColor(color, random, 0.08)}
              metalness={metalness}
            />
          ))
        })}
      </group>
    </group>
  )
}

// Roughly even angles around the plant with irregular spacing, so leaves do not look
// arranged by a machine.
const spreadAngles = (random, count, jitter = 0.4) =>
  Array.from({ length: count }, (_, index) => (index / count) * TWO_PI + (random() - 0.5) * jitter * 2.2)

// Runners that creep over the soil from the centre, curving randomly. Returns points
// (x, z, angle) along each runner; used by creeping and small climbing plants.
function createRunners(random, { count, steps, stepLength }) {
  return Array.from({ length: count }, () => {
    let angle = random() * TWO_PI
    let x = 0
    let z = 0
    const points = []
    const length = intRange(random, steps[0], steps[1])
    for (let step = 0; step < length; step++) {
      angle += (random() - 0.5) * 0.7
      x += Math.cos(angle) * stepLength
      z += Math.sin(angle) * stepLength
      points.push({ x, z, angle })
    }
    return points
  })
}

// Leaf yaw that points along a runner direction (runners use x = cos, z = sin).
const yawAlong = (angle) => Math.atan2(Math.cos(angle), Math.sin(angle))

// Thin line along the middle of a leaf (veins), in the leaf's unscaled space.
function Midrib({ shape, color, emissive = false }) {
  const points = [0.12, 0.35, 0.6, 0.85].map((t) => getLeafSurfacePoint(shape, 0, t))
  return points.map((point, index) => (
    <mesh key={index} position={point} scale={[0.035, 0.02, 0.26]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={emissive ? color : '#000000'} emissiveIntensity={emissive ? 0.35 : 0} roughness={0.5} />
    </mesh>
  ))
}

// ---------- Small plants ----------

function buildFittonia(random, { color, accent }) {
  const rings = intRange(random, 2, 3)
  const leaves = []
  for (let ring = 0; ring < rings; ring++) {
    const count = intRange(random, 5, 8) - ring
    spreadAngles(random, count, 0.5).forEach((angle, index) => {
      const size = range(random, 0.8, 1.2) * (1 - ring * 0.15)
      leaves.push(
        <Leaf
          key={`${ring}-${index}`}
          shape="oval"
          position={[0, 0.02 + ring * 0.035, 0]}
          yaw={angle + ring * 0.4}
          pitch={0.1 + ring * 0.3 + random() * 0.15}
          length={0.11 * size}
          width={0.075 * size}
          color={varyColor(index % 2 ? color : accent, random, 0.1)}
        />,
      )
    })
  }
  return leaves
}

function buildMoss(random, { color }) {
  const count = intRange(random, 6, 10)
  return Array.from({ length: count }, (_, index) => {
    const distance = index === 0 ? 0 : range(random, 0.05, 0.17)
    const angle = random() * TWO_PI
    const radius = range(random, 0.06, 0.12)
    return (
      <mesh
        key={index}
        position={[Math.cos(angle) * distance, 0, Math.sin(angle) * distance]}
        scale={[radius, radius * range(random, 0.45, 0.7), radius]}
        rotation={[0, random() * TWO_PI, 0]}
      >
        <sphereGeometry args={[1, 7, 4, 0, TWO_PI, 0, Math.PI / 2]} />
        <FlatMaterial color={varyColor(color, random, 0.12)} roughness={1} />
      </mesh>
    )
  })
}

function buildPilea(random, { color }) {
  // Dome of small round leaves, each facing outwards.
  const count = intRange(random, 24, 38)
  const domeRadius = range(random, 0.12, 0.17)
  const domeHeight = range(random, 0.12, 0.18)
  return Array.from({ length: count }, (_, index) => {
    const heightRatio = index / count
    const ringRadius = Math.sqrt(1 - heightRatio * heightRatio)
    const angle = index * GOLDEN_ANGLE
    const size = range(random, 0.035, 0.05)
    return (
      <Leaf
        key={index}
        shape="round"
        position={[Math.cos(angle) * ringRadius * domeRadius * 0.7, heightRatio * domeHeight + 0.02, Math.sin(angle) * ringRadius * domeRadius * 0.7]}
        yaw={yawAlong(angle)}
        pitch={0.2 + heightRatio * 0.9}
        length={size}
        width={size}
        color={varyColor(color, random, 0.1)}
      />
    )
  })
}

// Tiny leaves along runners over the soil.
function buildCreeper(random, { color, stemColor, count, steps, stepLength, leafShape, leafSize, pitch = 0.05 }) {
  const runners = createRunners(random, { count, steps, stepLength })
  return runners.flatMap((runner, runnerIndex) =>
    runner.flatMap((point, index) => [
      <mesh
        key={`stem-${runnerIndex}-${index}`}
        position={[point.x - (Math.cos(point.angle) * stepLength) / 2, 0.005, point.z - (Math.sin(point.angle) * stepLength) / 2]}
        rotation={[0, -point.angle, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.003, 0.003, stepLength, 4]} />
        <FlatMaterial color={stemColor} />
      </mesh>,
      ...[-1, 1].map((side) => {
        const size = leafSize * range(random, 0.8, 1.2)
        return (
          <Leaf
            key={`leaf-${runnerIndex}-${index}-${side}`}
            shape={leafShape}
            position={[point.x, 0.008, point.z]}
            yaw={yawAlong(point.angle) + side * range(random, 0.9, 1.4)}
            pitch={pitch}
            length={size}
            width={size * 0.9}
            color={varyColor(color, random, 0.1)}
          />
        )
      }),
    ]),
  )
}

const buildPileaGlauca = (random, { color }) =>
  buildCreeper(random, { color, stemColor: '#9c4a45', count: intRange(random, 4, 7), steps: [3, 7], stepLength: 0.035, leafShape: 'round', leafSize: 0.028 })

const buildCreepingFig = (random, { color }) =>
  buildCreeper(random, { color, stemColor: '#6d6a45', count: intRange(random, 3, 6), steps: [3, 6], stepLength: 0.04, leafShape: 'heart', leafSize: 0.036 })

function buildMarcgravia(random, { color }) {
  // Shingling climber: flat round leaves overlapping like roof tiles along its runners.
  const runners = createRunners(random, { count: intRange(random, 2, 4), steps: [3, 6], stepLength: 0.04 })
  return runners.flatMap((runner, runnerIndex) =>
    runner.map((point, index) => {
      const size = range(random, 0.05, 0.065)
      return (
        <Leaf
          key={`${runnerIndex}-${index}`}
          shape="round"
          position={[point.x, 0.006 + index * 0.003, point.z]}
          yaw={yawAlong(point.angle)}
          pitch={0.08}
          length={size}
          width={size}
          color={varyColor(color, random, 0.1)}
        />
      )
    }),
  )
}

function buildPeacockFern(random, { color, accent }) {
  // Low mound of lacy fronds with a blue, iridescent sheen.
  const count = intRange(random, 9, 14)
  return spreadAngles(random, count, 0.5).map((angle, index) => (
    <Frond
      key={index}
      random={random}
      yaw={angle}
      lean={range(random, 1.0, 1.35)}
      length={range(random, 0.09, 0.15)}
      pairs={intRange(random, 4, 6)}
      leafletLength={0.035}
      leafletWidth={0.018}
      color={chance(random, 0.4) ? accent : color}
      metalness={0.3}
    />
  ))
}

function buildAirPlant(random, { color }) {
  const count = intRange(random, 10, 16)
  return spreadAngles(random, count, 0.5).map((angle, index) => (
    <Leaf
      key={index}
      shape="sword"
      position={[0, 0.02, 0]}
      yaw={angle}
      pitch={range(random, 0.5, 1.2)}
      length={range(random, 0.16, 0.28)}
      width={range(random, 0.025, 0.035)}
      color={varyColor(color, random, 0.1)}
    />
  ))
}

function buildEcheveria(random, { color }) {
  // Tight rosette of thick, pointed leaves: flat outside, upright in the centre.
  const rings = intRange(random, 3, 4)
  const leaves = []
  for (let ring = 0; ring < rings; ring++) {
    const count = Math.max(5, intRange(random, 9, 12) - ring * 2)
    const size = (1 - ring * 0.2) * range(random, 0.9, 1.15)
    spreadAngles(random, count, 0.15).forEach((angle, index) => {
      leaves.push(
        <Leaf
          key={`${ring}-${index}`}
          shape="oval"
          position={[0, 0.015 + ring * 0.02, 0]}
          yaw={angle + ring * 0.35}
          pitch={0.15 + ring * 0.4}
          length={0.1 * size}
          width={0.06 * size}
          color={varyColor(color, random, 0.06)}
        />,
      )
    })
  }
  return leaves
}

function buildCactus(random, { color }) {
  const bodies = [{ x: 0, z: 0, height: range(random, 0.16, 0.28), radius: range(random, 0.07, 0.1) }]
  // Some cacti grow small side shoots (pups).
  const pups = chance(random, 0.5) ? intRange(random, 1, 2) : 0
  for (let index = 0; index < pups; index++) {
    const angle = random() * TWO_PI
    bodies.push({ x: Math.cos(angle) * 0.11, z: Math.sin(angle) * 0.11, height: range(random, 0.07, 0.11), radius: range(random, 0.035, 0.05) })
  }
  const ribs = intRange(random, 7, 10)
  return bodies.map((body, bodyIndex) => (
    <group key={bodyIndex} position={[body.x, 0, body.z]}>
      {/* Faceted body: the flat segments read as ribs. */}
      <mesh position={[0, body.height * 0.45, 0]}>
        <cylinderGeometry args={[body.radius * 0.95, body.radius, body.height * 0.9, ribs]} />
        <FlatMaterial color={varyColor(color, random, 0.08)} roughness={0.7} />
      </mesh>
      <mesh position={[0, body.height * 0.9, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[body.radius * 0.95, ribs, 3, 0, TWO_PI, 0, Math.PI / 2]} />
        <FlatMaterial color={varyColor(color, random, 0.08)} roughness={0.7} />
      </mesh>
      {bodyIndex === 0 && chance(random, 0.6) && (
        <mesh position={[0, body.height * 0.9 + body.radius * 0.55, 0]}>
          <dodecahedronGeometry args={[0.024, 0]} />
          <FlatMaterial color={varyColor('#e7a4b4', random, 0.1)} roughness={0.5} />
        </mesh>
      )}
    </group>
  ))
}

// ---------- Medium plants ----------

function buildFern(random, { color }) {
  const count = intRange(random, 10, 15)
  return spreadAngles(random, count, 0.4).map((angle, index) => (
    <Frond
      key={index}
      random={random}
      yaw={angle}
      lean={range(random, 0.3, 1.0)}
      length={range(random, 0.28, 0.42)}
      pairs={intRange(random, 10, 13)}
      leafletLength={0.095}
      leafletWidth={0.04}
      color={color}
    />
  ))
}

function buildPeperomia(random, { color }) {
  const count = intRange(random, 6, 10)
  return spreadAngles(random, count, 0.5).map((angle, index) => {
    const size = range(random, 0.09, 0.13)
    return (
      <StalkedLeaf
        key={index}
        yaw={angle}
        lean={range(random, 0.2, 0.6)}
        stemLength={range(random, 0.1, 0.22)}
        leaf={{ shape: 'round', length: size, width: size * 0.9, pitch: range(random, 0.1, 0.4), color: varyColor(color, random, 0.1) }}
      />
    )
  })
}

function buildOrchid(random, { color }) {
  const leafCount = intRange(random, 3, 5)
  const spikeHeight = range(random, 0.3, 0.42)
  const flowerCount = intRange(random, 2, 5)
  const lean = range(random, 0.1, 0.3)
  const leaves = spreadAngles(random, leafCount, 0.6).map((angle, index) => (
    <Leaf
      key={`leaf-${index}`}
      shape="oval"
      position={[0, 0.02, 0]}
      yaw={angle}
      pitch={range(random, 0.05, 0.3)}
      length={range(random, 0.14, 0.2)}
      width={range(random, 0.07, 0.09)}
      color={varyColor(color, random, 0.08)}
    />
  ))
  const flowers = Array.from({ length: flowerCount }, (_, index) => {
    const t = 1 - index * 0.12
    return (
      <group key={`flower-${index}`} position={[0.02 + index * 0.03, spikeHeight * t, Math.sin(lean) * spikeHeight * 0.4 + index * 0.028]}>
        {/* Five petals around a pink lip */}
        {Array.from({ length: 5 }, (_, petal) => (
          <Leaf key={petal} shape="round" yaw={(petal / 5) * TWO_PI} pitch={0.25} length={0.028} width={0.026} color={varyColor('#f6eef2', random, 0.04)} />
        ))}
        <mesh position={[0, 0.004, 0]}>
          <dodecahedronGeometry args={[0.009, 0]} />
          <FlatMaterial color="#d98aa6" roughness={0.4} />
        </mesh>
      </group>
    )
  })
  return [
    ...leaves,
    <group key="spike" rotation={[lean, 0, 0]}>
      <Stem length={spikeHeight} radius={0.005} color="#6d7a4a" position={[0, 0, 0.03]} />
    </group>,
    ...flowers,
  ]
}

function buildBromeliad(random, { color, accent }) {
  // Rosette of long strap leaves with a bright red heart.
  const count = intRange(random, 12, 18)
  return spreadAngles(random, count, 0.3).map((angle, index) => {
    const inner = index % 3 === 0
    return (
      <Leaf
        key={index}
        shape="sword"
        position={[0, 0.02, 0]}
        yaw={angle}
        pitch={inner ? range(random, 0.9, 1.25) : range(random, 0.35, 0.8)}
        length={range(random, 0.16, 0.26) * (inner ? 0.7 : 1)}
        width={range(random, 0.045, 0.06)}
        color={varyColor(inner ? accent : color, random, 0.1)}
      />
    )
  })
}

// ---------- Large plants ----------

function buildCroton(random, { color, accent }) {
  // Upright woody stem with stiff, colourful leaves spiralling up.
  const stemHeight = range(random, 0.32, 0.48)
  const count = intRange(random, 9, 15)
  const palette = [color, accent, '#d9a334', '#c4562f', '#8a3a2a']
  const leaves = Array.from({ length: count }, (_, index) => {
    const t = index / count
    const length = range(random, 0.13, 0.2) * (1 - t * 0.35)
    return (
      <Leaf
        key={index}
        shape="lance"
        position={[0, 0.05 + t * stemHeight, 0]}
        yaw={index * GOLDEN_ANGLE + random() * 0.5}
        pitch={range(random, -0.3, 0.45)}
        length={length}
        width={length * 0.38}
        color={varyColor(pickOne(random, palette), random, 0.12)}
      />
    )
  })
  return [<Stem key="stem" length={stemHeight + 0.06} radius={0.014} color="#6b5a3c" />, ...leaves]
}

function buildPothos(random, { color, accent }) {
  // Climbing its own moss pole, with one or two strands trailing over the soil.
  const poleHeight = range(random, 0.45, 0.62)
  const leafCount = intRange(random, 7, 12)
  const leafColor = () => varyColor(chance(random, 0.3) ? accent : color, random, 0.12)
  const climbing = Array.from({ length: leafCount }, (_, index) => {
    const t = index / leafCount
    const size = range(random, 0.08, 0.11)
    return (
      <Leaf
        key={`climb-${index}`}
        shape="heart"
        position={[0, 0.05 + t * (poleHeight - 0.05), 0]}
        yaw={index * 2.1 + random() * 0.6}
        pitch={range(random, -0.2, 0.3)}
        length={size}
        width={size * 0.8}
        color={leafColor()}
      />
    )
  })
  const trailing = createRunners(random, { count: intRange(random, 1, 2), steps: [3, 5], stepLength: 0.05 }).flatMap((runner, runnerIndex) =>
    runner.map((point, index) => (
      <Leaf
        key={`trail-${runnerIndex}-${index}`}
        shape="heart"
        position={[point.x, 0.01, point.z]}
        yaw={yawAlong(point.angle) + (index % 2 ? 0.8 : -0.8)}
        pitch={0.05}
        length={0.07}
        width={0.056}
        color={leafColor()}
      />
    )),
  )
  return [
    <mesh key="pole" position={[0, poleHeight / 2, 0]}>
      <cylinderGeometry args={[0.022, 0.026, poleHeight, 7]} />
      <FlatMaterial color="#7a6a4a" roughness={1} />
    </mesh>,
    ...climbing,
    ...trailing,
  ]
}

function buildPhilodendronVerrucosum(random, { color, accent }) {
  // Tall reddish stalks carrying large velvety heart leaves that hang down, with pale veins.
  const count = intRange(random, 3, 5)
  return spreadAngles(random, count, 0.5).map((angle, index) => {
    const size = range(random, 0.2, 0.28)
    return (
      <StalkedLeaf
        key={index}
        yaw={angle}
        lean={range(random, 0.15, 0.45)}
        stemLength={range(random, 0.28, 0.5)}
        stemColor={varyColor('#8a4a3e', random, 0.1)}
        leaf={{
          shape: 'heart',
          length: size,
          width: size * 0.8,
          pitch: range(random, -1.1, -0.6),
          color: varyColor(color, random, 0.08),
          children: <Midrib shape="heart" color={accent} />,
        }}
      />
    )
  })
}

// ---------- Special (rare) plants ----------

function buildJewelOrchid(random, { color, accent }) {
  const count = intRange(random, 5, 8)
  return spreadAngles(random, count, 0.5).map((angle, index) => {
    const size = range(random, 0.85, 1.2)
    return (
      <Leaf
        key={index}
        shape="oval"
        position={[0, 0.02 + (index % 2) * 0.02, 0]}
        yaw={angle}
        pitch={range(random, 0.15, 0.55)}
        length={0.13 * size}
        width={0.085 * size}
        color={varyColor(color, random, 0.04)}
      >
        <Midrib shape="oval" color={accent} emissive />
      </Leaf>
    )
  })
}

function buildPitcherPlant(random, { color, accent }) {
  const leafCount = intRange(random, 4, 7)
  const pitcherCount = intRange(random, 2, 4)
  const leaves = spreadAngles(random, leafCount, 0.5).map((angle, index) => (
    <Leaf
      key={`leaf-${index}`}
      shape="lance"
      position={[0, 0.02, 0]}
      yaw={angle}
      pitch={range(random, 0.3, 0.8)}
      length={range(random, 0.16, 0.24)}
      width={range(random, 0.05, 0.07)}
      color={varyColor(color, random, 0.1)}
    />
  ))
  const pitchers = spreadAngles(random, pitcherCount, 0.8).map((angle, index) => {
    const size = range(random, 0.75, 1.25)
    const pitcherColor = varyColor(accent, random, 0.12)
    return (
      <group key={`pitcher-${index}`} rotation={[0, angle + 0.5, 0]}>
        <group position={[0, 0.06 * size, range(random, 0.12, 0.17)]} scale={size}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.02, 0.09, 8, 1, true]} />
            <FlatMaterial color={pitcherColor} roughness={0.5} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.045, 0]}>
            <sphereGeometry args={[0.02, 8, 3, 0, TWO_PI, Math.PI / 2, Math.PI / 2]} />
            <FlatMaterial color={pitcherColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.047, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.028, 0.005, 4, 8]} />
            <FlatMaterial color="#6e2a28" roughness={0.4} />
          </mesh>
        </group>
      </group>
    )
  })
  return [...leaves, ...pitchers]
}

function buildHaworthia(random, { color, accent }) {
  // Tight rosette of thick, upright, pointed leaves; some leaves striped pale.
  const rings = [
    { count: intRange(random, 8, 12), pitch: [0.55, 0.85], length: [0.11, 0.15] },
    { count: intRange(random, 5, 7), pitch: [1.0, 1.3], length: [0.12, 0.16] },
  ]
  return rings.flatMap((ring, ringIndex) =>
    spreadAngles(random, ring.count, 0.3).map((angle, index) => (
      <Leaf
        key={`${ringIndex}-${index}`}
        shape="sword"
        position={[0, 0.01, 0]}
        yaw={angle + ringIndex * 0.3}
        pitch={range(random, ...ring.pitch)}
        length={range(random, ...ring.length)}
        width={range(random, 0.035, 0.045)}
        color={chance(random, 0.35) ? accent : varyColor(color, random, 0.08)}
      />
    )),
  )
}

function buildMonstera(random, { color, accent }) {
  // Thai Constellation: split monstera leaves on long stalks, speckled with cream.
  const count = intRange(random, 4, 7)
  return spreadAngles(random, count, 0.5).map((angle, index) => {
    const size = range(random, 0.15, 0.22)
    const speckles = Array.from({ length: intRange(random, 3, 6) }, (_, speck) => (
      <mesh key={speck} position={getLeafSurfacePoint('monstera', range(random, -0.5, 0.5), range(random, 0.15, 0.8))} scale={[range(random, 0.1, 0.18), 0.02, range(random, 0.06, 0.12)]}>
        <boxGeometry args={[1, 1, 1]} />
        <FlatMaterial color={accent} roughness={0.6} />
      </mesh>
    ))
    return (
      <StalkedLeaf
        key={index}
        yaw={angle}
        lean={range(random, 0.25, 0.55)}
        stemLength={range(random, 0.18, 0.32)}
        stemColor="#56733f"
        leaf={{ shape: 'monstera', length: size, width: size * 0.95, pitch: range(random, -0.35, 0.25), color: varyColor(color, random, 0.08), children: speckles }}
      />
    )
  })
}

function buildAnthurium(random, { color, accent }) {
  // Queen Anthurium: very long, narrow, velvety leaves hanging from arching stalks.
  const count = intRange(random, 2, 4)
  return spreadAngles(random, count, 0.7).map((angle, index) => {
    const length = range(random, 0.22, 0.32)
    return (
      <StalkedLeaf
        key={index}
        yaw={angle}
        lean={range(random, 0.3, 0.5)}
        stemLength={range(random, 0.34, 0.48)}
        stemColor="#4a5f3c"
        leaf={{
          shape: 'heart',
          length,
          width: length * 0.38,
          pitch: range(random, -1.35, -1.0),
          color: varyColor(color, random, 0.04),
          children: <Midrib shape="heart" color={accent} />,
        }}
      />
    )
  })
}

// ---------- Second round of plants ----------

function buildLithops(random, { color, accent }) {
  // Clusters of "living stones": two fat half-domes split by a narrow gap.
  const count = intRange(random, 2, 5)
  return Array.from({ length: count }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = index === 0 ? 0 : range(random, 0.035, 0.07)
    const size = range(random, 0.022, 0.032)
    const tint = varyColor(chance(random, 0.35) ? accent : color, random, 0.1)
    return (
      <group key={index} position={[Math.cos(angle) * distance, 0, Math.sin(angle) * distance]} rotation={[0, random() * TWO_PI, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * size * 0.55, size * 0.7, 0]} scale={[size * 0.9, size * 1.25, size]}>
            <icosahedronGeometry args={[1, 1]} />
            <FlatMaterial color={tint} roughness={0.6} />
          </mesh>
        ))}
      </group>
    )
  })
}

function buildStringOfPearls(random, { color }) {
  // Strands of small round "pearls" trailing over the ground.
  const runners = createRunners(random, { count: intRange(random, 4, 7), steps: [4, 8], stepLength: 0.03 })
  return runners.flatMap((runner, runnerIndex) =>
    runner.map((point, index) => (
      <mesh key={`${runnerIndex}-${index}`} position={[point.x, 0.012, point.z]}>
        <icosahedronGeometry args={[range(random, 0.009, 0.013), 0]} />
        <FlatMaterial color={varyColor(color, random, 0.1)} roughness={0.5} />
      </mesh>
    )),
  )
}

function buildBirdsNestFern(random, { color }) {
  // Vase of wide, upright, glossy fronds.
  const count = intRange(random, 8, 12)
  return spreadAngles(random, count, 0.3).map((angle, index) => (
    <Leaf
      key={index}
      shape="lance"
      position={[0, 0.02, 0]}
      yaw={angle}
      pitch={range(random, 0.75, 1.2)}
      roll={range(random, -0.2, 0.2)}
      length={range(random, 0.2, 0.3)}
      width={range(random, 0.07, 0.09)}
      color={varyColor(color, random, 0.1)}
      metalness={0.05}
    />
  ))
}

function buildMaidenhair(random, { color }) {
  // Thin dark stems arching out, each carrying small fan-shaped leaflets.
  const count = intRange(random, 7, 11)
  return spreadAngles(random, count, 0.5).map((angle, index) => {
    const length = range(random, 0.16, 0.26)
    const leaflets = intRange(random, 5, 8)
    return (
      <group key={index} rotation={[0, angle, 0]}>
        <group rotation={[range(random, 0.35, 0.8), 0, 0]}>
          <Stem length={length} radius={0.0025} color="#2a2420" />
          {Array.from({ length: leaflets }, (_, leaf) => {
            const t = (leaf + 1) / (leaflets + 1)
            return (
              <Leaf
                key={leaf}
                shape="round"
                position={[0, t * length, 0]}
                yaw={(leaf % 2 ? 1 : -1) * range(random, 1.2, 1.8)}
                pitch={0.3}
                length={0.03 * (1 - t * 0.3)}
                width={0.034 * (1 - t * 0.3)}
                color={varyColor(color, random, 0.08)}
              />
            )
          })}
        </group>
      </group>
    )
  })
}

function buildAloe(random, { color, accent }) {
  // Rosette of thick, pointed leaves with pale speckles.
  const count = intRange(random, 8, 12)
  return spreadAngles(random, count, 0.3).flatMap((angle, index) => {
    const length = range(random, 0.14, 0.2)
    const pitch = range(random, 0.55, 1.05)
    return [
      <Leaf
        key={index}
        shape="sword"
        position={[0, 0.01, 0]}
        yaw={angle}
        pitch={pitch}
        length={length}
        width={range(random, 0.045, 0.06)}
        color={varyColor(color, random, 0.08)}
      >
        {[0.25, 0.45, 0.65].map((t) => (
          <mesh key={t} position={getLeafSurfacePoint('sword', range(random, -0.3, 0.3), t)} scale={[0.08, 0.03, 0.04]}>
            <boxGeometry args={[1, 1, 1]} />
            <FlatMaterial color={accent} />
          </mesh>
        ))}
      </Leaf>,
    ]
  })
}

function buildXerographica(random, { color, accent }) {
  // Silvery rosette whose long leaves curl outward and down, with a pink blush in the centre.
  const count = intRange(random, 14, 20)
  return spreadAngles(random, count, 0.3).map((angle, index) => {
    const inner = index % 4 === 0
    return (
      <Leaf
        key={index}
        shape="sword"
        position={[0, 0.03, 0]}
        yaw={angle}
        pitch={inner ? range(random, 0.6, 1.0) : range(random, -0.25, 0.3)}
        roll={range(random, -0.3, 0.3)}
        length={range(random, 0.18, 0.26) * (inner ? 0.7 : 1)}
        width={range(random, 0.035, 0.05)}
        color={varyColor(inner ? accent : color, random, 0.08)}
      />
    )
  })
}

const builders = {
  fern: buildFern,
  fittonia: buildFittonia,
  moss: buildMoss,
  peperomia: buildPeperomia,
  pilea: buildPilea,
  airPlant: buildAirPlant,
  echeveria: buildEcheveria,
  cactus: buildCactus,
  orchid: buildOrchid,
  jewelOrchid: buildJewelOrchid,
  pitcher: buildPitcherPlant,
  haworthia: buildHaworthia,
  monstera: buildMonstera,
  anthurium: buildAnthurium,
  croton: buildCroton,
  pothos: buildPothos,
  verrucosum: buildPhilodendronVerrucosum,
  bromeliad: buildBromeliad,
  pileaGlauca: buildPileaGlauca,
  creepingFig: buildCreepingFig,
  marcgravia: buildMarcgravia,
  peacockFern: buildPeacockFern,
  lithops: buildLithops,
  stringOfPearls: buildStringOfPearls,
  birdsNestFern: buildBirdsNestFern,
  maidenhair: buildMaidenhair,
  aloe: buildAloe,
  xerographica: buildXerographica,
}

// `seed` is normally the plant instance id, so each placed plant is unique but stable.
export default function PlantPlaceholder({ plant, seed = plant.id }) {
  const { content, scale, rotation } = useMemo(() => {
    const random = createRandom(seedFromString(seed))
    const shape = getPlantShape(plant, seed)
    const build = builders[plant.placeholder] ?? buildMoss
    // One colour shift for the whole plant, then small differences per leaf in the builders.
    const colors = {
      color: varyColor(richColor(plant.swatch), random, 0.14, shape.hue),
      accent: varyColor(richColor(plant.accent ?? '#c9d6bc', 0.08), random, 0.1, shape.hue),
    }
    return {
      // Own size and proportions (tall and narrow, or low and wide), and a slight lean.
      scale: [shape.growth * shape.width, shape.growth * shape.height, shape.growth * shape.width],
      rotation: [Math.cos(shape.leanDirection) * shape.lean, 0, Math.sin(shape.leanDirection) * shape.lean],
      content: build(random, colors),
    }
  }, [seed, plant])

  return (
    <group rotation={rotation} scale={scale}>
      {content}
    </group>
  )
}
