import { describe, expect, it } from 'vitest'
import { plants } from '../src/data/plants.js'
import { animals } from '../src/data/animals.js'
import { plantCare, animalCare } from '../src/data/care.js'
import { initialConfiguration } from '../src/state/configuration.js'
import { getCareWarnings } from '../src/rules/careWarnings.js'
import { getPriceSections } from '../src/utils/pricing.js'
import { sanitizeConfiguration } from '../src/utils/configurationStorage.js'
import { decodeConfiguration, encodeConfiguration } from '../src/utils/shareLink.js'
import { createCareSheet } from '../src/utils/summary.js'
import { findLight, lights } from '../src/data/equipment.js'
import { findTerrarium } from '../src/data/catalogue.js'
import { getLightFit } from '../src/rules/equipmentRules.js'
import { getObjectsRemovedByTerrariumChange } from '../src/rules/objectRules.js'
import { getLightSpots } from '../src/rules/placementRules.js'
import { add, build, hasNoOverlaps, setup, terrarium } from './helpers.js'

const lid = (lidId) => ({ type: 'selectLid', lidId })
const light = (lightId) => ({ type: 'toggleLight', lightId })

// Plain configuration for the care warnings (they only read ids).
const design = (terrariumId, { plants: plantIds = [], animals: animalIds = [], decoration = [], lid: lidId = null, light: lightId = null } = {}) => ({
  ...initialConfiguration,
  terrarium: terrariumId,
  ground: 'soil',
  lid: lidId,
  lights: lightId ? [lightId] : [],
  plants: plantIds.map((id, index) => ({ id, instanceId: `p${index}` })),
  animals: animalIds.map((id, index) => ({ id, instanceId: `a${index}` })),
  decoration: decoration.map((id, index) => ({ id, instanceId: `d${index}` })),
})
const warningIds = (configuration) => getCareWarnings(configuration).map((warning) => warning.id)

describe('care data', () => {
  it('covers every plant and animal', () => {
    plants.forEach((plant) => expect(plantCare[plant.id], plant.id).toBeDefined())
    animals.forEach((animal) => expect(animalCare[animal.id], animal.id).toBeDefined())
  })

  it('builds a care sheet with each item once', () => {
    const sheet = createCareSheet(design('terrarium-panorama', { plants: ['plant-fern', 'plant-fern'], animals: ['animal-snail'] }))
    expect(sheet.map((entry) => entry.id)).toEqual(['plant-fern', 'animal-snail'])
  })
})

