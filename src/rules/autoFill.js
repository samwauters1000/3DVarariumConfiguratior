import { isRarePlant, plants } from '../data/plants.js'
import { decorationItems } from '../data/decoration.js'
import { animals } from '../data/animals.js'
import { animalCare, plantCare } from '../data/care.js'
import { findTerrarium } from '../data/catalogue.js'
import { findLight, lights } from '../data/equipment.js'
import { getItemAvailability } from './objectRules.js'
import { getLightAvailability } from './equipmentRules.js'

// "Fill for me": picks a complete, balanced setup that suits the chosen ground and
// container, like a designer would. The actual placement (and any "no room" refusals)
// happens in the reducer, as one undo step.
//
// - Plants: one tall centrepiece, a few medium plants and small ground covers around them.
//   Rare plants are left for the user to choose.
// - Decoration: a climbable support (climbers grow up it), a stone and a small accent.
// - Lights: the best ceiling lamp that fits (a grow light when light-hungry plants were
//   chosen) plus fairy lights.
// - Animal (optional, when one fits): one easy-going animal that likes the same humidity
//   as the plants, with the hiding place and lid it needs, so the care warnings stay quiet.

const PLANT_PLAN = [
  { size: 'large', count: 1 },
  { size: 'medium', count: 2 },
  { size: 'small', count: 4 },
]

function shuffle(list, random) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

const canAdd = (categoryId, configuration) => (item) => getItemAvailability(categoryId, item, configuration).canAdd
const pickOne = (list, random) => shuffle(list, random)[0] ?? null

export function chooseFillPlants(configuration, random = Math.random) {
  const addable = plants.filter((plant) => !isRarePlant(plant) && canAdd('plants', configuration)(plant))
  const chosen = []
  for (const { size, count } of PLANT_PLAN) {
    const options = shuffle(
      addable.filter((plant) => plant.size === size),
      random,
    )
    // Different species first; repeat species only when there are too few.
    for (let index = 0; index < count && options.length > 0; index++) chosen.push(options[index % options.length].id)
  }
  return chosen
}

// Decoration: support, stone, accent (bigger pieces first, so they get the best spots).
function chooseFillDecoration(configuration, random) {
  const addable = decorationItems.filter(canAdd('decoration', configuration))
  const bySize = (list) => [...list.filter((item) => item.size !== 'small'), ...list.filter((item) => item.size === 'small')]
  const support = pickOne(addable.filter((item) => item.climbable && item.size !== 'small'), random)
  const stones = addable.filter((item) => item.type === 'Stone')
  const stone = bySize(shuffle(stones, random))[0] ?? null
  const accent = pickOne(addable.filter((item) => item.type === 'Accent' || item.type === 'Ground cover'), random)
  return [support, stone, accent].filter(Boolean)
}

// One animal that fits and shares the plants' humidity needs.
function chooseFillAnimal(configuration, plantIds, random) {
  const hasDryPlants = [...configuration.plants.map((instance) => instance.id), ...plantIds].some((id) => plantCare[id]?.humidity === 'Low')
  const options = animals.filter((animal) => {
    const care = animalCare[animal.id]
    if (!care || care.difficulty === 'Expert' || !canAdd('animals', configuration)(animal)) return false
    return !(hasDryPlants && care.humidity === 'High')
  })
  return pickOne(options, random)
}

// "Fill for me" starts from an empty terrarium: the container and ground stay, everything
// inside (and the lid and lights) is replaced. The reducer clears the same way.
export const clearContents = (configuration) => ({ ...configuration, plants: [], decoration: [], animals: [], lid: null, lights: [] })

export const hasContents = (configuration) =>
  configuration.plants.length + configuration.decoration.length + configuration.animals.length + (configuration.lights?.length ?? 0) > 0 ||
  Boolean(configuration.lid)

// Everything "Fill for me" adds to the emptied terrarium, as ids:
// { decoration, plants, animals, lid, lights }.
export function chooseFillSet(existing, { includeAnimal = true } = {}, random = Math.random) {
  const configuration = clearContents(existing)
  const terrarium = findTerrarium(configuration.terrarium)
  const empty = { decoration: [], plants: [], animals: [], lid: null, lights: [] }
  if (!terrarium || configuration.ground === null) return empty

  const decoration = chooseFillDecoration(configuration, random)
  const plantIds = chooseFillPlants(configuration, random)
  const animal = includeAnimal ? chooseFillAnimal(configuration, plantIds, random) : null
  const care = animal ? animalCare[animal.id] : null

  // A hiding place when the animal needs one and none is there yet.
  const hasHide = [...configuration.decoration.map((instance) => instance.id), ...decoration.map((item) => item.id)].some(
    (id) => decorationItems.find((item) => item.id === id)?.hide,
  )
  if (care?.needsHide && !hasHide) {
    const hide = pickOne(
      decorationItems.filter((item) => item.hide && !decoration.includes(item) && canAdd('decoration', configuration)(item)),
      random,
    )
    if (hide) decoration.push(hide)
  }

  // Lid for open containers: keeps climbers in, and humidity in for humid plants.
  const allPlantIds = [...configuration.plants.map((instance) => instance.id), ...plantIds]
  const hasHumidPlants = allPlantIds.some((id) => plantCare[id]?.humidity === 'High')
  const lid = terrarium.lidable && !configuration.lid && (care?.climbs || hasHumidPlants) ? (hasHumidPlants ? 'lid-glass' : 'lid-mesh') : null

  // Lights: a ceiling lamp that fits (grow light for light-hungry plants), plus fairy lights.
  const current = configuration.lights ?? []
  const fits = (light) => getLightAvailability(light, configuration).canAdd
  const chosenLights = []
  if (!current.some((id) => findLight(id)?.kind === 'main')) {
    const wantsGrowLight = allPlantIds.some((id) => plantCare[id]?.light === 'Bright')
    const lamps = lights.filter((light) => light.kind === 'main' && fits(light))
    // The longest grow bar that fits for light-hungry plants (or big tanks), otherwise a
    // puck, otherwise whatever fits (the cork light in a bottle).
    const growBars = lamps.filter((light) => light.growLight).sort((a, b) => b.sizeCm - a.sizeCm)
    const wantsBar = wantsGrowLight || (terrarium.lightSpace?.bar ?? 0) >= 60
    const lamp = (wantsBar && growBars[0]) || lamps.find((light) => light.style === 'puck') || lamps[0]
    if (lamp) chosenLights.push(lamp.id)
  }
  if (!current.includes('light-fairy') && fits(findLight('light-fairy'))) chosenLights.push('light-fairy')

  return {
    decoration: decoration.map((item) => item.id),
    plants: plantIds,
    animals: animal ? [animal.id] : [],
    lid,
    lights: chosenLights,
  }
}

export const isFillSetEmpty = (set) =>
  set.decoration.length + set.plants.length + set.animals.length + set.lights.length === 0 && !set.lid
