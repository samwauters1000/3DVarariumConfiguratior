import { findItem, getAllInstances, PLACEABLE_CATEGORY_IDS } from '../data/objectCategories.js'
import { findTerrarium } from '../data/catalogue.js'
import { getHeartWidthAt } from '../geometry/heart.js'
import { getSpreadFactor } from '../utils/variation.js'
import { getLights } from '../data/equipment.js'

// Placement rules for every placeable object (plants, decoration, animals).
//
// Positions are stored normalised to the terrarium's planting area: x and z run from -1
// to 1 across the area, y is the offset above the soil. This keeps positions meaningful
// when the user switches terrarium; anything that no longer fits is moved (see
// resolvePlacements).

export const PLACEMENT_LIMITS = {
  rotationStep: Math.PI / 8,
  minScale: 0.6,
  // Largest scale per size class: medium and large objects can grow further than small ones.
  maxScaleBySize: { small: 1.5, medium: 2, large: 2.5 },
  scaleStep: 0.15,
  // Foliage may overlap a little: objects collide when their centres are closer than
  // (radius A + radius B) × this factor.
  overlapFactor: 0.6,
  // Part of the footprint that must stay inside the planting area (foliage may lean
  // slightly over the edge of the soil, but not through the glass).
  edgeFactor: 0.6,
}

const DEFAULT_FOOTPRINT = 0.15
const DEFAULT_BASE_SIZE = 1.15

// ---------- Planting area ----------

// Usable soil surface of a terrarium in scene units: a circle or a rectangle.
export function getPlantingArea(terrarium) {
  const { groundShape, soil, drainage } = terrarium.interior
  if (groundShape.type === 'box') {
    return { shape: 'rect', halfX: (groundShape.width / 2) * 0.96, halfZ: (groundShape.depth / 2) * 0.94 }
  }
  if (groundShape.type === 'heart') {
    const surfaceHeight = drainage.height + soil.height
    return {
      shape: 'rect',
      halfX: (getHeartWidthAt(surfaceHeight, groundShape.inset) / 2) * 0.94,
      halfZ: (groundShape.depth / 2) * 0.92,
    }
  }
  // Round containers; faceted ones use their inscribed circle (the flat sides).
  const segments = groundShape.radialSegments
  const inscribed = segments < 24 ? Math.cos(Math.PI / segments) : 1
  const radius = soil.topRadius * inscribed * 0.96
  return { shape: 'round', halfX: radius, halfZ: radius }
}

export const toWorld = (area, position) => ({ x: position.x * area.halfX, z: position.z * area.halfZ })
export const toNormalized = (area, world) => ({ x: world.x / area.halfX, y: 0, z: world.z / area.halfZ })

// Ground radius an object covers, in scene units. With a seed (the instance id) it includes
// that object's own natural spread; without, the species average is used.
export function getFootprint(item, instanceScale = 1, terrarium = null, seed = null) {
  const spread = seed ? getSpreadFactor(item, seed) : 1
  return (item.footprint ?? DEFAULT_FOOTPRINT) * (item.baseSize ?? DEFAULT_BASE_SIZE) * spread * instanceScale * (terrarium?.plantScale ?? 1)
}

function isInsideArea(area, world, radius) {
  const margin = radius * PLACEMENT_LIMITS.edgeFactor
  if (area.shape === 'rect') return Math.abs(world.x) + margin <= area.halfX && Math.abs(world.z) + margin <= area.halfZ
  return Math.hypot(world.x, world.z) + margin <= area.halfX
}

// Moves a position back inside the planting area (used as a last resort).
function clampInside(area, world, radius) {
  const margin = Math.min(radius * PLACEMENT_LIMITS.edgeFactor, area.halfX * 0.9, area.halfZ * 0.9)
  if (area.shape === 'rect') {
    return {
      x: Math.max(-area.halfX + margin, Math.min(area.halfX - margin, world.x)),
      z: Math.max(-area.halfZ + margin, Math.min(area.halfZ - margin, world.z)),
    }
  }
  const limit = area.halfX - margin
  const distance = Math.hypot(world.x, world.z)
  if (distance <= limit) return world
  return { x: (world.x / distance) * limit, z: (world.z / distance) * limit }
}

// ---------- Validation ----------

// Special lights that stand on the soil (e.g. the Glowing Mushroom Lamp) at their fixed spot,
// as { light, position, world, radius }.
export function getLightSpots(configuration, terrarium) {
  const area = getPlantingArea(terrarium)
  return getLights(configuration.lights)
    .filter((light) => light.spot)
    .map((light) => {
      const position = light.spot[area.shape]
      return { light, position, world: toWorld(area, position), radius: light.footprint * (terrarium.plantScale ?? 1) }
    })
}

// Other placed objects as { world, radius } in the given terrarium, optionally excluding one.
// Lights standing on the soil count as obstacles too.
export function getObstacles(configuration, terrarium, excludeInstanceId = null) {
  const area = getPlantingArea(terrarium)
  const objects = getAllInstances(configuration)
    .filter(({ instance }) => instance.instanceId !== excludeInstanceId)
    .map(({ categoryId, instance }) => {
      const item = findItem(categoryId, instance.id)
      return { world: toWorld(area, instance.position), radius: getFootprint(item ?? {}, instance.scale.x, terrarium, instance.instanceId) }
    })
  return [...getLightSpots(configuration, terrarium).map(({ world, radius }) => ({ world, radius })), ...objects]
}

