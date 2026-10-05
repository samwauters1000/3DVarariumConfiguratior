import { plants } from './plants.js'
import { decorationItems } from './decoration.js'
import { animals } from './animals.js'

// Every category of object that can be placed inside the terrarium. They all share the
// same system (placement, selection, move / rotate / scale, pricing, summary), so adding
// decoration or animals only means adding data.
//
// The key matches the array in the configuration state (configuration.plants, ...).
export const placeableCategories = {
  plants: { id: 'plants', label: 'Plants', singular: 'plant', plural: 'plants', items: plants },
  decoration: { id: 'decoration', label: 'Decoration', singular: 'decoration item', plural: 'decoration items', items: decorationItems },
  animals: { id: 'animals', label: 'Animals', singular: 'animal', plural: 'animals', items: animals },
}

export const PLACEABLE_CATEGORY_IDS = Object.keys(placeableCategories)

export const findItem = (categoryId, itemId) =>
  placeableCategories[categoryId]?.items.find((item) => item.id === itemId) ?? null

// All placed objects of every category, in the order they were added per category.
export const getAllInstances = (configuration) =>
  PLACEABLE_CATEGORY_IDS.flatMap((categoryId) =>
    configuration[categoryId].map((instance) => ({ categoryId, instance })),
  )
