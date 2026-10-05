import { describe, expect, it } from 'vitest'
import { findTerrarium } from '../src/data/catalogue.js'
import { findItem } from '../src/data/objectCategories.js'
import { decorationItems } from '../src/data/decoration.js'
import { getItemAvailability } from '../src/rules/objectRules.js'
import { findClimbingSupport } from '../src/rules/climbingRules.js'
import { getSupportPath } from '../src/utils/organicShapes.js'
import { add, build, hasNoOverlaps, setup } from './helpers.js'

const tank = findTerrarium('terrarium-panorama')

describe('decoration catalogue', () => {
  it('has small, medium and large items', () => {
    const sizes = new Set(decorationItems.map((item) => item.size))
    expect([...sizes].sort()).toEqual(['large', 'medium', 'small'])
    expect(decorationItems.length).toBeGreaterThanOrEqual(20)
  })

  it('keeps large decoration out of low containers', () => {
    const inBowl = setup('terrarium-bowl')
    const result = getItemAvailability('decoration', findItem('decoration', 'decoration-spider-wood'), inBowl)
    expect(result.reason).toBe('Too big for the Open Bowl')
  })

  it('places many decoration items without overlaps', () => {
    const ids = ['decoration-seiryu-stone', 'decoration-mossy-log', 'decoration-root-stump', 'decoration-river-stones', 'decoration-mushrooms', 'decoration-leaf-litter']
    const configuration = build(
      ids.map((id) => add('decoration', id)),
      setup('terrarium-panorama', 'soil'),
    )
    expect(configuration.decoration).toHaveLength(ids.length)
    expect(hasNoOverlaps(configuration)).toBe(true)
  })
})

describe('organic supports', () => {
  it('lean and bow instead of standing perfectly straight', () => {
    const branch = findItem('decoration', 'decoration-branch')
    const top = getSupportPath(branch, 'branch-a')(1)
    expect(Math.hypot(top.x, top.z)).toBeGreaterThan(0.1)
    const base = getSupportPath(branch, 'branch-a')(0)
    expect(Math.hypot(base.x, base.z)).toBe(0)
  })

  it('follow the same path every time for the same object', () => {
    const branch = findItem('decoration', 'decoration-branch')
    expect(getSupportPath(branch, 'branch-a')(0.5)).toEqual(getSupportPath(branch, 'branch-a')(0.5))
  })
})

describe('several climbers on one support', () => {
  it('each get their own place around the support', () => {
    const configuration = build(
      [add('decoration', 'decoration-cork-tube', { x: 0, z: 0 }), add('plants', 'plant-pothos'), add('plants', 'plant-creeping-fig'), add('plants', 'plant-marcgravia')],
      setup('terrarium-panorama', 'moss'),
    )
    const supports = configuration.plants.map((instance) => findClimbingSupport(configuration, tank, instance, findItem('plants', instance.id)))
    const onTube = supports.filter((support) => support?.name === 'Cork Tube')
    expect(onTube.length).toBeGreaterThanOrEqual(2)
    expect(new Set(onTube.map((support) => support.climberIndex)).size).toBe(onTube.length)
    onTube.forEach((support) => expect(support.climberCount).toBe(onTube.length))
  })
})
