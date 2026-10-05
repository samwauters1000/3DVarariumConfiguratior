import { plants } from '../data/plants.js'
import { findTerrarium } from '../data/catalogue.js'

// Plant-specific rules: ground compatibility and container capacity.
// Whether a plant can be added is decided by getItemAvailability (objectRules.js).

// Some containers only fit a few plants (e.g. the tiny bottle).
export const isTerrariumFull = (configuration) => {
  const terrarium = findTerrarium(configuration.terrarium)
  return Boolean(terrarium?.maxPlants) && configuration.plants.length >= terrarium.maxPlants
}

// Whether an item's size class fits a container (e.g. tall plants do not fit the low
// Open Bowl or the Tiny Bottle). Items without a size, or containers without limits, fit.
export const fitsTerrarium = (item, terrarium) =>
  !item.size || !terrarium?.plantSizes || terrarium.plantSizes.includes(item.size)

// Items without `compatibleGround` (e.g. most decoration) fit every ground.
export const isGroundCompatible = (item, groundId) =>
  !item.compatibleGround || (groundId !== null && item.compatibleGround.includes(groundId))

// Plants that can grow in a ground type.
export const getPlantsForGround = (groundId) => plants.filter((plant) => isGroundCompatible(plant, groundId))
