import { useLayoutEffect, useRef } from 'react'
import TerrariumOptions from '../terrarium/TerrariumOptions.jsx'
import GroundOptions from '../ground/GroundOptions.jsx'
import PlantOptions from '../plants/PlantOptions.jsx'
import DecorationOptions from '../decoration/DecorationOptions.jsx'
import AnimalOptions from '../animals/AnimalOptions.jsx'
import EquipmentOptions from '../equipment/EquipmentOptions.jsx'
import CareTips from './CareTips.jsx'
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
// by itself (the page does); there the panel title is brought into view if the page was
// scrolled past it.
function useScrollPerView(viewKey, contentRef, panelRef) {
  const positions = useRef({})
  const currentKey = useRef(viewKey)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    currentKey.current = viewKey
    const scrollsItself = getComputedStyle(content).overflowY === 'auto'
    if (scrollsItself) {
      // 'instant' also cancels a smooth scroll that may still be running from the previous
      // view (e.g. towards a just-added plant), so it cannot carry on into this one.
      content.scrollTo({ top: positions.current[viewKey] ?? 0, behavior: 'instant' })
    } else {
      const top = panelRef.current?.getBoundingClientRect().top ?? 0
      if (top < 0) window.scrollBy({ top: top - 12 })
    }
  }, [viewKey, contentRef, panelRef])

  // Remember where the user is, per view.
  return () => {
    positions.current[currentKey.current] = contentRef.current?.scrollTop ?? 0
  }
}

export default function OptionsPanel({ activeCategory, activeTab, onTabChange, onConfirm }) {
  const category = categories.find((item) => item.id === activeCategory)
  const subtitle = useCategorySubtitle(activeCategory)
  const CategoryOptions = optionComponents[activeCategory]
  const isPriceTab = activeTab === 'price'
  const panelRef = useRef(null)
  const contentRef = useRef(null)
  const rememberScroll = useScrollPerView(`${activeCategory}:${activeTab}`, contentRef, panelRef)

  return (
    <aside ref={panelRef} className="panel" aria-label="Configuration options">
      <div className="panel__header">
        <div className="panel__heading">
          <h2 className="panel__title">{isPriceTab ? 'Price overview' : category.label}</h2>
          <p className="panel__subtitle">{isPriceTab ? 'All selected items' : subtitle}</p>
        </div>
        {isPriceTab && (
          <button type="button" className="text-button panel__back" onClick={() => onTabChange('options')}>
            Back to {category.label.toLowerCase()}
          </button>
        )}
      </div>

      <div ref={contentRef} className="panel__content" id="panel-content" aria-live="polite" onScroll={rememberScroll}>
        {isPriceTab ? (
          <PriceBreakdown />
        ) : (
          <>
            {CARE_TIP_CATEGORIES.has(activeCategory) && <CareTips />}
            <CategoryOptions />
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