const clearance = (world, radius, obstacles) =>
  obstacles.reduce(
    (smallest, obstacle) =>
      Math.min(smallest, Math.hypot(world.x - obstacle.world.x, world.z - obstacle.world.z) - (radius + obstacle.radius) * PLACEMENT_LIMITS.overlapFactor),
    Infinity,
  )

// Single source of truth for whether an object may stand at a position.
export function validatePlacement({ terrarium, position, radius, obstacles }) {
  const area = getPlantingArea(terrarium)
  const world = toWorld(area, position)
  if (!isInsideArea(area, world, radius)) return { valid: false, reason: 'Keep it inside the terrarium' }
  if (clearance(world, radius, obstacles) < 0) return { valid: false, reason: 'Too close to another object' }
  return { valid: true, reason: null }
}

// ---------- Automatic placement ----------

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Candidate spots spread over the area, nearest to the centre first.
function getCandidates(area) {
  if (area.shape === 'rect') {
    const columns = Math.max(5, Math.round((area.halfX / area.halfZ) * 7))
    const rows = 7
    const points = []
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const offset = row % 2 ? 0.5 : 0
        points.push({ x: ((column + 0.5 + offset * 0.5) / columns) * 2 - 1, z: ((row + 0.5) / rows) * 2 - 1 })
      }
    }
    return points.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
  }
  const count = 80
  return Array.from({ length: count }, (_, index) => {
    const distance = Math.sqrt((index + 0.5) / count)
    const angle = index * GOLDEN_ANGLE
    return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance }
  })
}

// Up to this much free space, more room is preferred; beyond it, spots nearer the centre win.
const COMFORTABLE_CLEARANCE = 0.12

// Picks the most open free spot. Returns null when nothing fits anymore.
export function findFreePlacement({ terrarium, radius, obstacles }) {
  const area = getPlantingArea(terrarium)
  let best = null
  let bestScore = -Infinity
  for (const candidate of getCandidates(area)) {
    const world = toWorld(area, candidate)
    if (!isInsideArea(area, world, radius)) continue
    const room = clearance(world, radius, obstacles)
    if (room < 0) continue
    const score = Math.min(room, COMFORTABLE_CLEARANCE)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best ? { x: best.x, y: 0, z: best.z } : null
}

// Re-checks every placed object after the terrarium changed: objects that no longer fit
// are moved to a free spot (or, if the container is crowded, onto the nearest valid edge).
export function resolvePlacements(configuration) {
  const terrarium = findTerrarium(configuration.terrarium)
  if (!terrarium) return configuration
  const area = getPlantingArea(terrarium)
  // Lights on the soil keep their spot; objects move out of their way.
  const placed = getLightSpots(configuration, terrarium).map(({ world, radius }) => ({ world, radius }))
  const resolved = { ...configuration }

  for (const categoryId of PLACEABLE_CATEGORY_IDS) {
    resolved[categoryId] = configuration[categoryId].map((instance) => {
      const item = findItem(categoryId, instance.id) ?? {}
      const radius = getFootprint(item, instance.scale.x, terrarium, instance.instanceId)
      let position = instance.position
      if (!validatePlacement({ terrarium, position, radius, obstacles: placed }).valid) {
        position =
          findFreePlacement({ terrarium, radius, obstacles: placed }) ??
          toNormalized(area, clampInside(area, toWorld(area, position), radius))
      }
      placed.push({ world: toWorld(area, position), radius })
      return position === instance.position ? instance : { ...instance, position }
    })
  }
  return resolved
}

// ---------- Rotation and scale ----------

// Deterministic, varied rotation so identical objects do not look copy-pasted.
export function getInitialRotation(seed) {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) | 0
  return { x: 0, y: ((hash >>> 0) % 360) * (Math.PI / 180), z: 0 }
}

export const getMaxScale = (item) => PLACEMENT_LIMITS.maxScaleBySize[item?.size] ?? PLACEMENT_LIMITS.maxScaleBySize.small

export const clampScale = (value, item) =>
  Math.min(getMaxScale(item), Math.max(PLACEMENT_LIMITS.minScale, Math.round(value * 100) / 100))

// Whether an object can grow or shrink one step: within the size limits and, when
// growing, without bumping into other objects or the glass.
export function canScaleObject(configuration, categoryId, instance, direction) {
  const item = findItem(categoryId, instance.id) ?? {}
  const next = clampScale(instance.scale.x + direction * PLACEMENT_LIMITS.scaleStep, item)
  if (next === instance.scale.x) return false
  if (direction < 0) return true
  const terrarium = findTerrarium(configuration.terrarium)
  if (!terrarium) return true
  return validatePlacement({
    terrarium,
    position: instance.position,
    radius: getFootprint(item, next, terrarium, instance.instanceId),
    obstacles: getObstacles(configuration, terrarium, instance.instanceId),
  }).valid
}
