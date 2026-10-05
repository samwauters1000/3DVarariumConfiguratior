import Icon from '../common/Icon.jsx'
import { categories } from '../../data/categories.js'

export default function CategoryRail({ activeCategory, onSelect }) {
  return (
    <nav className="category-rail" aria-label="Configuration categories">
      <ul className="category-rail__list">
        {categories.map((category) => {
          const isActive = category.id === activeCategory
          return (
            <li key={category.id}>
              <button
                type="button"
                className={`category-button${isActive ? ' is-active' : ''}${category.active ? '' : ' is-upcoming'}`}
                onClick={() => onSelect(category.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="category-button__icon">
                  <Icon name={category.icon} size={22} />
                </span>
                <span className="category-button__label">
                  {category.label}
                  {!category.active && <span className="category-button__badge">Soon</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
