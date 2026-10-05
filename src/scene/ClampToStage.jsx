import { useLayoutEffect, useRef } from 'react'

// Keeps floating HTML that follows an object in the 3D view (the object toolbar) inside the
// visible 3D view. Near an edge it slides back in, instead of running off the screen; it
// also stays below the top row of controls. Measured every frame while shown, because the
// camera and the object can move.

const SIDE_MARGIN = 8
const TOP_MARGIN = 60 // below the undo / redo row
const BOTTOM_MARGIN = 8

export default function ClampToStage({ children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined
    let offsetX = 0
    let offsetY = 0
    let frame = 0

    const update = () => {
      const stage = element.closest('.stage')
      if (stage) {
        const box = element.getBoundingClientRect()
        const bounds = stage.getBoundingClientRect()
        // Where the toolbar would be without any correction.
        const left = box.left - offsetX
        const right = box.right - offsetX
        const top = box.top - offsetY
        const bottom = box.bottom - offsetY
        const minX = bounds.left + SIDE_MARGIN - left
        const maxX = bounds.right - SIDE_MARGIN - right
        const minY = bounds.top + TOP_MARGIN - top
        const maxY = bounds.bottom - BOTTOM_MARGIN - bottom
        // Wider than the view: centre it; otherwise push it just enough to stay inside.
        const nextX = minX > maxX ? (minX + maxX) / 2 : Math.min(Math.max(0, minX), maxX)
        const nextY = minY > maxY ? minY : Math.min(Math.max(0, minY), maxY)
        if (Math.abs(nextX - offsetX) > 0.5 || Math.abs(nextY - offsetY) > 0.5) {
          offsetX = nextX
          offsetY = nextY
          element.style.transform = `translate(${offsetX}px, ${offsetY}px)`
        }
      }
      frame = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div ref={ref} className="clamp-to-stage">
      {children}
    </div>
  )
}
