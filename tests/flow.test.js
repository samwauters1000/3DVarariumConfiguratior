import { describe, expect, it } from 'vitest'
import { initialConfiguration } from '../src/state/configuration.js'
import { allRequiredDone, getMissingStep, getNextStepHint, isSectionDone } from '../src/rules/flowRules.js'
import { add, build, setup, terrarium } from './helpers.js'

describe('building flow', () => {
  it('knows when a section is done', () => {
    const withPlant = build([add('plants', 'plant-fern')], setup('terrarium-dome', 'soil'))
    expect(isSectionDone(initialConfiguration, 'terrarium')).toBe(false)
    expect(isSectionDone(withPlant, 'terrarium')).toBe(true)
    expect(isSectionDone(withPlant, 'plants')).toBe(true)
    expect(isSectionDone(withPlant, 'decoration')).toBe(false)
    expect(isSectionDone({ ...withPlant, lights: ['light-fairy'] }, 'equipment')).toBe(true)
    expect(allRequiredDone(withPlant)).toBe(true)
    expect(allRequiredDone(setup('terrarium-dome', 'soil'))).toBe(false)
  })

  it('names the step that is missing first', () => {
    expect(getMissingStep(initialConfiguration, 'plants')).toBe('terrarium')
    expect(getMissingStep(build([terrarium('terrarium-dome')]), 'plants')).toBe('ground')
    expect(getMissingStep(build([terrarium('terrarium-dome')]), 'equipment')).toBeNull()
    expect(getMissingStep(setup(), 'animals')).toBeNull()
  })

  it('points to the next step only after a required choice', () => {
    expect(getNextStepHint(initialConfiguration, 'terrarium')).toBeNull()
    expect(getNextStepHint(build([terrarium('terrarium-dome')]), 'terrarium')).toEqual({ kind: 'next', categoryId: 'ground', optional: false })
    expect(getNextStepHint(setup(), 'ground')).toEqual({ kind: 'next', categoryId: 'plants', optional: false })
    expect(getNextStepHint(setup(), 'plants')).toBeNull()
  })

  it('lets optional sections be skipped, and ends at Confirm', () => {
    const ready = build([add('plants', 'plant-fern')], setup('terrarium-dome', 'soil'))
    expect(getNextStepHint(ready, 'decoration')).toEqual({ kind: 'skip', categoryId: 'equipment', optional: true })
    expect(getNextStepHint(ready, 'equipment')).toEqual({ kind: 'skip', categoryId: 'animals', optional: true })
    expect(getNextStepHint(ready, 'animals')).toEqual({ kind: 'finish' })
    expect(getNextStepHint(setup(), 'animals')).toBeNull()
  })

  it('sends people to the missing step instead of a section they cannot use yet', () => {
    expect(getNextStepHint(build([terrarium('terrarium-dome')]), 'decoration')).toEqual({ kind: 'skip', categoryId: 'equipment', optional: true })
    expect(getNextStepHint(build([terrarium('terrarium-dome')]), 'equipment')).toEqual({ kind: 'skip', categoryId: 'ground', optional: false })
  })
})
