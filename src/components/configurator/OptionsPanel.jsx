import { useLayoutEffect, useRef } from 'react'
import TerrariumOptions from '../terrarium/TerrariumOptions.jsx'
import GroundOptions from '../ground/GroundOptions.jsx'
import PlantOptions from '../plants/PlantOptions.jsx'
import DecorationOptions from '../decoration/DecorationOptions.jsx'
import AnimalOptions from '../animals/AnimalOptions.jsx'
import EquipmentOptions from '../equipment/EquipmentOptions.jsx'
import CareTips from './CareTips.jsx'
import SectionNav from '../layout/SectionNav.jsx'
import Icon from '../common/Icon.jsx'
import { getMissingStep, getNextStepHint, isRequiredSection, isSectionDone } from '../../rules/flowRules.js'
import { findLid, getLights } from '../../data/equipment.js'
import PriceBreakdown from '../pricing/PriceBreakdown.jsx'
import PanelFooter from '../pricing/PanelFooter.jsx'
import { categories } from '../../data/categories.js'
import { findGround, findTerrarium } from '../../data/catalogue.js'
import { placeableCategories } from '../../data/objectCategories.js'
import { formatPrice } from '../../utils/pricing.js'
import { usePrice } from '../../hooks/usePrice.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

const optionComponents = {
  terrarium: TerrariumOptions,
  ground: GroundOptions,
  plants: PlantOptions,
  decoration: DecorationOptions,
  animals: AnimalOptions,
  equipment: EquipmentOptions,
}

// Categories that show the whole-terrarium care tips above their options.
const CARE_TIP_CATEGORIES = new Set(['plants', 'decoration', 'animals', 'equipment'])

function useCategorySubtitle(categoryId) {
  const { configuration } = useConfigurator()
  const { sections } = usePrice()

  if (categoryId === 'terrarium') {
    const terrarium = findTerrarium(configuration.terrarium)
    return terrarium ? `${terrarium.name} · ${formatPrice(terrarium.price)}` : 'Nothing selected'
  }
  if (categoryId === 'ground') {
    const ground = findGround(configuration.ground)
    return ground ? `${ground.name} · ${formatPrice(ground.price)}` : 'Nothing selected'
  }
  if (categoryId === 'equipment') {
    const chosen = [findLid(configuration.lid), ...getLights(configuration.lights)].filter(Boolean)
    const total = formatPrice(chosen.reduce((sum, item) => sum + item.price, 0))
    if (chosen.length === 0) return 'Nothing selected'
    return chosen.length <= 2 ? `${chosen.map((item) => item.name).join(' + ')} · ${total}` : `${chosen.length} items · ${total}`
  }
  const category = placeableCategories[categoryId]
  if (category && category.items.length > 0) {
    const lines = sections.find((section) => section.id === categoryId)?.lines ?? []
    const count = configuration[categoryId].length
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0)
    return count > 0
      ? `${count} ${count === 1 ? category.singular : category.plural} · ${formatPrice(subtotal)}`
      : `No ${category.plural} added`
  }
  return 'Coming soon'
}

// Scroll position per view (category or price overview): a view opens at the top the first
// time, and where the user left it when they come back. On phones the panel does not scroll
// by itself (the page does); there the options card is scrolled to the top of the screen.
function useScrollPerView(viewKey, contentRef, panelRef) {
  const positions = useRef({})
  const currentKey = useRef(viewKey)
  const isFirstView = useRef(true)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    currentKey.current = viewKey
    const scrollsItself = getComputedStyle(content).overflowY === 'auto'
    if (scrollsItself) {
      // 'instant' also cancels a smooth scroll that may still be running from the previous
      // view (e.g. towards a just-added plant), so it cannot carry on into this one.
      content.scrollTo({ top: positions.current[viewKey] ?? 0, behavior: 'instant' })
    } else if (!isFirstView.current) {
      // Phones and tablets (the page scrolls): after choosing another section, bring the
      // options card to the top of the screen, so the new section's heading and options are
      // in view instead of below the screen (review finding R5). Not on the first view, so
      // opening the app still shows the 3D view first.
      const top = panelRef.current?.getBoundingClientRect().top ?? 0
      if (Math.abs(top - 8) > 4) window.scrollBy({ top: top - 8, behavior: 'smooth' })
    }
    isFirstView.current = false
  }, [viewKey, contentRef, panelRef])

  // Remember where the user is, per view.
  return () => {
    positions.current[currentKey.current] = contentRef.current?.scrollTop ?? 0
  }
}

// The block under the section buttons: the section's heading, what it is for (a larger
// line) and, smaller, what is chosen and its price.
const SECTION_INTROS = {
  terrarium: { heading: 'Choose a container', description: 'The container decides how big your terrarium is and which plants and lights fit.' },
  ground: { heading: 'Choose a ground layer', description: 'The ground decides which plants can grow in your terrarium.' },
  plants: { heading: 'Choose your plants', description: 'Only plants that suit your ground and container can be added.' },
  decoration: { heading: 'Add decoration', description: 'Stones and wood make it look natural, and give climbers and animals something to use.' },
  equipment: { heading: 'Choose your lights', description: 'Lights help plants grow and make your terrarium glow at night.' },
  animals: { heading: 'Add animals', description: 'Small animals that suit your ground and plants. They move in last.' },
}