describe('lid & light', () => {
  it('only puts lids on open containers', () => {
    expect(build([lid('lid-glass')], setup('terrarium-bowl')).lid).toBe('lid-glass')
    expect(build([lid('lid-glass')], setup('terrarium-dome')).lid).toBe(null)
    expect(build([lid('lid-unknown')], setup('terrarium-bowl')).lid).toBe(null)
  })

  it('removes the lid when switching to a closed container', () => {
    const withLid = build([lid('lid-mesh')], setup('terrarium-bowl'))
    expect(build([terrarium('terrarium-panorama')], withLid).lid).toBe('lid-mesh')
    expect(build([terrarium('terrarium-dome')], withLid).lid).toBe(null)
  })

  it('needs a terrarium for a lamp, and can switch it off again', () => {
    expect(build([light('light-led')]).lights).toEqual([])
    const lit = build([light('light-led')], setup())
    expect(lit.lights).toEqual(['light-led'])
    expect(build([light('light-led')], lit).lights).toEqual([])
  })

  it('keeps one lamp, but combines special lights with it', () => {
    const configuration = build([light('light-led'), light('light-fairy'), light('light-puck'), light('light-mushroom')], setup())
    expect(configuration.lights).toEqual(['light-fairy', 'light-puck', 'light-mushroom'])
  })

  it('only fits lights that physically fit the container (real sizes in cm)', () => {
    const fits = (lightId, terrariumId) => getLightFit(findLight(lightId), findTerrarium(terrariumId))
    // 20 cm bar: fits the dome (22 cm) and the bowl rod (26 cm), not the prism (17 cm), heart or bottle.
    expect(fits('light-led', 'terrarium-dome').fits).toBe(true)
    expect(fits('light-led', 'terrarium-bowl').fits).toBe(true)
    expect(fits('light-led', 'terrarium-geometric')).toEqual({ fits: false, reason: 'Too long: the Geometric Prism has room for 17 cm' })
    expect(fits('light-led', 'terrarium-heart')).toEqual({ fits: false, reason: 'The Brass Heart has no flat top for a light bar' })
    // 60 cm bar and 38 cm UVB tube: only the Panorama Tank.
    for (const id of ['terrarium-dome', 'terrarium-geometric', 'terrarium-bowl', 'terrarium-heart', 'terrarium-bottle']) {
      expect(fits('light-led-60', id).fits).toBe(false)
      expect(fits('light-uvb', id).fits).toBe(false)
    }
    expect(fits('light-led-60', 'terrarium-panorama').fits).toBe(true)
    expect(fits('light-uvb', 'terrarium-panorama').fits).toBe(true)
    // Ø 7 cm puck: everywhere except the bottle neck; the cork light only in the bottle.
    expect(fits('light-puck', 'terrarium-bottle')).toEqual({ fits: false, reason: 'Too wide: the Tiny Bottle has room for Ø 2.5 cm' })
    expect(fits('light-cork', 'terrarium-bottle').fits).toBe(true)
    expect(fits('light-cork', 'terrarium-dome').fits).toBe(false)
    // Mushroom lamp needs 12 cm of soil: not in the bottle. Fairy lights fit everywhere.
    expect(fits('light-mushroom', 'terrarium-bottle').fits).toBe(false)
    expect(build([light('light-fairy'), light('light-moon'), light('light-cork')], setup('terrarium-bottle')).lights).toEqual(['light-fairy', 'light-moon', 'light-cork'])
  })

  it('has one fixed size per light', () => {
    expect(findLight('light-warm')).toBeNull()
    lights.forEach((entry) => {
      expect(entry.sizeCm, entry.id).toBeGreaterThan(0)
      expect(['bar', 'puck', 'cork', 'floor', 'string']).toContain(entry.mount)
    })
  })

  it('combines a grow bar, UVB and moonlight in the Panorama Tank', () => {
    expect(build([light('light-led-60'), light('light-uvb'), light('light-moon')], setup('terrarium-panorama')).lights).toEqual(['light-led-60', 'light-uvb', 'light-moon'])
  })

  it('removes lights that do not fit a new container, after asking', () => {
    const lit = build([light('light-led'), light('light-fairy')], setup('terrarium-dome'))
    const removed = getObjectsRemovedByTerrariumChange(lit, 'terrarium-geometric')
    expect(removed.map((entry) => [entry.item.id, entry.reason])).toEqual([['light-led', 'light']])
    expect(build([terrarium('terrarium-geometric')], lit).lights).toEqual(['light-fairy'])
  })

  it('keeps plants and decoration away from the mushroom lamp', () => {
    let configuration = build([light('light-mushroom')], setup('terrarium-dome'))
    const [spot] = getLightSpots(configuration, findTerrarium('terrarium-dome'))
    configuration = build([add('plants', 'plant-fern', spot.position)], configuration)
    expect(configuration.plants[0].position).not.toEqual({ ...spot.position, y: 0 })
    expect(hasNoOverlaps(configuration)).toBe(true)
    // A plant already standing there moves when the lamp is switched on.
    const planted = build([add('plants', 'plant-fittonia', { ...spot.position, y: 0 })], setup('terrarium-dome'))
    expect(planted.plants[0].position).toEqual({ ...spot.position, y: 0 })
    const moved = build([light('light-mushroom')], planted)
    expect(moved.plants[0].position).not.toEqual(planted.plants[0].position)
    expect(hasNoOverlaps(moved)).toBe(true)
  })

  it('adds lid and lights to the price', () => {
    const configuration = build([lid('lid-glass'), light('light-puck'), light('light-fairy')], setup('terrarium-bowl'))
    const section = getPriceSections(configuration).find((entry) => entry.id === 'equipment')
    expect(section.lines.map((line) => line.total)).toEqual([12, 14, 9])
  })

  it('survives saving and share links, and drops invalid lids and lights', () => {
    const configuration = build([lid('lid-glass'), light('light-puck'), light('light-fairy')], setup('terrarium-bowl'))
    const restored = decodeConfiguration(encodeConfiguration(configuration))
    expect(restored.lid).toBe('lid-glass')
    expect(restored.lights).toEqual(['light-puck', 'light-fairy'])
    expect(sanitizeConfiguration({ ...configuration, terrarium: 'terrarium-dome' }).lid).toBe(null)
    expect(sanitizeConfiguration({ ...configuration, terrarium: 'terrarium-bottle' }).lights).toEqual(['light-fairy'])
    // Older saves with a single `light`.
    const { lights, ...old } = configuration
    expect(sanitizeConfiguration({ ...old, light: 'light-puck' }).lights).toEqual(['light-puck'])
  })
})

describe('care warnings', () => {
  it('warn about climbers escaping from open containers until a lid is added', () => {
    expect(warningIds(design('terrarium-bowl', { animals: ['animal-dart-frog'] }))).toContain('escape')
    expect(warningIds(design('terrarium-bowl', { animals: ['animal-dart-frog'], lid: 'lid-mesh' }))).not.toContain('escape')
    expect(warningIds(design('terrarium-dome', { animals: ['animal-dart-frog'] }))).not.toContain('escape')
  })

  it('ask for a hiding place', () => {
    expect(warningIds(design('terrarium-dome', { animals: ['animal-dart-frog'] }))).toContain('hide')
    expect(warningIds(design('terrarium-dome', { animals: ['animal-dart-frog'], decoration: ['decoration-coconut-hide'] }))).not.toContain('hide')
  })

  it('keep solitary animals and predators apart, but allow a clean-up crew', () => {
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-crested-gecko', 'animal-dart-frog'] }))).toContain('solitary')
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-crested-gecko', 'animal-isopods'] }))).not.toContain('solitary')
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-dart-frog', 'animal-tree-frog'] }))).toContain('predators')
  })

  it('flag humid animals with dry-loving plants', () => {
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-snail'], plants: ['plant-cactus'] }))).toContain('humidity')
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-snail'], plants: ['plant-fern'] }))).not.toContain('humidity')
  })

  it('ask for UVB for a chameleon', () => {
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-chameleon'] }))).toContain('uvb')
    expect(warningIds(design('terrarium-panorama', { animals: ['animal-chameleon'], light: 'light-uvb' }))).not.toContain('uvb')
  })

  it('give light tips until a grow light is added', () => {
    expect(warningIds(design('terrarium-dome', { plants: ['plant-cactus'] }))).toContain('light')
    expect(warningIds(design('terrarium-dome', { plants: ['plant-cactus'], light: 'light-led' }))).not.toContain('light')
  })

  it('are empty without a terrarium', () => {
    expect(getCareWarnings(initialConfiguration)).toEqual([])
  })
})
