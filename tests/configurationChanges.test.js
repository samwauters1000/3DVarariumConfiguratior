import { describe, expect, it } from 'vitest'
import { getObjectsRemovedByGroundChange, getObjectsRemovedByTerrariumChange } from '../src/rules/objectRules.js'
import { add, build, ground, setup, terrarium } from './helpers.js'

describe('switching ground', () => {
  it('lists and removes plants that do not grow in the new ground', () => {
    const configuration = build([add('plants', 'plant-fern'), add('plants', 'plant-fern'), add('plants', 'plant-pilea')], setup('terrarium-dome', 'soil'))

    // Moss: Fern grows there, Pilea (soil only) does not.
    const removed = getObjectsRemovedByGroundChange(configuration, 'moss')
    expect(removed.map(({ item, quantity }) => [item.id, quantity])).toEqual([['plant-pilea', 1]])

    const onMoss = build([ground('moss')], configuration)
    expect(onMoss.plants.map((instance) => instance.id)).toEqual(['plant-fern', 'plant-fern'])
  })

  it('keeps decoration when the ground changes', () => {
    const configuration = build([add('decoration', 'decoration-lava-rock')], setup('terrarium-panorama', 'soil'))
    expect(build([ground('sand')], configuration).decoration).toHaveLength(1)
  })

  it('cannot choose a ground before a terrarium', () => {
    const configuration = build([ground('soil')])
    expect(configuration.ground).toBeNull()
  })
})

describe('switching terrarium', () => {
  it('removes plants that are too big, then plants beyond the capacity', () => {
    const configuration = build(
      [
        add('plants', 'plant-croton'),
        add('plants', 'plant-fittonia'),
        add('plants', 'plant-pilea'),
        add('plants', 'plant-moss'),
        add('plants', 'plant-pilea-glauca'),
      ],
      setup('terrarium-panorama'),
    )

    // Tiny Bottle: small plants only, 3 plants maximum.
    const removed = getObjectsRemovedByTerrariumChange(configuration, 'terrarium-bottle')
    expect(removed.map(({ item, reason }) => [item.id, reason])).toEqual([
      ['plant-croton', 'size'],
      ['plant-pilea-glauca', 'capacity'],
    ])

    const inBottle = build([terrarium('terrarium-bottle')], configuration)
    expect(inBottle.plants.map((instance) => instance.id)).toEqual(['plant-fittonia', 'plant-pilea', 'plant-moss'])
  })

  it('removes nothing when switching to a larger container', () => {
    const configuration = build([add('plants', 'plant-fern')], setup('terrarium-dome'))
    expect(getObjectsRemovedByTerrariumChange(configuration, 'terrarium-panorama')).toEqual([])
  })
})
