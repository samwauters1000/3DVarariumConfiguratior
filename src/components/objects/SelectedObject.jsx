import { useEffect, useRef } from 'react'
import ObjectControls from '../controls/ObjectControls.jsx'
import MoveControls from '../controls/MoveControls.jsx'
import { findItem, placeableCategories } from '../../data/objectCategories.js'
import { findTerrarium } from '../../data/catalogue.js'
import { getColorVariant } from '../../data/animals.js'
import ColorPicker from './ColorPicker.jsx'
import CareDetails from './CareDetails.jsx'
import { canScaleObject } from '../../rules/placementRules.js'
import { findClimbingSupport, isClimbingPlant } from '../../rules/climbingRules.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// Panel with rotate / scale / delete for the selected object of a category.
// The selection whose panel was last scrolled into view (see the effect below).
let lastRevealedSelection = null

// Renders nothing when the selection belongs to another category.
export default function SelectedObject({ categoryId }) {
  const { configuration, selection, rotateObject, scaleObject, removeObject, clearSelection, setObjectVariant } = useConfigurator()
  const sectionRef = useRef(null)
  const selectedId = selection?.categoryId === categoryId ? selection.instanceId : null

  // Bring the panel into view when another object is selected (it opens under that
  // object's catalogue card, which may be further down the list). Only for a new selection:
  // opening a category while something is still selected must not jump down the page.
  // Only when the panel scrolls on its own (desktop); on mobile the page would jump away
  // from the 3D view.
  useEffect(() => {
    if (!selectedId || selectedId === lastRevealedSelection) return
    lastRevealedSelection = selectedId
    const section = sectionRef.current
    const scroller = section?.closest('.panel__content')
    if (!scroller || getComputedStyle(scroller).overflowY !== 'auto') return
    section.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  if (!selectedId) return null

  const index = configuration[categoryId].findIndex((instance) => instance.instanceId === selection.instanceId)
  const instance = configuration[categoryId][index]
  const item = findItem(categoryId, instance.id)
  const category = placeableCategories[categoryId]
  const titleId = `selected-${categoryId}-title`
  const support = isClimbingPlant(item)
    ? findClimbingSupport(configuration, findTerrarium(configuration.terrarium), instance, item)
    : null

  return (
    <section ref={sectionRef} className="option-section selected-plant selected-plant--inline" aria-labelledby={titleId}>
      <div className="selected-plant__header">
        <h3 id={titleId} className="section-label">
          Selected {category.singular}
        </h3>
        <button type="button" className="text-button" onClick={clearSelection}>
          Done
        </button>
      </div>
      <div className="selected-plant__card">
        <div className="selected-plant__info">
          <span className="placed-item__swatch" style={{ '--swatch': item.swatch }} aria-hidden="true" />
          <span className="selected-plant__name">
            {item.name} <span className="placed-item__index">#{index + 1}</span>
          </span>
          <span className="selected-plant__meta">Size {Math.round(instance.scale.x * 100)}%</span>
        </div>
        <MoveControls categoryId={categoryId} instance={instance} item={item} />
        <ObjectControls
          item={item}
          canGrow={canScaleObject(configuration, categoryId, instance, 1)}
          canShrink={canScaleObject(configuration, categoryId, instance, -1)}
          onRotate={(direction) => rotateObject(categoryId, instance.instanceId, direction)}
          onScale={(direction) => scaleObject(categoryId, instance.instanceId, direction)}
          onRemove={() => removeObject(categoryId, instance.instanceId)}
        />
        {item.colorVariants && (
          <ColorPicker
            variants={item.colorVariants}
            selected={getColorVariant(item, instance.variant).id}
            onSelect={(variant) => setObjectVariant(categoryId, instance.instanceId, variant)}
          />
        )}
        {isClimbingPlant(item) && (
          <p className={`climb-status${support ? ' is-climbing' : ''}`}>
            {support
              ? `Climbing the ${support.name}.`
              : 'Place it next to a branch, cork tube or moss pole (Decoration) and it will climb it.'}
          </p>
        )}
        <CareDetails categoryId={categoryId} itemId={item.id} />
      </div>
    </section>
  )
}
