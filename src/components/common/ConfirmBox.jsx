import { useEffect, useId, useRef } from 'react'

// Inline confirmation shown before a change that would remove items from the configuration.
export default function ConfirmBox({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const boxRef = useRef(null)
  const id = useId()

  useEffect(() => {
    boxRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <div
      ref={boxRef}
      className="confirm-box"
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
    >
      <p id={`${id}-title`} className="confirm-box__title">
        {title}
      </p>
      <p id={`${id}-text`} className="confirm-box__text">
        {children}
      </p>
      <div className="confirm-box__actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
