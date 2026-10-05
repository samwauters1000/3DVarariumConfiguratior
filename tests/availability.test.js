import { describe, expect, it } from 'vitest'
import { getItemAvailability, OBJECT_STATUS } from '../src/rules/objectRules.js'
import { findItem } from '../src/data/objectCategories.js'
import { initialConfiguration } from '../src/state/configuration.js'
import { add, build, setup, terrarium } from './helpers.js'

const plant = (id) => findItem('plants', id)
const availability = (id, configuration, categoryId = 'plants') => getItemAvailability(categoryId, findItem(categoryId, id), configuration)

describe('item availability', () => {
  it('needs a terrarium first', () => {
    const result = availability('plant-fern', initialConfiguration)
    expect(result).toMatchObject({ status: OBJECT_STATUS.unavailable, canAdd: false, reason: 'Choose a terrarium first' })
  })

  it('needs a ground layer first', () => {
    const result = availability('plant-fern', build([terrarium('terrarium-dome')]))
    expect(result.canAdd).toBe(false)
    expect(result.reason).toMatch(/^Choose a ground first/)
  })

  it('follows real growing conditions: no fern in sand, no cactus in soil', () => {
    expect(availability('plant-fern', setup('terrarium-dome', 'sand')).reason).toBe('Does not grow in Sand · Needs Soil or Moss')
    expect(availability('plant-cactus', setup('terrarium-dome', 'soil')).canAdd).toBe(false)
    expect(availability('plant-cactus', setup('terrarium-dome', 'gravel')).canAdd).toBe(true)
  })

  it('lets decoration without compatible grounds sit on any ground', () => {
    for (const groundId of ['soil', 'sand', 'gravel', 'moss', 'bark']) {
      expect(availability('decoration-river-stones', setup('terrarium-panorama', groundId), 'decoration').canAdd).toBe(true)
    }
  })

  it('keeps large plants out of low and tiny containers', () => {
    expect(availability('plant-croton', setup('terrarium-bowl')).reason).toBe('Too big for the Open Bowl')
    expect(availability('plant-fern', setup('terrarium-bottle')).reason).toBe('Too big for the Tiny Bottle')
    expect(availability('plant-croton', setup('terrarium-panorama')).canAdd).toBe(true)
  })

  it('respects the maximum quantity per plant', () => {
    const maxQuantity = plant('plant-fern').maxQuantity
    const actions = Array.from({ length: maxQuantity }, () => add('plants', 'plant-fern'))
    const configuration = build(actions, setup('terrarium-panorama'))
    expect(availability('plant-fern', configuration)).toMatchObject({ status: OBJECT_STATUS.maxReached, count: maxQuantity })
  })

  it('limits rare plants to three of each', () => {
    const actions = Array.from({ length: 4 }, () => add('plants', 'plant-jewel-orchid'))
    const configuration = build(actions, setup('terrarium-panorama'))
    expect(configuration.plants).toHaveLength(3)
  })

  it('stops at the container capacity (Tiny Bottle fits 3 plants)', () => {
    const configuration = build(
      [add('plants', 'plant-fittonia'), add('plants', 'plant-fittonia'), add('plants', 'plant-pilea')],
      setup('terrarium-bottle'),
    )
    expect(availability('plant-moss', configuration)).toMatchObject({ status: OBJECT_STATUS.terrariumFull })
  })

  it('reports "no room" when the soil is full', () => {
    // Keep adding small plants until the dome is full.
    let configuration = setup('terrarium-dome')
    const ids = ['plant-fittonia', 'plant-moss', 'plant-pilea', 'plant-pilea-glauca', 'plant-peacock-fern', 'plant-creeping-fig']
    for (let round = 0; round < 5; round++) ids.forEach((id) => (configuration = build([add('plants', id)], configuration)))
    const statuses = ids.map((id) => availability(id, configuration).status)
    expect(statuses).toContain(OBJECT_STATUS.noRoom)
  })
})
