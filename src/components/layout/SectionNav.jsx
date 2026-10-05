import Icon from '../common/Icon.jsx'
import { categories } from '../../data/categories.js'

// The section buttons (Terrarium … Animals), at the top of the options card, between the
// section title and the options. They sit on their own sunken band, so they read as
// navigation and not as one of the options below.
export default function SectionNav({ activeCategory, onSelect }) {
  return (
    <nav className="section-nav" aria-label="Configuration sections">
      <ul className="section-nav__list">
        {categories.map((category) => {
          const isActive = category.id === activeCategory
          return (
            <li key={category.id}>
              <button
                type="button"
                className={`section-nav__button${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect(category.id)}
                aria-current={isActive ? 'step' : undefined}
                title={category.label}
              >
                <Icon name={category.icon} size={20} />
                <span className="section-nav__label">{category.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
