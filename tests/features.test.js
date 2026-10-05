import { describe, expect, it } from 'vitest'
import { chooseFillPlants, chooseFillSet, isFillSetEmpty } from '../src/rules/autoFill.js'
import { getCareWarnings } from '../src/rules/careWarnings.js'
import { findTerrarium } from '../src/data/catalogue.js'
import { findLight } from '../src/data/equipment.js'
import { getLightFit } from '../src/rules/equipmentRules.js'
import { findItem } from '../src/data/objectCategories.js'
import { plants } from '../src/data/plants.js'
import { animals } from '../src/data/animals.js'
import { decorationItems } from '../src/data/decoration.js'
import { historyReducer } from '../src/state/configurationReducer.js'
import { decodeConfiguration, encodeConfiguration } from '../src/utils/shareLink.js'
import { getItemAvailability } from '../src/rules/objectRules.js'
import { add, build, hasNoOverlaps, setup } from './helpers.js'

// Seeded random for predictable tests.
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const fillAction = (configuration, random = seeded()) => ({
  type: 'fillPlants',
  items: chooseFillPlants(configuration, random).map((itemId, index) => ({ itemId, instanceId: `${itemId}-fill-${index}` })),
})

describe('Fill for me', () => {
  it('adds a balanced mix of suitable plants in one undo step', () => {
    const start = { past: [], present: setup('terrarium-panorama', 'soil'), future: [] }
    const filled = historyReducer(start, fillAction(start.present))
    const sizes = filled.present.plants.map((instance) => findItem('plants', instance.id).size)
    expect(sizes).toContain('large')
    expect(sizes).toContain('medium')
    expect(sizes).toContain('small')
    expect(hasNoOverlaps(filled.present)).toBe(true)
    expect(filled.past).toHaveLength(1)
    expect(historyReducer(filled, { type: 'undo' }).present.plants).toHaveLength(0)
  })

  it('only picks plants that suit the ground and container', () => {
    const inBottle = setup('terrarium-bottle', 'sand')
    const ids = chooseFillPlants(inBottle, seeded(3))
    ids.forEach((id) => {
      const plant = findItem('plants', id)
      expect(plant.compatibleGround).toContain('sand')
      expect(plant.size).toBe('small')
    })
  })

  it('leaves rare plants for the user', () => {
    const ids = chooseFillPlants(setup('terrarium-panorama', 'moss'), seeded(5))
    ids.forEach((id) => expect(findItem('plants', id).rarity).toBeUndefined())
  })

  it('picks nothing before a ground is chosen', () => {
    expect(chooseFillPlants(build([{ type: 'selectTerrarium', terrariumId: 'terrarium-dome' }]))).toEqual([])
  })
})

const fillDesignAction = (configuration, options, random = seeded()) => {
  const set = chooseFillSet(configuration, options, random)
  const withIds = (ids) => ids.map((itemId, index) => ({ itemId, instanceId: `${itemId}-fill-${index}` }))
  return { type: 'fillDesign', decoration: withIds(set.decoration), plants: withIds(set.plants), animals: withIds(set.animals), lid: set.lid, lights: set.lights }
}

