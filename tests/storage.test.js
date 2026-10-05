import { describe, expect, it } from 'vitest'
import { sanitizeConfiguration } from '../src/utils/configurationStorage.js'
import { CONFIGURATION_VERSION } from '../src/state/configuration.js'
import { add, build, hasNoOverlaps, setup } from './helpers.js'

describe('loading saved configurations', () => {
  it('rejects data that is not a configuration', () => {
    expect(sanitizeConfiguration(null)).toBeNull()
    expect(sanitizeConfiguration('text')).toBeNull()
    expect(sanitizeConfiguration({ version: CONFIGURATION_VERSION + 1 })).toBeNull()
  })

  it('keeps a valid configuration intact', () => {
    const configuration = build([add('plants', 'plant-fern'), add('decoration', 'decoration-lava-rock')], setup('terrarium-panorama'))
    const loaded = sanitizeConfiguration(JSON.parse(JSON.stringify(configuration)))
    expect(loaded).toEqual(configuration)
  })

  it('drops unknown items, duplicates and items over the maximum', () => {
    const loaded = sanitizeConfiguration({
      terrarium: 'terrarium-panorama',
      ground: 'soil',
      plants: [
        { id: 'plant-unknown', instanceId: 'a' },
        { id: 'plant-pilea', instanceId: 'b' },
        { id: 'plant-pilea', instanceId: 'b' },
        { id: 'plant-peperomia', instanceId: 'c' },
        { id: 'plant-peperomia', instanceId: 'd' },
        { id: 'plant-peperomia', instanceId: 'e' },
      ],
    })
    expect(loaded.plants.map((instance) => instance.instanceId)).toEqual(['b', 'c', 'd'])
  })

  it('drops plants that do not fit the ground or container', () => {
    const loaded = sanitizeConfiguration({
      terrarium: 'terrarium-bottle',
      ground: 'soil',
      plants: [
        { id: 'plant-cactus', instanceId: 'cactus' },
        { id: 'plant-croton', instanceId: 'croton' },
        { id: 'plant-fittonia', instanceId: 'fittonia' },
      ],
    })
    expect(loaded.plants.map((instance) => instance.id)).toEqual(['plant-fittonia'])
  })

  it('repairs broken values and overlapping positions', () => {
    const loaded = sanitizeConfiguration({
      terrarium: 'terrarium-dome',
      ground: 'soil',
      plants: [
        { id: 'plant-fern', instanceId: 'a', position: { x: 'bad' }, scale: { x: 99 } },
        { id: 'plant-fittonia', instanceId: 'b', position: { x: 0, y: 0, z: 0 } },
      ],
    })
    // Fern is a medium plant: its largest allowed scale is 200%.
    expect(loaded.plants[0].scale.x).toBe(2)
    expect(Number.isFinite(loaded.plants[0].position.x)).toBe(true)
    expect(hasNoOverlaps(loaded)).toBe(true)
  })

  it('drops everything placed when the terrarium is unknown', () => {
    const loaded = sanitizeConfiguration({ terrarium: 'terrarium-unknown', ground: 'soil', plants: [{ id: 'plant-fern', instanceId: 'a' }] })
    expect(loaded).toMatchObject({ terrarium: null, ground: null, plants: [] })
  })
})
