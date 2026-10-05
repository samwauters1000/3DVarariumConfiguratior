import { useState } from 'react'
import Alert from '../common/Alert.jsx'
import { formatPrice } from '../../utils/pricing.js'
import { getConfirmationIssues } from '../../rules/configurationRules.js'
import { usePrice } from '../../hooks/usePrice.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// "Choose a terrarium, choose a ground and add at least one plant to continue"
function describeIssues(issues) {
  const parts = issues.map((issue, index) => (index === 0 ? issue : issue[0].toLowerCase() + issue.slice(1)))
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  return `${list} to continue`
}

// Total, the price overview toggle and Confirm, at the bottom of the panel.
export default function PanelFooter({ onConfirm, showsPrice, onTogglePrice }) {
  const { configuration } = useConfigurator()
  const { total } = usePrice()
  const [showIssues, setShowIssues] = useState(false)
  const issues = getConfirmationIssues(configuration)

  const handleConfirm = () => {
    if (issues.length > 0) {
      setShowIssues(true)
      return
    }
    setShowIssues(false)
    onConfirm()
  }

  return (
    <footer className="panel-footer">
      {showIssues && issues.length > 0 && (
        <div id="confirm-issues">
          <Alert tone="warning">{describeIssues(issues)}.</Alert>
        </div>
      )}
      <div className="panel-footer__row">
        <div className="panel-footer__total">
          <span className="panel-footer__label">Total</span>
          <span className="panel-footer__amount" aria-live="polite">
            {formatPrice(total)}
          </span>
        </div>
        <div className="panel-footer__actions">
          <button
            type="button"
            className={`button button--small${showsPrice ? ' is-active' : ''}`}
            data-anim="pop"
            onClick={onTogglePrice}
            aria-pressed={showsPrice}
            aria-controls="panel-content"
          >
            Price
          </button>
          {/* Greyed out until there is a terrarium, a ground and a plant; then dark green.
              It stays clickable, so a click explains what is still missing. */}
          <button
            type="button"
            className={`button button--primary panel-footer__confirm ${issues.length === 0 ? 'is-ready' : 'is-waiting'}`}
            onClick={handleConfirm}
            aria-describedby={showIssues && issues.length > 0 ? 'confirm-issues' : undefined}
            title={issues.length > 0 ? describeIssues(issues) : 'Review and download your design'}
          >
            Confirm
          </button>
        </div>
      </div>
    </footer>
  )
}
