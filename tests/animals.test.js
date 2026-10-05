import { describe, expect, it } from 'vitest'
import { findItem } from '../src/data/objectCategories.js'
import { animals } from '../src/data/animals.js'
import { getItemAvailability } from '../src/rules/objectRules.js'
import { getPriceSections } from '../src/utils/pricing.js'
import { sanitizeConfiguration } from '../src/utils/configurationStorage.js'
import { historyReducer } from '../src/state/configurationReducer.js'
import { add, build, setup } from './helpers.js'

const setVariant = (instance, variant) => ({ type: 'setObjectVariant', categoryId: 'animals', instanceId: instance.instanceId, variant })

describe('animals', () => {
  it('all have at least one colour variant', () => {
    expect(animals.length).toBeGreaterThanOrEqual(6)
    animals.forEach((animal) => expect(animal.colorVariants.length).toBeGreaterThanOrEqual(1))
  })

  it('start with their first colour variant', () => {
    const configuration = build([add('animals', 'animal-dart-frog')], setup('terrarium-panorama', 'moss'))
    expect(configuration.animals[0].variant).toBe('azureus')
  })

  it('can change colour, and ignore unknown colours', () => {
    const placed = build([add('animals', 'animal-dart-frog')], setup('terrarium-panorama', 'moss'))
    const frog = placed.animals[0]
    expect(build([setVariant(frog, 'yellow')], placed).animals[0].variant).toBe('yellow')
    expect(build([setVariant(frog, 'purple')], placed)).toBe(placed)
  })

  it('can undo a colour change', () => {
    const placed = build([add('animals', 'animal-crested-gecko')], setup('terrarium-panorama', 'moss'))
    const gecko = placed.animals[0]
    let history = { past: [], present: placed, future: [] }
    history = historyReducer(history, setVariant(gecko, 'dark'))
    expect(history.present.animals[0].variant).toBe('dark')
    history = historyReducer(history, { type: 'undo' })
    expect(history.present.animals[0].variant).toBe('flame')
  })

  it('need a suitable ground: no frogs on dry sand', () => {
    const onSand = setup('terrarium-panorama', 'sand')
    const result = getItemAvailability('animals', findItem('animals', 'animal-dart-frog'), onSand)
    expect(result.reason).toBe('Does not live in Sand · Needs Moss or Bark')
  })

  it('keep medium animals out of the Tiny Bottle', () => {
    const inBottle = setup('terrarium-bottle', 'moss')
    expect(getItemAvailability('animals', findItem('animals', 'animal-crested-gecko'), inBottle).reason).toBe('Too big for the Tiny Bottle')
    expect(getItemAvailability('animals', findItem('animals', 'animal-snail'), inBottle).canAdd).toBe(true)
  })

  it('show their colour on the receipt, one line per colour', () => {
    const placed = build([add('animals', 'animal-isopods'), add('animals', 'animal-isopods')], setup('terrarium-panorama', 'soil'))
    const recoloured = build([setVariant(placed.animals[1], 'orange')], placed)
    const lines = getPriceSections(recoloured).find((section) => section.id === 'animals').lines
    expect(lines.map((line) => line.name)).toEqual(['Rolly Pollies (Classic grey)', 'Rolly Pollies (Orange)'])
  })

  it('keep a saved colour, and repair an unknown one', () => {
    const loaded = sanitizeConfiguration({
      terrarium: 'terrarium-panorama',
      ground: 'moss',
      animals: [
        { id: 'animal-snail', instanceId: 'a', variant: 'striped' },
        { id: 'animal-snail', instanceId: 'b', variant: 'rainbow' },
      ],
    })
    expect(loaded.animals.map((instance) => instance.variant)).toEqual(['striped', 'amber'])
  })
})
