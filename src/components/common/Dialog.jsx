import { useEffect, useId, useRef } from 'react'
import Icon from './Icon.jsx'

// Modal dialog: closes on Escape and on a click outside, restores focus afterwards.
// On phones it slides up from the bottom (see .summary styles).
export default function Dialog({ title, subtitle, closeLabel = 'Close', onClose, footer, children }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.classList.add('has-dialog')
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.classList.remove('has-dialog')
      previousFocus?.focus?.()
    }
  }, [onClose])

  return (
    <div className="summary-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="summary"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="summary__header">
          <div>
            <h2 id={titleId} className="summary__title">
              {title}
            </h2>
            {subtitle && <p className="summary__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={closeLabel}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="summary__body">{children}</div>
        {footer && <footer className="summary__footer">{footer}</footer>}
      </div>
    </div>
  )
}
