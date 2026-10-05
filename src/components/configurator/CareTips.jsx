import { useMemo, useState } from 'react'
import Icon from '../common/Icon.jsx'
import { getCareWarnings } from '../../rules/careWarnings.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// Compact "Care tips" box at the top of the panel: advice about the whole terrarium
// (escape risk, hiding places, humidity, animals that don't get along). Folded by default
// when there are only tips, open when there is a real warning.
export default function CareTips() {
  const { configuration } = useConfigurator()
  const warnings = useMemo(() => getCareWarnings(configuration), [configuration])
  const warningCount = warnings.filter((warning) => warning.tone === 'warning').length
  const [openState, setOpenState] = useState(null)
  const isOpen = openState ?? warningCount > 0

  if (warnings.length === 0) return null

  return (
    <div className={`care-tips${warningCount > 0 ? ' care-tips--warning' : ''}${isOpen ? ' is-open' : ''}`}>
      <button type="button" className="care-tips__toggle" aria-expanded={isOpen} onClick={() => setOpenState(!isOpen)}>
        <Icon name="info" size={16} />
        <span className="care-tips__title">
          {warningCount > 0 ? `${warningCount} care ${warningCount === 1 ? 'warning' : 'warnings'}` : 'Care tips'}
        </span>
        <span className="section-label__count">{warnings.length}</span>
        <Icon name="chevron" size={16} className="care-tips__chevron" />
      </button>
      {isOpen && (
        <ul className="care-tips__list">
          {warnings.map((warning) => (
            <li key={warning.id} className={`care-tips__item care-tips__item--${warning.tone}`}>
              {warning.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
