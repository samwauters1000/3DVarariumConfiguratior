import EmptyState from '../common/EmptyState.jsx'
import { formatPrice } from '../../utils/pricing.js'
import { usePrice } from '../../hooks/usePrice.js'

export default function PriceBreakdown() {
  const { sections, total } = usePrice()

  if (sections.length === 0) {
    return (
      <EmptyState icon="terrarium" title="Nothing selected yet">
        Choose a terrarium to start your configuration.
      </EmptyState>
    )
  }

  return (
    <div className="price-breakdown">
      {sections.map((section) => (
        <section key={section.id} className="price-breakdown__section" aria-label={section.label}>
          <h3 className="section-label section-label--caps">{section.label}</h3>
          <ul className="price-breakdown__lines">
            {section.lines.map((line) => (
              <li key={line.id} className="price-line">
                <span className="price-line__name">
                  {line.name}
                  {line.quantity > 1 && <span className="price-line__quantity">× {line.quantity}</span>}
                </span>
                <span className="price-line__amount">{formatPrice(line.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="price-line price-line--total">
        <span className="price-line__name">Total</span>
        <span className="price-line__amount">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
