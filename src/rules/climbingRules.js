import { findItem } from '../data/objectCategories.js'
import { getPlantShape } from '../utils/variation.js'
import { getFootprint, getPlantingArea, toNormalized, toWorld, validatePlacement } from './placementRules.js'

// Climbing plants (habit: 'climbing') grow up a climbable decoration item (branch, cork,
// moss pole, spider wood) when they are placed right next to it. Without a support nearby
// they creep over the soil. Supports are organic (they lean and bow); the vine follows the
// same path (utils/organicShapes.js). Several climbers on one support spread around it.

// Extra distance (scene units) between the edges of plant and support that still counts
// as "next to it".
export const CLIMB_REACH = 0.12

export const isClimbingPlant = (item) => item?.habit === 'climbing'

// Size of a climbable surface as rendered: the item's `climbable` values scaled by the
// object's own variation, its scale and the container's plant scale. `offsetScale`
// converts the support's path offsets (fractions of its height) to scene units.
function getSupportSize(item, instance, terrarium) {
  const shape = getPlantShape(item, instance.instanceId)
  const containerScale = terrarium.plantScale ?? 1
  const sideways = shape.growth * shape.width * instance.scale.x * containerScale
  return {
    height: item.climbable.height * shape.growth * shape.height * instance.scale.y * containerScale,
    radius: item.climbable.radius * sideways,
    offsetScale: item.climbable.height * sideways,
  }
}

// For automatic placement: a free spot right next to a climbable item, so a newly added
// climber starts climbing straight away. Returns a normalised position or null.
export function findSpotNextToSupport({ configuration, terrarium, radius, obstacles }) {
  const area = getPlantingArea(terrarium)
  for (const decoration of configuration.decoration) {
    const item = findItem('decoration', decoration.id)
    if (!item?.climbable) continue
    const center = toWorld(area, decoration.position)
    const supportRadius = getFootprint(item, decoration.scale.x, terrarium, decoration.instanceId)
    const distance = (radius + supportRadius) * 0.75
    for (let step = 0; step < 12; step++) {
      const angle = (step / 12) * Math.PI * 2 + Math.PI / 2
      const position = toNormalized(area, { x: center.x + Math.cos(angle) * distance, z: center.z + Math.sin(angle) * distance })
      if (validatePlacement({ terrarium, position, radius, obstacles }).valid) return position
    }
  }
  return null
}

// Nearest climbable decoration within reach of a climbing plant, or null.
function findNearestSupport(configuration, terrarium, plantInstance, plantItem) {
  const area = getPlantingArea(terrarium)
  const plantWorld = toWorld(area, plantInstance.position)
  const plantRadius = getFootprint(plantItem, plantInstance.scale.x, terrarium, plantInstance.instanceId)

  let best = null
  for (const decoration of configuration.decoration) {
    const item = findItem('decoration', decoration.id)
    if (!item?.climbable) continue
    const world = toWorld(area, decoration.position)
    const dx = world.x - plantWorld.x
    const dz = world.z - plantWorld.z
    const distance = Math.hypot(dx, dz)
    const reach = plantRadius + getFootprint(item, decoration.scale.x, terrarium, decoration.instanceId) + CLIMB_REACH
    if (distance > reach || (best && distance >= best.distance)) continue
    best = { decoration, item, dx, dz, distance }
  }
  return best
}

// The support a climbing plant grows on, or null. Includes the offset from the plant to
// the support base, the surface radius, the climbable height, the support's organic path
// (item + seed + rotation) and this climber's place among all climbers on that support.
export function findClimbingSupport(configuration, terrarium, plantInstance, plantItem) {
  if (!terrarium || !isClimbingPlant(plantItem)) return null
  const nearest = findNearestSupport(configuration, terrarium, plantInstance, plantItem)
  if (!nearest) return null

  // Other climbers on the same support, in the order they were added.
  const sharing = configuration.plants.filter((instance) => {
    const item = findItem('plants', instance.id)
    if (!isClimbingPlant(item)) return false
    if (instance.instanceId === plantInstance.instanceId) return true
    return findNearestSupport(configuration, terrarium, instance, item)?.decoration.instanceId === nearest.decoration.instanceId
  })

  return {
    instanceId: nearest.decoration.instanceId,
    name: nearest.item.name,
    supportItemId: nearest.item.id,
    rotationY: nearest.decoration.rotation.y,
    dx: nearest.dx,
    dz: nearest.dz,
    distance: nearest.distance,
    ...getSupportSize(nearest.item, nearest.decoration, terrarium),
    climberIndex: sharing.findIndex((instance) => instance.instanceId === plantInstance.instanceId),
    climberCount: sharing.length,
  }
}
