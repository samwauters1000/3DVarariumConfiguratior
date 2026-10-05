import { useMemo } from 'react'
import Icon from '../common/Icon.jsx'
import { categories } from '../../data/categories.js'
import { getCareWarnings } from '../../rules/careWarnings.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// The section buttons (Terrarium … Animals), at the top of the options card, between the
// section title and the options. They sit on their own sunken band, so they read as
// navigation and not as one of the options below.
//
// A section with a care warning (e.g. "the frog needs a hiding place" on Decoration) gets a
// small orange dot (review finding R9). Hovering shows the warning; tapping opens the section,
// where the warning is listed in the care box.
export default function SectionNav({ activeCategory, onSelect }) {
  const { configuration } = useConfigurator()
  const warningsBySection = useMemo(() => {
    const grouped = {}
    getCareWarnings(configuration)
      .filter((warning) => warning.tone === 'warning' && warning.section)
      .forEach((warning) => {
        grouped[warning.section] = [...(grouped[warning.section] ?? []), warning.text]
      })
    return grouped
  }, [configuration])

  return (
    <nav className="section-nav" aria-label="Configuration sections">
      <ul className="section-nav__list">
        {categories.map((category) => {
          const isActive = category.id === activeCategory
          const warnings = warningsBySection[category.id] ?? []
          return (
            <li key={category.id}>
              <button
                type="button"
                className={`section-nav__button${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect(category.id)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={warnings.length > 0 ? `${category.label}, ${warnings.length} care ${warnings.length === 1 ? 'warning' : 'warnings'}` : undefined}
                title={warnings.length > 0 ? warnings.join('\n') : category.label}
              >
                <span className="section-nav__icon">
                  <Icon name={category.icon} size={20} />
                  {warnings.length > 0 && <span className="section-nav__warning" aria-hidden="true" />}
                </span>
                <span className="section-nav__label">{category.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
