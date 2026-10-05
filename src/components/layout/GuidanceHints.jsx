import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon.jsx'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'

// Guidance over the 3D view (review finding R6), replacing the old box with three tips:
//
// 1. Step hint (top): says what to do next while the basics are missing: a container, then
//    a ground, then a first plant. Gone once those are in.
// 2. One tip at a time (bottom), only when it is useful, and it disappears for good once the
//    person has done it (or closes it):
//    - "Drag to turn": once there is a terrarium; done when the view is turned or zoomed.
//    - With an item selected, three short tips in turn: its size (− / +), then moving it, then
//      deleting it. Each is done once the person has resized, moved or deleted an item.
// Done tips are remembered in this browser.

const DONE_KEY = 'vararium:tips-done'

function readDone() {
  try {
    const value = JSON.parse(window.localStorage.getItem(DONE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value : [])
  } catch {
    return new Set()
  }
}

function useDoneTips() {
  const [done, setDone] = useState(readDone)
  const markDone = (id) =>
    setDone((current) => {
      if (current.has(id)) return current
      const next = new Set(current).add(id)
      try {
        window.localStorage.setItem(DONE_KEY, JSON.stringify([...next]))
      } catch {
        // Not remembered; the tip may show again next visit.
      }
      return next
    })
  return [done, markDone]
}


export default function GuidanceHints() {
  const { configuration, selection } = useConfigurator()
  const { controlsRef, pickingSpot } = useSceneApi()
  const hasMouse = useHasMousePointer()
  const [done, markDone] = useDoneTips()

  // "Drag to turn" is done once the person turns or zooms the 3D view themselves.
  useEffect(() => {
    if (done.has('rotate')) return undefined
    let controls = null
    const handle = () => markDone('rotate')
    // The 3D view loads separately; wait until its camera controls exist.
    const timer = setInterval(() => {
      if (!controlsRef.current || controls) return
      controls = controlsRef.current
      controls.addEventListener('controlstart', handle)
      clearInterval(timer)
    }, 300)
    return () => {
      clearInterval(timer)
      controls?.removeEventListener('controlstart', handle)
    }
  }, [controlsRef, done]) // eslint-disable-line react-hooks/exhaustive-deps

  // The item tips (size, then move, then delete) are each done once the person has done it:
  // resized the selected item, moved it, or deleted an item.
  const selected = selection ? configuration[selection.categoryId]?.find((instance) => instance.instanceId === selection.instanceId) : null
  const start = useRef(null)
  useEffect(() => {
    if (!selected) {
      // The item that was selected is gone: it was deleted.
      if (start.current && !configuration[start.current.categoryId]?.some((instance) => instance.instanceId === start.current.id)) markDone('delete')
      start.current = null
      return
    }
    const scale = JSON.stringify(selected.scale)
    const position = JSON.stringify(selected.position)
    if (start.current?.id !== selected.instanceId) {
      start.current = { id: selected.instanceId, categoryId: selection.categoryId, scale, position }
      return
    }
    // Resizing can nudge the item to keep it clear of others; that does not count as moving.
    if (start.current.scale !== scale) markDone('size')
    else if (start.current.position !== position) markDone('move')
    start.current = { ...start.current, scale, position }
  }, [selected, configuration]) // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Step hint.
  let stepHint = null
  if (configuration.terrarium !== null && configuration.ground === null) stepHint = 'Next, choose a ground layer for the bottom of your terrarium'
  else if (configuration.ground !== null && configuration.plants.length === 0) stepHint = hasMouse ? 'Now add a plant: click one in the list' : 'Now add a plant: press + on one in the list'

  // 2. One tip at a time. With an item selected: first its size, then moving it, then deleting.
  let tip = null
  if (selected && !done.has('size')) {
    tip = { id: 'size', icon: 'plus', text: 'Make it bigger or smaller with − and + in the bar above it.' }
  } else if (selected && !done.has('move')) {
    tip = {
      id: 'move',
      icon: 'move',
      text: hasMouse ? 'Drag it to a new spot, or press Move in the bar above it.' : 'Drag it with your finger, or press Move in the bar above it.',
    }
  } else if (selected && !done.has('delete')) {
    tip = { id: 'delete', icon: 'trash', text: 'Changed your mind? The bin in the bar above it deletes it.' }
  } else if (configuration.terrarium !== null && !done.has('rotate')) {
    tip = { id: 'rotate', icon: 'rotateLeft', text: hasMouse ? 'Drag the 3D view to turn it, scroll to zoom' : 'Drag with one finger to turn the view, pinch to zoom' }
  }

  return (
    <>
      {configuration.terrarium === null && (
        <div className="stage__hint">
          <p>Choose a container to begin.</p>
        </div>
      )}
      {stepHint && !pickingSpot && (
        <p className="stage__step-hint" role="status">
          <Icon name="sparkle" size={16} />
          {stepHint}
        </p>
      )}
      {tip && (
        <div className="stage__tip" role="note">
          <Icon name={tip.icon} size={16} />
          <span>{tip.text}</span>
          <button type="button" className="stage__tip-close" onClick={() => markDone(tip.id)} aria-label="Close tip" title="Close tip">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </>
  )
}
