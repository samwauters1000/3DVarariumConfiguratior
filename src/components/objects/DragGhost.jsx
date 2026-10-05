import { createPortal } from 'react-dom'
import { findItem } from '../../data/objectCategories.js'
import { useObjectDrag } from '../../hooks/useObjectDrag.js'

// Small label that follows the pointer while an object is dragged from a catalogue.
export default function DragGhost() {
  const categoryId = useObjectDrag((state) => state.categoryId)
  const itemId = useObjectDrag((state) => state.itemId)
  const pointer = useObjectDrag((state) => state.pointer)
  const dropTarget = useObjectDrag((state) => state.dropTarget)
  const item = itemId ? findItem(categoryId, itemId) : null
  if (!item) return null

  const message = !dropTarget ? 'Drag into the terrarium' : dropTarget.valid ? 'Release to place' : dropTarget.reason
  const tone = !dropTarget ? 'neutral' : dropTarget.valid ? 'valid' : 'invalid'

  return createPortal(
    <div className={`drag-ghost drag-ghost--${tone}`} style={{ transform: `translate(${pointer.x + 16}px, ${pointer.y + 16}px)` }} aria-hidden="true">
      <span className="drag-ghost__swatch" style={{ '--swatch': item.swatch }} />
      <span className="drag-ghost__text">
        <strong>{item.name}</strong>
        <span>{message}</span>
      </span>
    </div>,
    document.body,
  )
}
