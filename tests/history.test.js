import { describe, expect, it } from 'vitest'
import { HISTORY_LIMIT, historyReducer } from '../src/state/configurationReducer.js'
import { initialConfiguration } from '../src/state/configuration.js'
import { add, ground, terrarium } from './helpers.js'

const run = (actions, start = { past: [], present: initialConfiguration, future: [] }) => actions.reduce(historyReducer, start)
const started = () => run([terrarium('terrarium-panorama'), ground('soil')])

describe('undo / redo', () => {
  it('undoes and redoes changes in order', () => {
    const history = run([add('plants', 'plant-fern'), add('plants', 'plant-pilea')], started())
    expect(history.present.plants).toHaveLength(2)

    const undone = run([{ type: 'undo' }, { type: 'undo' }], history)
    expect(undone.present.plants).toHaveLength(0)

    const redone = run([{ type: 'redo' }], undone)
    expect(redone.present.plants).toHaveLength(1)
  })

  it('does nothing when there is nothing to undo or redo', () => {
    const empty = { past: [], present: initialConfiguration, future: [] }
    expect(run([{ type: 'undo' }], empty)).toBe(empty)
    expect(run([{ type: 'redo' }], empty)).toBe(empty)
  })

  it('does not record actions that change nothing', () => {
    const history = started()
    // A cactus does not grow in soil, so adding it is refused and not recorded.
    const after = run([add('plants', 'plant-cactus')], history)
    expect(after).toBe(history)
  })

  it('clears the redo steps after a new change', () => {
    const history = run([add('plants', 'plant-fern'), { type: 'undo' }, add('plants', 'plant-pilea')], started())
    expect(history.future).toEqual([])
    expect(history.present.plants.map((instance) => instance.id)).toEqual(['plant-pilea'])
  })

  it('keeps at most the history limit', () => {
    let history = started()
    for (let step = 0; step < HISTORY_LIMIT + 10; step++) {
      history = run([terrarium(step % 2 ? 'terrarium-dome' : 'terrarium-panorama')], history)
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT)
  })

  it('can undo "Start over"', () => {
    const history = run([add('plants', 'plant-fern'), { type: 'reset' }], started())
    expect(history.present).toBe(initialConfiguration)
    expect(run([{ type: 'undo' }], history).present.plants).toHaveLength(1)
  })
})
