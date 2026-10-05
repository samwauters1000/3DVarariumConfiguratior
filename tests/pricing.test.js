import { describe, expect, it } from 'vitest'
import { calculateTotalPrice, formatPrice, getPriceSections } from '../src/utils/pricing.js'
import { initialConfiguration } from '../src/state/configuration.js'
import { add, build, setup } from './helpers.js'

describe('pricing', () => {
  it('is zero for an empty configuration', () => {
    expect(calculateTotalPrice(initialConfiguration)).toBe(0)
    expect(getPriceSections(initialConfiguration)).toEqual([])
  })

  it('adds terrarium, ground and every placed object', () => {
    // Glass Dome €35 + Soil €8 + 2 × Fern €6 + Fittonia €5
    const configuration = build(
      [add('plants', 'plant-fern'), add('plants', 'plant-fern'), add('plants', 'plant-fittonia')],
      setup('terrarium-dome', 'soil'),
    )
    expect(calculateTotalPrice(configuration)).toBe(35 + 8 + 12 + 5)
  })

  it('groups identical items into one line with a quantity', () => {
    const configuration = build([add('plants', 'plant-fern'), add('plants', 'plant-fern')], setup())
    const plants = getPriceSections(configuration).find((section) => section.id === 'plants')
    expect(plants.lines).toEqual([{ id: 'plant-fern', name: 'Fern', quantity: 2, unitPrice: 6, total: 12 }])
  })

  it('lists decoration in its own section', () => {
    const configuration = build([add('decoration', 'decoration-river-stones')], setup('terrarium-panorama'))
    const sections = getPriceSections(configuration).map((section) => section.id)
    expect(sections).toEqual(['terrarium', 'ground', 'decoration'])
  })

  it('always matches the configuration after a removal', () => {
    const withFern = build([add('plants', 'plant-fern')], setup())
    const fern = withFern.plants[0]
    const removed = build([{ type: 'removeObject', categoryId: 'plants', instanceId: fern.instanceId }], withFern)
    expect(calculateTotalPrice(removed)).toBe(35 + 8)
  })

  it('formats prices in euros', () => {
    expect(formatPrice(35)).toBe('€35')
    expect(formatPrice(6.5)).toBe('€6.5')
  })
})
