import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, TubeGeometry, Vector3 } from 'three'
import { chance, createRandom, getPlantShape, range, seedFromString, varyColor } from './variation.js'
import { FlatMaterial, Leaf } from './PlantPlaceholder.jsx'
import MergedModel from '../objects/MergedModel.jsx'
import { findItem } from '../../data/objectCategories.js'
import { getSupportPath, rotateAroundY } from '../../utils/organicShapes.js'

// A climbing plant growing up a support (branch, cork tube, moss pole): a vine runs from
// the plant's base over the soil to the support and spirals up it, carrying leaves in the
// plant's own style. Drawn in scene units relative to the plant's base, so it is placed
// outside the plant's rotated / scaled model.

const TWO_PI = Math.PI * 2

// Leaf per climbing species (low-poly leaf shapes from leafGeometry.js). `flat` leaves are
// pressed against the support (Marcgravia); the others stick out. Sizes are multiplied by
// the plant's size.
const CLIMB_STYLES = {
  pothos: { shape: 'heart', length: 0.085, width: 0.068, spacing: 0.055, stem: '#6d7d3e', turnHeight: 0.28, useAccent: 0.3 },
  creepingFig: { shape: 'heart', length: 0.034, width: 0.03, spacing: 0.022, stem: '#6d6a45', turnHeight: 0.18, useAccent: 0 },
  marcgravia: { shape: 'round', flat: true, length: 0.055, width: 0.055, spacing: 0.026, stem: '#5b6b3c', turnHeight: 0.35, useAccent: 0 },
  pitcher: { shape: 'lance', length: 0.13, width: 0.045, spacing: 0.07, stem: '#6a7a3a', turnHeight: 0.3, useAccent: 0 },
}
const DEFAULT_STYLE = CLIMB_STYLES.creepingFig

// Points of the vine: over the soil to the support, then a spiral around it that follows the
// support's organic lean and bow. Several climbers on one support start at evenly spread
// angles, so their spirals interleave instead of piling up.
function createVinePath(random, support, sizeScale, style) {
  const { dx, dz, distance, radius, height } = support
  const supportItem = findItem('decoration', support.supportItemId)
  const path = supportItem ? getSupportPath(supportItem, support.instanceId) : () => ({ x: 0, z: 0 })
  // Centre of the support at height y (scene units), including its lean and rotation.
  const centerAt = (y) => {
    const offset = rotateAroundY(path(Math.min(1, y / height)), support.rotationY ?? 0)
    return { x: dx + offset.x * support.offsetScale, z: dz + offset.z * support.offsetScale }
  }
  const directionX = dx / (distance || 1)
  const directionZ = dz / (distance || 1)
  const groundLength = Math.max(0, distance - radius * 1.1)
  const points = []

  const groundSteps = Math.max(1, Math.round(groundLength / 0.05))
  for (let step = 0; step <= groundSteps; step++) {
    const t = step / groundSteps
    const wobble = Math.sin(t * Math.PI) * 0.02 * (random() - 0.5)
    points.push({ position: new Vector3(directionX * groundLength * t - directionZ * wobble, 0.01, directionZ * groundLength * t + directionX * wobble), outward: null })
  }

  // The vine reaches the support on the side facing the plant, then (when it shares the
  // support) creeps around the base to its own starting angle.
  const facingAngle = Math.atan2(-dz, -dx)
  const count = Math.max(1, support.climberCount ?? 1)
  const startAngle = facingAngle + ((support.climberIndex ?? 0) / count) * TWO_PI
  const surface = radius * 1.12 + 0.004
  const baseCenter = centerAt(0)
  const bridgeSteps = Math.ceil(Math.abs(startAngle - facingAngle) / 0.6)
  for (let step = 1; step <= bridgeSteps; step++) {
    const angle = facingAngle + ((startAngle - facingAngle) * step) / bridgeSteps
    points.push({ position: new Vector3(baseCenter.x + Math.cos(angle) * surface, 0.015, baseCenter.z + Math.sin(angle) * surface), outward: null })
  }

  // Later climbers stop a little lower, so the tops do not all end in one spot.
  const climbHeight = height * range(random, 0.7, 0.95) * (1 - (support.climberIndex ?? 0) * 0.08)
  const turns = climbHeight / (style.turnHeight * sizeScale)
  const climbSteps = Math.max(4, Math.round(climbHeight / (style.spacing * 0.8 * Math.max(sizeScale, 0.5))))
  const direction = chance(random, 0.5) ? 1 : -1
  for (let step = 1; step <= climbSteps; step++) {
    const t = step / climbSteps
    const y = 0.02 + t * climbHeight
    const angle = startAngle + direction * t * turns * TWO_PI
    const center = centerAt(y)
    points.push({
      position: new Vector3(center.x + Math.cos(angle) * surface, y, center.z + Math.sin(angle) * surface),
      outward: angle,
    })
  }
  return points
}