describe('Fill for me: complete setup', () => {
  it('adds plants, decoration, lights and an animal in one undo step, without care warnings', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const start = { past: [], present: setup('terrarium-panorama', 'moss'), future: [] }
      const filled = historyReducer(start, fillDesignAction(start.present, { includeAnimal: true }, seeded(seed)))
      const result = filled.present
      expect(result.plants.length).toBeGreaterThanOrEqual(5)
      expect(result.decoration.length).toBeGreaterThanOrEqual(2)
      expect(result.animals).toHaveLength(1)
      expect(result.lights).toContain('light-fairy')
      expect(result.lights.some((id) => id !== 'light-fairy')).toBe(true)
      expect(hasNoOverlaps(result)).toBe(true)
      expect(getCareWarnings(result).filter((warning) => warning.tone === 'warning')).toEqual([])
      expect(filled.past).toHaveLength(1)
    }
  })

  it('can leave the animal out', () => {
    const configuration = setup('terrarium-panorama', 'soil')
    expect(chooseFillSet(configuration, { includeAnimal: false }).animals).toEqual([])
  })

  it('only uses lights that fit the container', () => {
    expect(chooseFillSet(setup('terrarium-bottle', 'soil'), {}, seeded(2)).lights).toEqual(['light-cork', 'light-fairy'])
    expect(chooseFillSet(setup('terrarium-panorama', 'soil'), {}, seeded(2)).lights).toEqual(['light-led-60', 'light-fairy'])
    for (const id of ['terrarium-dome', 'terrarium-geometric', 'terrarium-bowl', 'terrarium-heart', 'terrarium-bottle', 'terrarium-panorama']) {
      const terrariumData = findTerrarium(id)
      for (const seed of [1, 2, 3]) {
        chooseFillSet(setup(id, 'soil'), {}, seeded(seed)).lights.forEach((lightId) => expect(getLightFit(findLight(lightId), terrariumData).fits, ` in `).toBe(true))
      }
    }
  })

  it('replaces everything inside the terrarium instead of adding on top', () => {
    const own = build(
      [add('plants', 'plant-fern'), add('plants', 'plant-fern'), add('decoration', 'decoration-mini-pond'), add('animals', 'animal-dart-frog'), { type: 'toggleLight', lightId: 'light-moon' }],
      setup('terrarium-panorama', 'moss'),
    )
    const filled = build([fillDesignAction(own, { includeAnimal: false })], own)
    expect(filled.terrarium).toBe('terrarium-panorama')
    expect(filled.ground).toBe('moss')
    expect(filled.animals).toEqual([])
    expect(filled.lights).not.toContain('light-moon')
    const oldIds = new Set([...own.plants, ...own.decoration].map((instance) => instance.instanceId))
    expect([...filled.plants, ...filled.decoration].some((instance) => oldIds.has(instance.instanceId))).toBe(false)
  })

  it('stays within the limits when pressed again and again', () => {
    let state = { past: [], present: setup('terrarium-heart', 'soil'), future: [] }
    for (const seed of [1, 2, 3, 4]) state = historyReducer(state, fillDesignAction(state.present, {}, seeded(seed)))
    const result = state.present
    expect(result.plants.length).toBeLessThanOrEqual(findTerrarium('terrarium-heart').maxPlants)
    for (const categoryId of ['plants', 'decoration', 'animals']) {
      const counts = {}
      result[categoryId].forEach((instance) => (counts[instance.id] = (counts[instance.id] ?? 0) + 1))
      Object.entries(counts).forEach(([id, count]) => expect(count).toBeLessThanOrEqual(findItem(categoryId, id).maxQuantity))
    }
    expect(hasNoOverlaps(result)).toBe(true)
  })

  it('can be undone in one step, bringing the previous design back', () => {
    const own = build([add('plants', 'plant-fern')], setup('terrarium-dome', 'soil'))
    const filled = historyReducer({ past: [], present: own, future: [] }, fillDesignAction(own))
    expect(historyReducer(filled, { type: 'undo' }).present).toBe(own)
  })

  it('does nothing before a ground is chosen', () => {
    expect(isFillSetEmpty(chooseFillSet(build([{ type: 'selectTerrarium', terrariumId: 'terrarium-dome' }])))).toBe(true)
  })
})

describe('share links', () => {
  it('restore the same design, including colours', () => {
    const configuration = build(
      [add('plants', 'plant-fern'), add('decoration', 'decoration-mini-pond'), add('animals', 'animal-tree-frog')],
      setup('terrarium-panorama', 'moss'),
    )
    const recoloured = build([{ type: 'setObjectVariant', categoryId: 'animals', instanceId: configuration.animals[0].instanceId, variant: 'lime' }], configuration)
    const decoded = decodeConfiguration(encodeConfiguration(recoloured))
    expect(decoded.terrarium).toBe('terrarium-panorama')
    expect(decoded.plants.map((instance) => instance.id)).toEqual(['plant-fern'])
    expect(decoded.decoration.map((instance) => instance.id)).toEqual(['decoration-mini-pond'])
    expect(decoded.animals[0].variant).toBe('lime')
  })

  it('ignore broken links', () => {
    expect(decodeConfiguration('not-a-real-design')).toBeNull()
  })
})

describe('second round of content', () => {
  it('adds the new plants, animals and decoration', () => {
    ;['plant-lithops', 'plant-string-of-pearls', 'plant-birds-nest-fern', 'plant-maidenhair-fern', 'plant-mini-aloe', 'plant-tillandsia-xerographica'].forEach((id) =>
      expect(plants.some((plant) => plant.id === id)).toBe(true),
    )
    ;['animal-tree-frog', 'animal-chameleon', 'animal-hermit-crab'].forEach((id) => expect(animals.some((animal) => animal.id === id)).toBe(true))
    ;['decoration-cork-background', 'decoration-mini-pond', 'decoration-glow-mushrooms'].forEach((id) =>
      expect(decorationItems.some((item) => item.id === id)).toBe(true),
    )
  })

  it('keeps hermit crabs on sand and lithops out of wet ground', () => {
    const onMoss = setup('terrarium-panorama', 'moss')
    expect(getItemAvailability('animals', findItem('animals', 'animal-hermit-crab'), onMoss).canAdd).toBe(false)
    expect(getItemAvailability('plants', findItem('plants', 'plant-lithops'), onMoss).canAdd).toBe(false)
    const onSand = setup('terrarium-panorama', 'sand')
    expect(getItemAvailability('animals', findItem('animals', 'animal-hermit-crab'), onSand).canAdd).toBe(true)
  })
})
