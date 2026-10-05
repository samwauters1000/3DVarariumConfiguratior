import { initialConfiguration } from '../src/state/configuration.js'
import { configurationReducer } from '../src/state/configurationReducer.js'
import { findTerrarium } from '../src/data/catalogue.js'
import { getObstacles, PLACEMENT_LIMITS } from '../src/rules/placementRules.js'

// Runs a list of actions through the real reducer, starting from an empty configuration.
export const build = (actions, start = initialConfiguration) => actions.reduce(configurationReducer, start)

let counter = 0
export const add = (categoryId, itemId, position) => ({
  type: 'addObject',
  categoryId,
  itemId,
  position,
  instanceId: `${itemId}-test-${counter++}`,
})

export const terrarium = (terrariumId) => ({ type: 'selectTerrarium', terrariumId })
export const ground = (groundId) => ({ type: 'selectGround', groundId })

// A terrarium with ground, ready for objects.
export const setup = (terrariumId = 'terrarium-dome', groundId = 'soil') => build([terrarium(terrariumId), ground(groundId)])

// True when no two placed objects overlap more than the rules allow.
export function hasNoOverlaps(configuration) {
  const obstacles = getObstacles(configuration, findTerrarium(configuration.terrarium))
  for (let a = 0; a < obstacles.length; a++) {
    for (let b = a + 1; b < obstacles.length; b++) {
      const distance = Math.hypot(obstacles[a].world.x - obstacles[b].world.x, obstacles[a].world.z - obstacles[b].world.z)
      if (distance < (obstacles[a].radius + obstacles[b].radius) * PLACEMENT_LIMITS.overlapFactor - 1e-9) return false
    }
  }
  return true
}
