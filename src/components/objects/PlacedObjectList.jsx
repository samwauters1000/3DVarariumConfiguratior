import Icon from '../common/Icon.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { findItem, placeableCategories } from '../../data/objectCategories.js'
import { formatPrice } from '../../utils/pricing.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// "In your terrarium" list for a category: select an object or remove it.
export default function PlacedObjectList({ categoryId, icon }) {
  const { configuration, selection, selectObject, removeObject } = useConfigurator()
  const instances = configuration[categoryId]
  const category = placeableCategories[categoryId]
  const titleId = `placed-${categoryId}-title`

  return (
    <section className="option-section" aria-labelledby={titleId}>
      <h3 id={titleId} className="section-label">
        In your terrarium <span className="section-label__count">{instances.length}</span>
      </h3>
      {instances.length === 0 ? (
        <EmptyState icon={icon} title={`No ${category.plural} yet`}>
          Add {category.plural} from the catalogue above.
        </EmptyState>
      ) : (
        <ul className="placed-list">
          {instances.map((instance, index) => {
            const item = findItem(categoryId, instance.id)
            if (!item) return null
            const isSelected = selection?.instanceId === instance.instanceId
            return (
              <li key={instance.instanceId} className={`placed-item${isSelected ? ' is-selected' : ''}`}>
                <button
                  type="button"
                  className="placed-item__select"
                  onClick={() => selectObject(categoryId, instance.instanceId)}
                  aria-pressed={isSelected}
                >
                  <span className="placed-item__swatch" style={{ '--swatch': item.swatch }} aria-hidden="true" />
                  <span className="placed-item__name">
                    {item.name}
                    <span className="placed-item__index">#{index + 1}</span>
                  </span>
                  <span className="placed-item__price">{formatPrice(item.price)}</span>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeObject(categoryId, instance.instanceId)}
                  aria-label={`Remove ${item.name} #${index + 1}`}
                  title="Remove"
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
