import { useSyncExternalStore } from 'react'
import { createInstanceId } from '../utils/ids.js'

// Drag-and-drop from a catalogue into the 3D scene, for any placeable category.
// Drag state lives outside React state so pointer moves do not re-render the whole app.
// Only components that subscribe to a specific slice update.
const initialDragState = {
  categoryId: null,
  itemId: null,
  // Id of the object that will be created on drop; also seeds the preview's look.
  instanceId: null,
  pointer: { x: 0, y: 0 },
  // Set by the 3D scene while the pointer is over the terrarium.
  dropTarget: null,
}

let state = initialDragState
const listeners = new Set()

// Remembers whether the last drag actually moved, so the click that follows a drag
// is not mistaken for a click on the card.
const DRAG_THRESHOLD = 5
let lastDragEnd = { moved: false, time: 0 }
export const endedDragJustNow = () => lastDragEnd.moved && performance.now() - lastDragEnd.time < 400

export const objectDragStore = {
  getState: () => state,
  setState: (partial) => {
    state = { ...state, ...partial }
    listeners.forEach((listener) => listener())
  },
  reset: () => {
    state = initialDragState
    listeners.forEach((listener) => listener())
  },
  subscribe: (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useObjectDrag(selector) {
  return useSyncExternalStore(objectDragStore.subscribe, () => selector(objectDragStore.getState()))
}

// Starts a pointer-based drag from a catalogue card. `onDrop(position, instanceId)` runs
// only when the object is released on a valid spot inside the terrarium.
export function startObjectDrag(event, categoryId, itemId, onDrop) {
  if (event.button !== undefined && event.button !== 0) return
  event.preventDefault()

  const instanceId = createInstanceId(itemId)
  objectDragStore.setState({ categoryId, itemId, instanceId, pointer: { x: event.clientX, y: event.clientY }, dropTarget: null })
  document.body.classList.add('is-dragging-object')
  window.getSelection()?.removeAllRanges()

  // Stop the browser from selecting text while the pointer moves over the page.
  const preventSelection = (selectEvent) => selectEvent.preventDefault()
  document.addEventListener('selectstart', preventSelection)

  const start = { x: event.clientX, y: event.clientY }
  let moved = false

  const handleMove = (moveEvent) => {
    if (Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) > DRAG_THRESHOLD) moved = true
    objectDragStore.setState({ pointer: { x: moveEvent.clientX, y: moveEvent.clientY } })
  }

  const finish = (commit) => {
    const { dropTarget } = objectDragStore.getState()
    lastDragEnd = { moved, time: performance.now() }
    window.removeEventListener('pointermove', handleMove)
    window.removeEventListener('pointerup', handleUp)
    window.removeEventListener('pointercancel', handleCancel)
    document.removeEventListener('selectstart', preventSelection)
    document.body.classList.remove('is-dragging-object')
    objectDragStore.reset()
    if (commit && dropTarget?.valid) onDrop(dropTarget.position, instanceId)
  }

  const handleUp = () => finish(true)
  const handleCancel = () => finish(false)

  window.addEventListener('pointermove', handleMove)
  window.addEventListener('pointerup', handleUp)
  window.addEventListener('pointercancel', handleCancel)
}
