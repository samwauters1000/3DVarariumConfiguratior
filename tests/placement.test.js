import { describe, expect, it } from 'vitest'
import { findTerrarium } from '../src/data/catalogue.js'
import { findItem } from '../src/data/objectCategories.js'
import { findFreePlacement, getFootprint, getPlantingArea, validatePlacement } from '../src/rules/placementRules.js'
import { add, build, hasNoOverlaps, setup, terrarium } from './helpers.js'

const dome = findTerrarium('terrarium-dome')
const fernRadius = getFootprint(findItem('plants', 'plant-fern'), 1, dome)

describe('planting area', () => {
  it('follows the container shape', () => {
    expect(getPlantingArea(dome).shape).toBe('round')
    expect(getPlantingArea(findTerrarium('terrarium-panorama')).shape).toBe('rect')
    expect(getPlantingArea(findTerrarium('terrarium-heart')).shape).toBe('rect')
  })

  it('makes the panorama tank much wider than deep', () => {
    const area = getPlantingArea(findTerrarium('terrarium-panorama'))
    expect(area.halfX).toBeGreaterThan(area.halfZ * 1.8)
  })
})

describe('validatePlacement', () => {
  it('accepts the centre of an empty terrarium', () => {
    expect(validatePlacement({ terrarium: dome, position: { x: 0, z: 0 }, radius: fernRadius, obstacles: [] }).valid).toBe(true)
  })

  it('refuses spots outside or on the edge of the soil', () => {
    const result = validatePlacement({ terrarium: dome, position: { x: 1, z: 0 }, radius: fernRadius, obstacles: [] })
    expect(result).toEqual({ valid: false, reason: 'Keep it inside the terrarium' })
  })

  it('refuses spots on top of another object', () => {
    const obstacles = [{ world: { x: 0, z: 0 }, radius: fernRadius }]
    const result = validatePlacement({ terrarium: dome, position: { x: 0.02, z: 0 }, radius: fernRadius, obstacles })
    expect(result).toEqual({ valid: false, reason: 'Too close to another object' })
  })

  it('returns null from findFreePlacement when nothing fits', () => {
    const obstacles = [{ world: { x: 0, z: 0 }, radius: 5 }]
    expect(findFreePlacement({ terrarium: dome, radius: fernRadius, obstacles })).toBeNull()
  })
})

describe('placing objects', () => {
  it('never lets automatically placed objects overlap', () => {
    const ids = ['plant-fern', 'plant-fittonia', 'plant-pilea', 'plant-moss', 'plant-peperomia', 'plant-croton', 'plant-pothos']
    const configuration = build(
      ids.map((id) => add('plants', id)),
      setup('terrarium-panorama'),
    )
    expect(configuration.plants.length).toBe(ids.length)
    expect(hasNoOverlaps(configuration)).toBe(true)
  })

  it('uses a valid dropped position and ignores an invalid one', () => {
    const dropped = build([add('plants', 'plant-fern', { x: 0.2, z: -0.1 })], setup())
    expect(dropped.plants[0].position).toMatchObject({ x: 0.2, z: -0.1 })

    const outside = build([add('plants', 'plant-fern', { x: 3, z: 3 })], setup())
    expect(Math.hypot(outside.plants[0].position.x, outside.plants[0].position.z)).toBeLessThan(1)
  })

  it('refuses to move an object onto another one', () => {
    const configuration = build([add('plants', 'plant-fern', { x: -0.4, z: 0 }), add('plants', 'plant-fern', { x: 0.4, z: 0 })], setup())
    const [first, second] = configuration.plants
    const moved = build([{ type: 'moveObject', categoryId: 'plants', instanceId: second.instanceId, position: first.position }], configuration)
    expect(moved).toBe(configuration)
  })

  it('refuses to grow objects into their neighbours', () => {
    // Fill the dome, then try to grow every plant to the maximum size.
    let configuration = setup()
    const ids = ['plant-fittonia', 'plant-moss', 'plant-pilea', 'plant-fern', 'plant-peperomia']
    for (let round = 0; round < 4; round++) ids.forEach((id) => (configuration = build([add('plants', id)], configuration)))
    for (const instance of configuration.plants) {
      for (let step = 0; step < 4; step++) {
        configuration = build([{ type: 'scaleObject', categoryId: 'plants', instanceId: instance.instanceId, direction: 1 }], configuration)
      }
    }
    // Some plants could not grow all the way, and nothing overlaps.
    expect(configuration.plants.some((instance) => instance.scale.x < 1.5)).toBe(true)
    expect(hasNoOverlaps(configuration)).toBe(true)
  })

  it('re-places objects without overlaps after switching to a smaller container', () => {
    const ids = ['plant-fern', 'plant-fittonia', 'plant-pilea', 'plant-moss']
    const inTank = build(
      ids.map((id) => add('plants', id)),
      setup('terrarium-panorama'),
    )
    const inPrism = build([terrarium('terrarium-geometric')], inTank)
    expect(inPrism.plants).toHaveLength(ids.length)
    expect(hasNoOverlaps(inPrism)).toBe(true)
  })
})
