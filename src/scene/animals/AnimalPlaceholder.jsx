import { useMemo } from 'react'
import { IcosahedronGeometry } from 'three'
import { createRandom, getPlantShape, intRange, range, seedFromString, varyColor } from '../plants/variation.js'
import { FlatMaterial } from '../plants/PlantPlaceholder.jsx'
import { getColorVariant } from '../../data/animals.js'

// Cute low-poly animals built in code, in the faceted, matte "paper sculpture" style of
// 3DStyleAnimalCritters.jpg and 3DStyleFrog.jpg: large irregular flat facets, matte
// surfaces and (added in ObjectModel) a colour fade towards the feet. Colours come from the
// chosen colour variant. Every animal faces +z; its own pose varies per instance.

const TWO_PI = Math.PI * 2
const MATTE = 0.78

// Faceted ball geometry with slightly irregular facets (shared vertices move together, so
// there are no cracks). Cached per detail level; `scale` on the mesh squashes it.
const facetCache = new Map()
function getFacetGeometry(detail, jitter) {
  const key = `${detail}:${jitter}`
  if (facetCache.has(key)) return facetCache.get(key)
  const geometry = new IcosahedronGeometry(1, detail)
  const position = geometry.attributes.position
  const offsets = new Map()
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)
    const id = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`
    if (!offsets.has(id)) {
      // Deterministic pseudo-random offset per vertex.
      const hash = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
      offsets.set(id, 1 + (hash - Math.floor(hash) - 0.5) * jitter)
    }
    const factor = offsets.get(id)
    position.setXYZ(index, x * factor, y * factor, z * factor)
  }
  geometry.computeVertexNormals()
  facetCache.set(key, geometry)
  return geometry
}

// Low-poly faceted ball, squashed with `scale`.
function Blob({ color, radius, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], detail = 1, roughness = MATTE, smooth = false }) {
  return (
    <mesh position={position} scale={scale.map((value) => value * radius)} rotation={rotation} geometry={getFacetGeometry(detail, smooth ? 0 : 0.22)}>
      <FlatMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

// Shiny black eye with a white highlight (reads as "cute" at small sizes). Eyes stay round
// and glossy against the matte, faceted body.
function Eye({ position, radius }) {
  return (
    <group position={position}>
      <Blob color="#141414" radius={radius} roughness={0.2} detail={2} smooth />
      <Blob color="#ffffff" radius={radius * 0.32} position={[radius * 0.35, radius * 0.4, radius * 0.6]} detail={1} roughness={0.2} smooth />
    </group>
  )
}

function Limb({ color, from, to, radius }) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const length = Math.hypot(dx, dy, dz)
  // Cylinder along y, rotated to point from `from` to `to`.
  const pitch = Math.acos(dy / length)
  const yaw = Math.atan2(dx, dz)
  return (
    <group position={from} rotation={[0, yaw, 0]}>
      <group rotation={[pitch, 0, 0]}>
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[radius * 0.8, radius, length, 5]} />
          <FlatMaterial color={color} roughness={MATTE} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Animals ----------

function buildSnail(random, { body, accent, detail }) {
  const shell = range(random, 0.042, 0.05)
  const turns = 3
  return [
    // Soft body along the ground, head raised at the front.
    <Blob key="foot" color={body} radius={0.03} position={[0, 0.014, 0.01]} scale={[0.85, 0.45, 2.1]} />,
    <Blob key="head" color={body} radius={0.02} position={[0, 0.03, 0.062]} scale={[1, 1.1, 1.1]} />,
    // Eye stalks with tiny eyes on top.
    ...[-1, 1].map((side) => (
      <group key={`stalk-${side}`}>
        <Limb color={body} from={[side * 0.008, 0.042, 0.068]} to={[side * 0.016, 0.075, 0.078]} radius={0.0035} />
        <Eye position={[side * 0.016, 0.077, 0.079]} radius={0.0055} />
      </group>
    )),
    // Spiral shell: shrinking rings of balls winding inwards.
    <group key="shell" position={[0, 0.05, -0.012]} rotation={[0, 0, range(random, -0.15, 0.15)]}>
      <Blob color={accent} radius={shell} scale={[0.75, 1, 1]} />
      {Array.from({ length: 10 }, (_, index) => {
        const t = index / 10
        const angle = t * turns * TWO_PI * 0.5
        const distance = shell * (1 - t) * 0.72
        return (
          <Blob
            key={index}
            color={index % 2 ? detail : accent}
            radius={shell * (0.36 - t * 0.26)}
            position={[shell * 0.62, Math.sin(angle) * distance, Math.cos(angle) * distance]}
            scale={[0.4, 1, 1]}
          />
        )
      })}
    </group>,
  ]
}

function buildFrog(random, { body, accent, detail }) {
  // Chubby sitting frog with big eyes and dark spots.
  const spots = intRange(random, 4, 7)
  return [
    <Blob key="body" color={body} radius={0.04} position={[0, 0.034, -0.005]} scale={[1, 0.85, 1.15]} rotation={[-0.35, 0, 0]} />,
    <Blob key="head" color={body} radius={0.034} position={[0, 0.058, 0.03]} scale={[1.15, 0.8, 1]} />,
    ...[-1, 1].map((side) => <Eye key={`eye-${side}`} position={[side * 0.022, 0.078, 0.038]} radius={0.011} />),
    // Legs: folded back legs and small front legs.
    ...[-1, 1].map((side) => <Blob key={`hind-${side}`} color={body} radius={0.02} position={[side * 0.036, 0.016, -0.02]} scale={[0.8, 0.6, 1.4]} />),
    ...[-1, 1].map((side) => <Blob key={`front-${side}`} color={body} radius={0.011} position={[side * 0.028, 0.01, 0.04]} scale={[1, 0.6, 1.3]} />),
    // Dark pattern spots on the back.
    ...Array.from({ length: spots }, (_, index) => {
      const angle = random() * TWO_PI
      return (
        <Blob
          key={`spot-${index}`}
          color={index % 3 === 0 ? detail : accent}
          radius={range(random, 0.006, 0.011)}
          position={[Math.cos(angle) * 0.025, 0.06 + random() * 0.01, -0.01 + Math.sin(angle) * 0.025]}
          scale={[1, 0.5, 1]}
          detail={0}
        />
      )
    }),
  ]
}

function buildGecko(random, { body, accent, detail }) {
  // Little crested gecko: long body, big head with crests, curled tail, splayed legs.
  const curl = range(random, 0.6, 1.2)
  const tail = Array.from({ length: 7 }, (_, index) => {
    const t = (index + 1) / 7
    const angle = t * curl
    return (
      <Blob
        key={`tail-${index}`}
        color={body}
        radius={0.018 * (1 - t * 0.7)}
        position={[Math.sin(angle) * 0.06 * t, 0.018, -0.05 - Math.cos(angle) * 0.06 * t]}
        detail={0}
      />
    )
  })
  return [
    <Blob key="body" color={body} radius={0.028} position={[0, 0.022, 0]} scale={[0.9, 0.6, 1.9]} />,
    <Blob key="belly" color={accent} radius={0.024} position={[0, 0.016, 0]} scale={[0.85, 0.35, 1.7]} />,
    <Blob key="head" color={body} radius={0.028} position={[0, 0.03, 0.062]} scale={[1.05, 0.8, 1.15]} />,
    // Crests above the eyes and along the back.
    ...[-1, 1].map((side) => <Blob key={`crest-${side}`} color={accent} radius={0.009} position={[side * 0.019, 0.05, 0.062]} scale={[0.6, 0.6, 1.8]} detail={0} />),
    ...[-1, 1].map((side) => <Eye key={`eye-${side}`} position={[side * 0.022, 0.038, 0.074]} radius={0.0095} />),
    ...[0.02, -0.01, -0.035].map((z) => <Blob key={`ridge-${z}`} color={accent} radius={0.006} position={[0, 0.038, z]} detail={0} />),
    // Four splayed legs with round toe pads.
    ...[
      [1, 0.03],
      [-1, 0.03],
      [1, -0.035],
      [-1, -0.035],
    ].map(([side, z]) => (
      <group key={`leg-${side}-${z}`}>
        <Limb color={body} from={[side * 0.02, 0.018, z]} to={[side * 0.045, 0.005, z + 0.012]} radius={0.006} />
        <Blob color={detail} radius={0.005} position={[side * 0.047, 0.004, z + 0.014]} detail={0} />
      </group>
    )),
    ...tail,
  ]
}

function buildIsopods(random, colors) {
  // A few rolly pollies: segmented, dome-shaped bodies, one of them rolled into a ball.
  const count = intRange(random, 3, 5)
  return Array.from({ length: count }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = index === 0 ? 0 : range(random, 0.025, 0.05)
    const position = [Math.cos(angle) * distance, 0, Math.sin(angle) * distance]
    if (index === count - 1) {
      return <Blob key={index} color={colors.body} radius={0.011} position={[position[0], 0.011, position[2]]} detail={1} />
    }
    const color = index % 2 && colors.accent ? colors.accent : colors.body
    return (
      <group key={index} position={position} rotation={[0, random() * TWO_PI, 0]}>
        {Array.from({ length: 6 }, (_, segment) => (
          <Blob
            key={segment}
            color={segment % 2 ? varyColor(color, random, 0.06) : color}
            radius={0.009 * (1 - Math.abs(segment - 2.5) / 6)}
            position={[0, 0.005, (segment - 2.5) * 0.0055]}
            scale={[1.3, 0.7, 0.7]}
            detail={0}
          />
        ))}
        <Blob color={colors.detail} radius={0.003} position={[0, 0.004, 0.018]} detail={0} />
      </group>
    )
  })
}

function buildSpringtails(random, { body, accent }) {
  // Many tiny, pale specks scattered over the soil.
  return Array.from({ length: intRange(random, 12, 20) }, (_, index) => {
    const angle = random() * TWO_PI
    const distance = Math.sqrt(random()) * 0.06
    return (
      <Blob
        key={index}
        color={index % 3 ? body : accent}
        radius={range(random, 0.0025, 0.004)}
        position={[Math.cos(angle) * distance, 0.003, Math.sin(angle) * distance]}
        scale={[1, 0.7, 1.6]}
        rotation={[0, random() * TWO_PI, 0]}
        detail={0}
      />
    )
  })
}

function buildSpider(random, { body, accent, detail }) {
  // Fluffy jumping spider: round body, big front eyes, eight short legs.
  return [
    <Blob key="abdomen" color={body} radius={0.02} position={[0, 0.022, -0.018]} scale={[1, 0.85, 1.2]} />,
    <Blob key="stripe" color={accent} radius={0.012} position={[0, 0.036, -0.02]} scale={[0.5, 0.3, 1.2]} detail={0} />,
    <Blob key="head" color={body} radius={0.016} position={[0, 0.022, 0.012]} scale={[1.1, 0.85, 1]} />,
    <Blob key="fang-left" color={detail} radius={0.004} position={[-0.005, 0.014, 0.027]} detail={0} />,
    <Blob key="fang-right" color={detail} radius={0.004} position={[0.005, 0.014, 0.027]} detail={0} />,
    ...[-1, 1].map((side) => <Eye key={`eye-${side}`} position={[side * 0.007, 0.026, 0.026]} radius={0.0055} />),
    ...Array.from({ length: 8 }, (_, index) => {
      const side = index < 4 ? -1 : 1
      const row = index % 4
      const z = 0.018 - row * 0.009
      const reach = [0.036, 0.032, 0.03, 0.034][row]
      return (
        <group key={`leg-${index}`}>
          <Limb color={body} from={[side * 0.01, 0.02, z]} to={[side * reach * 0.6, 0.03, z + 0.006 - row * 0.004]} radius={0.0025} />
          <Limb color={body} from={[side * reach * 0.6, 0.03, z + 0.006 - row * 0.004]} to={[side * reach, 0.002, z + 0.01 - row * 0.009]} radius={0.002} />
        </group>
      )
    }),
  ]
}

function buildMillipede(random, { body, accent, detail }) {
  // Shiny millipede curled into a loose spiral, with tiny legs under each segment.
  const segments = intRange(random, 14, 18)
  const start = random() * TWO_PI
  return Array.from({ length: segments }, (_, index) => {
    const t = index / segments
    const angle = start + t * TWO_PI * 1.3
    const distance = 0.022 + t * 0.035
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance
    return (
      <group key={index} position={[x, 0, z]} rotation={[0, -angle, 0]}>
        <Blob color={index % 2 ? body : varyColor(body, random, 0.05)} radius={0.0085} position={[0, 0.008, 0]} scale={[1, 0.9, 1.2]} detail={0} roughness={0.3} />
        <Blob color={accent} radius={0.003} position={[0.006, 0.012, 0]} detail={0} />
        {index === segments - 1 && <Eye position={[0, 0.011, 0.009]} radius={0.003} />}
        <mesh position={[0, 0.001, 0]}>
          <boxGeometry args={[0.001, 0.002, 0.022]} />
          <FlatMaterial color={detail} />
        </mesh>
      </group>
    )
  })
}

// Big coloured eye (red-eyed tree frog), with a black pupil and a highlight.
function ColoredEye({ position, radius, color }) {
  return (
    <group position={position}>
      <Blob color={color} radius={radius} roughness={0.25} detail={2} smooth />
      <Blob color="#111111" radius={radius * 0.5} position={[0, 0, radius * 0.62]} scale={[0.5, 1, 0.5]} detail={1} roughness={0.2} smooth />
      <Blob color="#ffffff" radius={radius * 0.25} position={[radius * 0.3, radius * 0.45, radius * 0.7]} detail={1} roughness={0.2} smooth />
    </group>
  )
}

function buildTreeFrog(random, { body, accent, detail }) {
  // Slim tree frog clinging low, with red eyes, blue flanks and orange toe pads.
  return [
    <Blob key="body" color={body} radius={0.036} position={[0, 0.03, -0.004]} scale={[1, 0.75, 1.25]} rotation={[-0.25, 0, 0]} />,
    <Blob key="flank-left" color={detail} radius={0.02} position={[-0.026, 0.026, -0.006]} scale={[0.5, 0.7, 1.3]} detail={0} />,
    <Blob key="flank-right" color={detail} radius={0.02} position={[0.026, 0.026, -0.006]} scale={[0.5, 0.7, 1.3]} detail={0} />,
    <Blob key="head" color={body} radius={0.03} position={[0, 0.048, 0.032]} scale={[1.2, 0.75, 1]} />,
    ...[-1, 1].map((side) => <ColoredEye key={`eye-${side}`} position={[side * 0.024, 0.066, 0.038]} radius={0.013} color={accent} />),
    ...[
      [1, 0.04],
      [-1, 0.04],
      [1, -0.035],
      [-1, -0.035],
    ].map(([side, z]) => (
      <group key={`leg-${side}-${z}`}>
        <Limb color={body} from={[side * 0.024, 0.02, z]} to={[side * 0.048, 0.004, z + (z > 0 ? 0.012 : -0.01)]} radius={0.006} />
        <Blob color={accent} radius={0.0065} position={[side * 0.05, 0.004, z + (z > 0 ? 0.014 : -0.012)]} detail={0} />
      </group>
    )),
  ]
}

function buildChameleon(random, { body, accent, detail }) {
  // Pygmy chameleon: tall narrow body with a crest, cone eyes, curled tail, grasping feet.
  const tail = Array.from({ length: 9 }, (_, index) => {
    const t = index / 8
    const angle = t * Math.PI * 1.6
    const radius = 0.028 * (1 - t * 0.6)
    return (
      <Blob
        key={`tail-${index}`}
        color={index % 2 ? detail : body}
        radius={0.009 * (1 - t * 0.6)}
        position={[0, 0.03 - Math.sin(angle) * radius + radius, -0.05 - Math.cos(angle) * radius + radius * 0.3]}
        detail={0}
      />
    )
  })
  return [
    <Blob key="body" color={body} radius={0.03} position={[0, 0.042, 0]} scale={[0.6, 1, 1.4]} />,
    <Blob key="stripe" color={accent} radius={0.02} position={[0, 0.034, 0]} scale={[0.66, 0.35, 1.5]} detail={0} />,
    ...[0.02, 0, -0.02].map((z) => <Blob key={`crest-${z}`} color={detail} radius={0.006} position={[0, 0.072, z]} scale={[0.6, 1.4, 1]} detail={0} />),
    <Blob key="head" color={body} radius={0.022} position={[0, 0.05, 0.045]} scale={[0.8, 1, 1.2]} />,
    <Blob key="casque" color={detail} radius={0.012} position={[0, 0.066, 0.038]} scale={[0.6, 1, 1.4]} detail={0} />,
    ...[-1, 1].map((side) => (
      <group key={`eye-${side}`}>
        <Blob color={body} radius={0.009} position={[side * 0.016, 0.054, 0.05]} scale={[1, 1, 1]} detail={0} />
        <Eye position={[side * 0.022, 0.055, 0.053]} radius={0.004} />
      </group>
    )),
    ...[
      [1, 0.025],
      [-1, 0.025],
      [1, -0.02],
      [-1, -0.02],
    ].map(([side, z]) => <Limb key={`leg-${side}-${z}`} color={body} from={[side * 0.012, 0.03, z]} to={[side * 0.024, 0.003, z + 0.006]} radius={0.0045} />),
    ...tail,
  ]
}

function buildHermitCrab(random, { body, accent, detail }) {
  // Little crab peeking out of a spiral shell, with two claws and eye stalks.
  return [
    <group key="shell" position={[0, 0.034, -0.014]} rotation={[0.3, 0, range(random, -0.2, 0.2)]}>
      <Blob color={accent} radius={0.034} scale={[1, 0.9, 1.15]} />
      {Array.from({ length: 6 }, (_, index) => {
        const t = index / 6
        return (
          <Blob
            key={index}
            color={index % 2 ? detail : accent}
            radius={0.02 * (1 - t * 0.6)}
            position={[0, 0.02 + t * 0.018, -0.012 - t * 0.02]}
            detail={0}
          />
        )
      })}
    </group>,
    <Blob key="body" color={body} radius={0.016} position={[0, 0.016, 0.024]} scale={[1.3, 0.7, 1]} detail={0} />,
    ...[-1, 1].map((side) => (
      <group key={`claw-${side}`}>
        <Blob color={body} radius={side > 0 ? 0.012 : 0.009} position={[side * 0.02, 0.014, 0.038]} scale={[1, 0.7, 1.2]} detail={0} />
      </group>
    )),
    ...[-1, 1].map((side) => (
      <group key={`stalk-${side}`}>
        <Limb color={body} from={[side * 0.006, 0.02, 0.03]} to={[side * 0.01, 0.036, 0.036]} radius={0.002} />
        <Eye position={[side * 0.01, 0.038, 0.037]} radius={0.0035} />
      </group>
    )),
    ...Array.from({ length: 6 }, (_, index) => {
      const side = index < 3 ? -1 : 1
      const z = 0.024 - (index % 3) * 0.009
      return <Limb key={`leg-${index}`} color={body} from={[side * 0.012, 0.012, z]} to={[side * 0.03, 0.002, z - 0.004]} radius={0.0022} />
    }),
  ]
}

const builders = {
  snail: buildSnail,
  frog: buildFrog,
  gecko: buildGecko,
  isopods: buildIsopods,
  springtails: buildSpringtails,
  spider: buildSpider,
  millipede: buildMillipede,
  treeFrog: buildTreeFrog,
  chameleon: buildChameleon,
  hermitCrab: buildHermitCrab,
}

export default function AnimalPlaceholder({ item, seed = item.id, variant }) {
  const content = useMemo(() => {
    const random = createRandom(seedFromString(seed))
    const shape = getPlantShape(item, seed)
    const colors = getColorVariant(item, variant)?.colors ?? { body: item.swatch, accent: item.swatch, detail: '#222222' }
    const build = builders[item.placeholder] ?? buildSnail
    return {
      // Animals vary in size but keep their proportions.
      scale: shape.growth,
      nodes: build(random, colors),
    }
  }, [item, seed, variant])

  return <group scale={content.scale}>{content.nodes}</group>
}