function ClimbLeaf({ style, size, color, outward, groundAngle, random }) {
  // Yaw so the leaf points away from the support (or along the ground runner).
  const yaw = outward === null ? groundAngle : Math.atan2(Math.cos(outward), Math.sin(outward))
  const common = { shape: style.shape, length: style.length * size, width: style.width * size, color, yaw }
  if (style.flat) {
    // Pressed flat against the support surface (pointing up), overlapping like roof tiles.
    return <Leaf {...common} pitch={outward === null ? 0.05 : Math.PI / 2 - 0.25} />
  }
  return <Leaf {...common} pitch={outward === null ? 0.1 : range(random, -0.3, 0.35)} />
}

// Stable key for a support, so the vine is only rebuilt when the support really changes.
const supportKey = (support) =>
  [support.instanceId, support.dx, support.dz, support.radius, support.height, support.rotationY, support.climberIndex, support.climberCount].map((value) => (typeof value === 'number' ? value.toFixed(3) : value)).join(':')

export default function ClimbingGrowth({ plant, seed, support, sizeScale }) {
  const key = supportKey(support)
  const content = useMemo(() => {
    const random = createRandom(seedFromString(`${seed}:climb`))
    const shape = getPlantShape(plant, seed)
    const style = CLIMB_STYLES[plant.placeholder] ?? DEFAULT_STYLE
    const color = varyColor(plant.swatch, random, 0.14, shape.hue)
    const accent = varyColor(plant.accent ?? plant.swatch, random, 0.1, shape.hue)
    const leafScale = sizeScale * (shape.growth / (plant.baseSize ?? 1.15))
    const points = createVinePath(random, support, sizeScale, style)

    const curve = new CatmullRomCurve3(points.map((point) => point.position))
    const stem = new TubeGeometry(curve, Math.max(8, points.length * 3), 0.0035 * Math.max(sizeScale, 0.6), 4, false)

    const leaves = []
    points.forEach((point, index) => {
      if (index === 0) return
      const previous = points[index - 1].position
      const groundAngle = Math.atan2(point.position.x - previous.x, point.position.z - previous.z)
      const pairs = style.flat ? [0] : [-1, 1]
      pairs.forEach((side) => {
        if (!style.flat && chance(random, 0.25)) return
        const leafColor = varyColor(chance(random, style.useAccent) ? accent : color, random, 0.1)
        const offsetAngle = point.outward === null ? 0 : point.outward + side * 0.35
        leaves.push(
          <group key={`${index}-${side}`} position={point.position}>
            <ClimbLeaf
              style={style}
              size={leafScale * range(random, 0.8, 1.2)}
              color={leafColor}
              outward={point.outward === null ? null : offsetAngle}
              groundAngle={groundAngle + side * 1.1}
              random={random}
            />
          </group>,
        )
      })
      // Pitcher plants carry a few hanging pitchers along the vine.
      if (plant.placeholder === 'pitcher' && point.outward !== null && index % 4 === 0) {
        leaves.push(
          <mesh key={`pitcher-${index}`} position={[point.position.x + Math.cos(point.outward) * 0.03, point.position.y - 0.03, point.position.z + Math.sin(point.outward) * 0.03]}>
            <cylinderGeometry args={[0.018 * leafScale, 0.012 * leafScale, 0.06 * leafScale, 8, 1, true]} />
            <FlatMaterial color={accent} roughness={0.5} side={DoubleSide} />
          </mesh>,
        )
      }
    })

    return { stem, stemColor: style.stem, leaves }
    // `key` stands in for `support`, whose object identity changes on every render.
  }, [plant, seed, key, sizeScale]) // eslint-disable-line react-hooks/exhaustive-deps

  // Free the previous vine geometry when it is rebuilt or removed.
  useEffect(() => () => content.stem.dispose(), [content])

  // Merged into a few meshes for performance (a vine has many small leaves).
  return (
    <MergedModel mergeKey={`${seed}:${key}:${sizeScale}`}>
      <mesh geometry={content.stem}>
        <FlatMaterial color={content.stemColor} />
      </mesh>
      {content.leaves}
    </MergedModel>
  )
}
