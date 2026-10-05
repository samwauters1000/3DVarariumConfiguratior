import { initialConfiguration } from './configuration.js'
import { sanitizeConfiguration } from '../utils/configurationStorage.js'
import { findTerrarium } from '../data/catalogue.js'
import { findLid } from '../data/equipment.js'
import { getValidLights, toggleLight } from '../rules/equipmentRules.js'
import { clearContents } from '../rules/autoFill.js'
import { findItem, PLACEABLE_CATEGORY_IDS } from '../data/objectCategories.js'
import { getItemAvailability, getObjectsRemovedByTerrariumChange } from '../rules/objectRules.js'
import { isGroundCompatible } from '../rules/plantRules.js'
import { canChooseGround } from '../rules/configurationRules.js'
import { findSpotNextToSupport, isClimbingPlant } from '../rules/climbingRules.js'
import {
  canScaleObject,
  clampScale,
  findFreePlacement,
  getFootprint,
  getInitialRotation,
  getObstacles,
  PLACEMENT_LIMITS,
  resolvePlacements,
  validatePlacement,
} from '../rules/placementRules.js'

// Pure state logic (no React), so it can be tested on its own. Every change to the
// configuration goes through configurationReducer; historyReducer adds undo / redo.

export const HISTORY_LIMIT = 50

// Updates one placed object in a category.
const updateInstance = (configuration, categoryId, instanceId, update) => ({
  ...configuration,
  [categoryId]: configuration[categoryId].map((instance) => (instance.instanceId === instanceId ? update(instance) : instance)),
})

export const findInstance = (configuration, categoryId, instanceId) =>
  configuration[categoryId]?.find((instance) => instance.instanceId === instanceId) ?? null

// Applies the same filter to every placeable category.
const filterAllCategories = (configuration, keep) =>
  Object.fromEntries(
    PLACEABLE_CATEGORY_IDS.map((categoryId) => [
      categoryId,
      configuration[categoryId].filter((instance) => keep(categoryId, instance)),
    ]),
  )