// How the next section is named in the "next step" line.
const NEXT_STEP_LABELS = {
  terrarium: 'choose a container',
  ground: 'choose a ground',
  plants: 'add plants',
  decoration: 'add decoration',
  equipment: 'choose lights',
  animals: 'add animals',
}

// Small link under the selection that moves people on (review finding R1). Text, not an
// extra button; hidden until a required choice is made. The last section points to Confirm.
function NextStep({ hint, onSelectCategory }) {
  if (!hint) return null
  if (hint.kind === 'finish') {
    return (
      <p className="panel__next panel__next--finish">
        <Icon name="check" size={16} />
        Everything you need is in. Press Confirm below to review your terrarium.
      </p>
    )
  }
  const label = NEXT_STEP_LABELS[hint.categoryId]
  return (
    <button type="button" className="panel__next" onClick={() => onSelectCategory(hint.categoryId)}>
      {hint.kind === 'skip' ? 'Skip' : 'Next'}: {label}
      {hint.optional && <span className="panel__next-optional">(optional)</span>}
      <Icon name="chevron" size={16} className="panel__next-arrow" />
    </button>
  )
}

// Heading, what the section is for, whether it is required (R2), what is chosen, and the
// next step.
function SectionIntro({ categoryId, selection, configuration, onSelectCategory }) {
  const intro = SECTION_INTROS[categoryId]
  if (!intro) return null
  const required = isRequiredSection(categoryId)
  const done = isSectionDone(configuration, categoryId)
  const blocked = getMissingStep(configuration, categoryId) !== null
  return (
    <div className="panel__intro">
      <div className="panel__intro-heading">
        <h3 className="section-label">{intro.heading}</h3>
        <span className={`panel__requirement${required ? ' is-required' : ''}`}>{required ? 'Required' : 'Optional'}</span>
      </div>
      <p className="panel__intro-description">{intro.description}</p>
      <p className="panel__intro-selection">{!required && !done ? 'Nothing added yet · you can skip this' : selection}</p>
      {!blocked && <NextStep hint={getNextStepHint(configuration, categoryId)} onSelectCategory={onSelectCategory} />}
    </div>
  )
}

const STEP_NAMES = { terrarium: 'container', ground: 'ground' }
const MISSING_REASONS = {
  terrarium: 'Everything goes inside the container, so it decides what fits.',
  ground: 'Plants, decoration and animals stand on the ground, and it decides which plants can grow.',
}

// Instead of a wall of unavailable options (R3): one message and a way to the missing step.
function MissingStepNotice({ missing, onSelectCategory }) {
  return (
    <div className="missing-step" role="status">
      <span className="missing-step__icon" aria-hidden="true">
        <Icon name={missing === 'terrarium' ? 'terrarium' : 'ground'} size={22} />
      </span>
      <div className="missing-step__text">
        <p className="missing-step__title">First choose a {STEP_NAMES[missing]}</p>
        <p className="missing-step__reason">{MISSING_REASONS[missing]}</p>
      </div>
      <button type="button" className="button button--primary missing-step__button" data-anim="pop" onClick={() => onSelectCategory(missing)}>
        Choose a {STEP_NAMES[missing]}
      </button>
    </div>
  )
}

export default function OptionsPanel({ activeCategory, activeTab, onTabChange, onConfirm, onSelectCategory }) {
  const category = categories.find((item) => item.id === activeCategory)
  const subtitle = useCategorySubtitle(activeCategory)
  const CategoryOptions = optionComponents[activeCategory]
  const isPriceTab = activeTab === 'price'
  const { configuration } = useConfigurator()
  const missingStep = getMissingStep(configuration, activeCategory)
  const panelRef = useRef(null)
  const contentRef = useRef(null)
  const rememberScroll = useScrollPerView(`${activeCategory}:${activeTab}`, contentRef, panelRef)

  return (
    <aside ref={panelRef} className="panel" aria-label="Configuration options">
      {/* Section title, then the section buttons, then (in the content) the section's own
          heading, its description, what is chosen, and the options. */}
      <div className="panel__header">
        <div className="panel__header-row">
          <div className="panel__heading">
            <h2 className="panel__title">{isPriceTab ? 'Price overview' : category.label}</h2>
            {isPriceTab && <p className="panel__subtitle">All selected items</p>}
          </div>
          {isPriceTab && (
            <button type="button" className="text-button panel__back" onClick={() => onTabChange('options')}>
              Back to {category.label.toLowerCase()}
            </button>
          )}
        </div>
        <SectionNav activeCategory={isPriceTab ? null : activeCategory} onSelect={onSelectCategory} />
      </div>

      <div ref={contentRef} className="panel__content" id="panel-content" aria-live="polite" onScroll={rememberScroll}>
        {isPriceTab ? (
          <PriceBreakdown />
        ) : (
          <>
            <SectionIntro categoryId={activeCategory} selection={subtitle} configuration={configuration} onSelectCategory={onSelectCategory} />
            {missingStep ? (
              <MissingStepNotice missing={missingStep} onSelectCategory={onSelectCategory} />
            ) : (
              <>
                {CARE_TIP_CATEGORIES.has(activeCategory) && <CareTips />}
                <CategoryOptions />
              </>
            )}
          </>
        )}
      </div>

      <PanelFooter
        onConfirm={onConfirm}
        showsPrice={isPriceTab}
        onTogglePrice={() => onTabChange(isPriceTab ? 'options' : 'price')}
      />
    </aside>
  )
}
