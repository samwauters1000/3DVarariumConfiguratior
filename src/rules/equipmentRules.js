import { findTerrarium } from '../data/catalogue.js'
import { findLight, getLightSizeLabel } from '../data/equipment.js'

// Rules for "Lights". Every light has one fixed, real size and sits inside the glass, so it
// only fits when the container has room for it (`lightSpace`, in cm, on terrariums). Lights
// on the soil also need a ground layer.

// Whether a light physically fits a container: { fits, reason }.
export function getLightFit(light, terrarium) {
  const space = terrarium?.lightSpace ?? {}
  const name = terrarium?.name ?? 'container'
  switch (light.mount) {
    case 'bar':
      if (!space.bar) return { fits: false, reason: `The ${name} has no flat top for a light bar` }
      return light.sizeCm <= space.bar ? { fits: true, reason: null } : { fits: false, reason: `Too long: the ${name} has room for ${space.bar} cm` }
    case 'puck':
      return light.sizeCm <= (space.puck ?? 0)
        ? { fits: true, reason: null }
        : { fits: false, reason: `Too wide: the ${name} has room for Ø ${space.puck ?? 0} cm` }
    case 'cork':
      return space.cork ? { fits: true, reason: null } : { fits: false, reason: 'Only for containers with a cork' }
    case 'floor':
      return (space.floor ?? 0) >= (light.minFloorCm ?? light.sizeCm)
        ? { fits: true, reason: null }
        : { fits: false, reason: `Not enough soil space in the ${name}` }
    default:
      // Flexible strings (fairy lights) fit everywhere.
      return { fits: true, reason: null }
  }
}

export const fitsContainer = (light, terrarium) => getLightFit(light, terrarium).fits

// Whether a light can be switched on, and why not: { canAdd, reason }.
export function getLightAvailability(light, configuration) {
  const terrarium = findTerrarium(configuration.terrarium)
  if (!terrarium) return { canAdd: false, reason: 'Choose a terrarium first' }
  const { fits, reason } = getLightFit(light, terrarium)
  if (!fits) return { canAdd: false, reason }
  if (light.kind === 'special' && configuration.ground === null) return { canAdd: false, reason: 'Choose a ground first' }
  return { canAdd: true, reason: null }
}

// Card text: real size, plus what it is for.
export const describeLightSize = (light) => getLightSizeLabel(light)

// Switches a light on or off. Day lights replace each other; special lights combine.
// Returns the new list of light ids (unchanged list when the light cannot be added).
export function toggleLight(configuration, lightId) {
  const current = configuration.lights ?? []
  if (current.includes(lightId)) return current.filter((id) => id !== lightId)
  const light = findLight(lightId)
  if (!light || !getLightAvailability(light, configuration).canAdd) return current
  const kept = light.kind === 'main' ? current.filter((id) => findLight(id)?.kind !== 'main') : current
  return [...kept, lightId]
}

// Lights that stay valid in a terrarium (used when switching container and loading data).
export function getValidLights(lightIds, terrarium, hasGround) {
  if (!terrarium || !Array.isArray(lightIds)) return []
  const valid = []
  for (const id of lightIds) {
    const light = findLight(id)
    if (!light || valid.includes(id) || !fitsContainer(light, terrarium)) continue
    if (light.kind === 'special' && !hasGround) continue
    if (light.kind === 'main' && valid.some((other) => findLight(other).kind === 'main')) continue
    valid.push(id)
  }
  return valid
}
