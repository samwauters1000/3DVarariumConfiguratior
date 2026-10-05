import { describe, expect, it } from 'vitest'
import { findTerrarium } from '../src/data/catalogue.js'
import { findItem } from '../src/data/objectCategories.js'
import { findClimbingSupport } from '../src/rules/climbingRules.js'
import { getPlantShape, getSizeClassScale } from '../src/utils/variation.js'
import { add, build, setup } from './helpers.js'

const tank = findTerrarium('terrarium-panorama')
const supportFor = (configuration, index = 0) => {
  const instance = configuration.plants[index]
  return findClimbingSupport(configuration, tank, instance, findItem('plants', instance.id))
}

describe('climbing plants', () => {
  it('climb a branch placed right next to them', () => {
    const configuration = build(
      [add('decoration', 'decoration-branch', { x: 0, z: 0 }), add('plants', 'plant-creeping-fig', { x: 0.2, z: 0 })],
      setup('terrarium-panorama', 'soil'),
    )
    expect(supportFor(configuration)).toMatchObject({ name: 'Driftwood Branch' })
  })

  it('creep over the soil when the support is far away', () => {
    const configuration = build(
      [add('decoration', 'decoration-branch', { x: -0.8, z: 0 }), add('plants', 'plant-creeping-fig', { x: 0.8, z: 0 })],
      setup('terrarium-panorama', 'soil'),
    )
    expect(supportFor(configuration)).toBeNull()
  })

  it('are placed next to a support automatically', () => {
    const configuration = build([add('decoration', 'decoration-cork-tube'), add('plants', 'plant-pothos')], setup('terrarium-panorama', 'soil'))
    expect(supportFor(configuration)).toMatchObject({ name: 'Cork Tube' })
  })

  it('do not climb stones, and non-climbers never climb', () => {
    const onStones = build(
      [add('decoration', 'decoration-river-stones', { x: 0, z: 0 }), add('plants', 'plant-creeping-fig', { x: 0.18, z: 0 })],
      setup('terrarium-panorama', 'soil'),
    )
    expect(supportFor(onStones)).toBeNull()

    const fern = build(
      [add('decoration', 'decoration-branch', { x: 0, z: 0 }), add('plants', 'plant-fern', { x: 0.3, z: 0 })],
      setup('terrarium-panorama', 'soil'),
    )
    expect(supportFor(fern)).toBeNull()
  })
})

describe('natural variation', () => {
  const fern = findItem('plants', 'plant-fern')

  it('gives the same plant the same shape every time', () => {
    expect(getPlantShape(fern, 'fern-abc')).toEqual(getPlantShape(fern, 'fern-abc'))
  })

  it('gives different plants of one species different shapes', () => {
    const shapes = ['a', 'b', 'c', 'd', 'e'].map((seed) => getPlantShape(fern, seed))
    const sizes = new Set(shapes.map((shape) => shape.growth.toFixed(3)))
    expect(sizes.size).toBe(shapes.length)
  })

  it('keeps sizes within 70–135% of the species average (including its size class)', () => {
    const average = fern.baseSize * getSizeClassScale(fern)
    for (let index = 0; index < 200; index++) {
      const { growth } = getPlantShape(fern, `seed-${index}`)
      expect(growth / average).toBeGreaterThanOrEqual(0.7)
      expect(growth / average).toBeLessThanOrEqual(1.35)
    }
  })

  it('draws medium and large objects bigger than small ones by default', () => {
    expect(getSizeClassScale({ size: 'small' })).toBe(1)
    expect(getSizeClassScale({ size: 'medium' })).toBeGreaterThan(1)
    expect(getSizeClassScale({ size: 'large' })).toBeGreaterThan(getSizeClassScale({ size: 'medium' }))
  })
})
