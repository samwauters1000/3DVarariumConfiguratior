import { findTerrarium, getGroundName } from '../data/catalogue.js'
import { findItem, getAllInstances } from '../data/objectCategories.js'
import { getLights } from '../data/equipment.js'
import { fitsContainer } from './equipmentRules.js'
import { fitsTerrarium, isGroundCompatible, isTerrariumFull } from './plantRules.js'
import { findFreePlacement, getFootprint, getObstacles } from './placementRules.js'

// Availability for any placeable object (plants, decoration, animals).

export const OBJECT_STATUS = {
  available: 'available',
  unavailable: 'unavailable',
  maxReached: 'max-reached',
  terrariumFull: 'terrarium-full',
  noRoom: 'no-room',
}

// Placed objects (any category) that could not stay if the ground changed, grouped per item.
export function getObjectsRemovedByGroundChange(configuration, groundId) {
  const removed = new Map()
  for (const { categoryId, instance } of getAllInstances(configuration)) {
    const item = findItem(categoryId, instance.id)
    if (!item || isGroundCompatible(item, groundId)) continue
    const entry = removed.get(item.id) ?? { item, quantity: 0 }
    entry.quantity += 1
    removed.set(item.id, entry)
  }
  return [...removed.values()]
}

// Placed objects that could not stay if the terrarium changed: objects (and lights) too big
// for the new container, then the most recently added plants beyond its capacity.
// Returns [{ categoryId, instance, item, reason: 'size' | 'capacity' }].
export function getObjectsRemovedByTerrariumChange(configuration, terrariumId) {
  const terrarium = findTerrarium(terrariumId)
  if (!terrarium) return []
  const removed = []
  for (const { categoryId, instance } of getAllInstances(configuration)) {
    const item = findItem(categoryId, instance.id)
    if (item && !fitsTerrarium(item, terrarium)) removed.push({ categoryId, instance, item, reason: 'size' })
  }
  // Lights inside the glass that do not fit the new container.
  for (const light of getLights(configuration.lights)) {
    if (!fitsContainer(light, terrarium)) removed.push({ categoryId: 'lights', instance: { instanceId: light.id }, item: light, reason: 'light' })
  }
  if (terrarium.maxPlants) {
    const removedIds = new Set(removed.map((entry) => entry.instance.instanceId))
    const remainingPlants = configuration.plants.filter((instance) => !removedIds.has(instance.instanceId))
    remainingPlants.slice(terrarium.maxPlants).forEach((instance) => {
      removed.push({ categoryId: 'plants', instance, item: findItem('plants', instance.id), reason: 'capacity' })
    })
  }
  return removed
}

export const countInstances = (configuration, categoryId, itemId) =>
  configuration[categoryId].filter((instance) => instance.id === itemId).length

const listGroundNames = (item) => item.compatibleGround.map(getGroundName).join(' or ')

// Single source of truth for whether an object can be added, and why not.
export function getItemAvailability(categoryId, item, configuration) {
  const count = countInstances(configuration, categoryId, item.id)
  const result = (status, reason) => ({ status, canAdd: status === OBJECT_STATUS.available, count, reason })
  const terrarium = findTerrarium(configuration.terrarium)

  if (!terrarium) return result(OBJECT_STATUS.unavailable, 'Choose a terrarium first')

  // Every object stands on the ground, so a ground layer is always needed first.
  if (configuration.ground === null) {
    const needs = item.compatibleGround ? ` · Needs ${listGroundNames(item)}` : ''
    return result(OBJECT_STATUS.unavailable, `Choose a ground first${needs}`)
  }

  // Ground compatibility only applies to items that list compatible grounds (e.g. plants).
  if (item.compatibleGround) {
    const needs = `Needs ${listGroundNames(item)}`
    if (!isGroundCompatible(item, configuration.ground)) {
      const verb = categoryId === 'animals' ? 'live' : 'grow'
      return result(OBJECT_STATUS.unavailable, `Does not ${verb} in ${getGroundName(configuration.ground)} · ${needs}`)
    }
  }

  if (!fitsTerrarium(item, terrarium)) {
    return result(OBJECT_STATUS.unavailable, `Too big for the ${terrarium.name}`)
  }

  if (count >= item.maxQuantity) return result(OBJECT_STATUS.maxReached, 'Maximum quantity reached')

  if (categoryId === 'plants' && isTerrariumFull(configuration)) {
    return result(OBJECT_STATUS.terrariumFull, `The ${terrarium.name} fits ${terrarium.maxPlants} plants`)
  }

  const hasRoom = findFreePlacement({
    terrarium,
    radius: getFootprint(item, 1, terrarium),
    obstacles: getObstacles(configuration, terrarium),
  })
  if (!hasRoom) return result(OBJECT_STATUS.noRoom, 'No room left for this size')

  return result(OBJECT_STATUS.available, item.compatibleGround ? `Grows in ${listGroundNames(item)}` : null)
}
