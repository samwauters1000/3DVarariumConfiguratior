import { useId, useState } from 'react'
import Icon from './Icon.jsx'

// Panel section with a clickable header that folds its content open or closed.
// Sections are stacked under each other, separated by a thin line.
export default function CollapsibleSection({ title, count, icon, note, variant, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className={`collapsible${variant ? ` collapsible--${variant}` : ''}${isOpen ? ' is-open' : ''}`}>
      <h3 className="collapsible__heading">
        <button
          type="button"
          className="collapsible__toggle"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          {icon && <Icon name={icon} size={14} />}
          <span className="collapsible__title">{title}</span>
          {count !== undefined && <span className="section-label__count">{count}</span>}
          <Icon name="chevron" size={16} className="collapsible__chevron" />
        </button>
      </h3>
      {isOpen && (
        <div id={contentId} className="collapsible__content">
          {note && <p className="section-note">{note}</p>}
          {children}
        </div>
      )}
    </section>
  )
}