export function configurationReducer(configuration, action) {
  switch (action.type) {
    case 'selectTerrarium': {
      // Keep the configuration valid: objects too big for the new container and plants beyond
      // its capacity are removed (the UI asks the user to confirm this first), and everything
      // else is re-placed so it fits the new shape without overlapping.
      const removed = new Set(
        getObjectsRemovedByTerrariumChange(configuration, action.terrariumId).map((entry) => entry.instance.instanceId),
      )
      // A lid only stays when the new container can take one; lights only when they fit.
      const nextTerrarium = findTerrarium(action.terrariumId)
      return resolvePlacements({
        ...configuration,
        terrarium: action.terrariumId,
        lid: nextTerrarium?.lidable ? configuration.lid : null,
        lights: getValidLights(configuration.lights, nextTerrarium, configuration.ground !== null),
        ...filterAllCategories(configuration, (categoryId, instance) => !removed.has(instance.instanceId)),
      })
    }

    case 'selectLid': {
      const terrarium = findTerrarium(configuration.terrarium)
      if (action.lidId !== null && (!terrarium?.lidable || !findLid(action.lidId))) return configuration
      return configuration.lid === action.lidId ? configuration : { ...configuration, lid: action.lidId }
    }

    // Switches a light on or off. A light standing on the soil pushes objects out of its way.
    case 'toggleLight': {
      const lights = toggleLight(configuration, action.lightId)
      if (lights === (configuration.lights ?? [])) return configuration
      return resolvePlacements({ ...configuration, lights })
    }

    case 'selectGround':
      if (!canChooseGround(configuration)) return configuration
      return {
        ...configuration,
        ground: action.groundId,
        // Keep the configuration valid: drop objects that do not suit the new ground.
        // The UI asks the user to confirm this first (see GroundOptions).
        ...filterAllCategories(configuration, (categoryId, instance) => {
          const item = findItem(categoryId, instance.id)
          return item && isGroundCompatible(item, action.groundId)
        }),
      }

    case 'addObject': {
      const { categoryId, itemId, instanceId } = action
      const item = findItem(categoryId, itemId)
      const terrarium = findTerrarium(configuration.terrarium)
      if (!item || !terrarium || !getItemAvailability(categoryId, item, configuration).canAdd) return configuration

      const obstacles = getObstacles(configuration, terrarium)
      const requested = action.position && { x: action.position.x, y: 0, z: action.position.z }
      // Requested spot (drag and drop) if valid; otherwise climbers go next to a support when
      // there is one, and everything else to the most open free spot. When space is tight
      // (this plant grew wider than average), it is placed a little smaller instead.
      let position = null
      let scale = 1
      for (const candidateScale of [1, 0.85, 0.7, PLACEMENT_LIMITS.minScale]) {
        const radius = getFootprint(item, candidateScale, terrarium, instanceId)
        position =
          (requested && validatePlacement({ terrarium, position: requested, radius, obstacles }).valid ? requested : null) ??
          (isClimbingPlant(item) ? findSpotNextToSupport({ configuration, terrarium, radius, obstacles }) : null) ??
          findFreePlacement({ terrarium, radius, obstacles })
        scale = candidateScale
        if (position) break
      }
      if (!position) return configuration

      const instance = {
        id: item.id,
        instanceId,
        position,
        rotation: getInitialRotation(instanceId),
        scale: { x: scale, y: scale, z: scale },
        // Colour variant (animals): starts with the first one.
        ...(item.colorVariants ? { variant: item.colorVariants[0].id } : {}),
      }
      return { ...configuration, [categoryId]: [...configuration[categoryId], instance] }
    }

    case 'moveObject': {
      const { categoryId, instanceId } = action
      const instance = findInstance(configuration, categoryId, instanceId)
      const terrarium = findTerrarium(configuration.terrarium)
      if (!instance || !terrarium) return configuration
      const position = { ...instance.position, x: action.position.x, z: action.position.z }
      const { valid } = validatePlacement({
        terrarium,
        position,
        radius: getFootprint(findItem(categoryId, instance.id) ?? {}, instance.scale.x, terrarium, instanceId),
        obstacles: getObstacles(configuration, terrarium, instanceId),
      })
      return valid ? updateInstance(configuration, categoryId, instanceId, (current) => ({ ...current, position })) : configuration
    }

    // Several plants at once ("Fill for me"): one history step. Items that no longer fit
    // are skipped by addObject.
    case 'fillPlants':
      return action.items.reduce(
        (current, { itemId, instanceId }) => configurationReducer(current, { type: 'addObject', categoryId: 'plants', itemId, instanceId }),
        configuration,
      )

    // A complete setup ("Fill for me"): first everything inside the terrarium is cleared
    // (container and ground stay), then decoration (supports and stones get the best spots,
    // climbers then grow next to them), plants, animals, lid and lights are added.
    // One history step, so undo brings the previous design back; anything that does not
    // fit is skipped.
    case 'fillDesign': {
      if (!configuration.terrarium || configuration.ground === null) return configuration
      const addAll = (current, categoryId, items = []) =>
        items.reduce((next, { itemId, instanceId }) => configurationReducer(next, { type: 'addObject', categoryId, itemId, instanceId }), current)
      let next = addAll(clearContents(configuration), 'decoration', action.decoration)
      next = addAll(next, 'plants', action.plants)
      next = addAll(next, 'animals', action.animals)
      if (action.lid && !next.lid) next = configurationReducer(next, { type: 'selectLid', lidId: action.lid })
      for (const lightId of action.lights ?? []) {
        if (!(next.lights ?? []).includes(lightId)) next = configurationReducer(next, { type: 'toggleLight', lightId })
      }
      return next
    }

    case 'setObjectVariant': {
      const instance = findInstance(configuration, action.categoryId, action.instanceId)
      const item = instance && findItem(action.categoryId, instance.id)
      const valid = item?.colorVariants?.some((variant) => variant.id === action.variant)
      if (!valid || instance.variant === action.variant) return configuration
      return updateInstance(configuration, action.categoryId, action.instanceId, (current) => ({ ...current, variant: action.variant }))
    }

    case 'rotateObject':
      return updateInstance(configuration, action.categoryId, action.instanceId, (instance) => ({
        ...instance,
        rotation: { ...instance.rotation, y: instance.rotation.y + action.direction * PLACEMENT_LIMITS.rotationStep },
      }))

    case 'scaleObject': {
      const { categoryId, instanceId, direction } = action
      const instance = findInstance(configuration, categoryId, instanceId)
      if (!instance || !canScaleObject(configuration, categoryId, instance, direction)) return configuration
      const value = clampScale(instance.scale.x + direction * PLACEMENT_LIMITS.scaleStep, findItem(categoryId, instance.id))
      return updateInstance(configuration, categoryId, instanceId, (current) => ({
        ...current,
        scale: { x: value, y: value, z: value },
      }))
    }

    case 'removeObject':
      return {
        ...configuration,
        [action.categoryId]: configuration[action.categoryId].filter((instance) => instance.instanceId !== action.instanceId),
      }

    case 'load':
      return sanitizeConfiguration(action.configuration) ?? configuration

    case 'reset':
      return initialConfiguration

    default:
      return configuration
  }
}

// Undo / redo: every change to the configuration is recorded. Actions that change nothing
// (e.g. a refused move) are not recorded. Moving an object is one step, committed on release.
export function historyReducer(history, action) {
  const { past, present, future } = history
  switch (action.type) {
    case 'undo':
      if (past.length === 0) return history
      return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] }
    case 'redo':
      if (future.length === 0) return history
      return { past: [...past, present].slice(-HISTORY_LIMIT), present: future[0], future: future.slice(1) }
    default: {
      const next = configurationReducer(present, action)
      if (next === present) return history
      return { past: [...past, present].slice(-HISTORY_LIMIT), present: next, future: [] }
    }
  }
}
