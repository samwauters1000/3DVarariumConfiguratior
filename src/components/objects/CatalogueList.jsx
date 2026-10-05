import { useState } from 'react'
import OptionCard from '../common/OptionCard.jsx'
import CareDetails from './CareDetails.jsx'
import SelectedObject from './SelectedObject.jsx'
import { getCare } from '../../data/care.js'
import Chip from '../common/Chip.jsx'
import Icon from '../common/Icon.jsx'
import { OBJECT_STATUS } from '../../rules/objectRules.js'
import { endedDragJustNow, startObjectDrag } from '../../hooks/useObjectDrag.js'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { useThumbnail } from '../../hooks/useThumbnail.js'

const statusChip = {
  [OBJECT_STATUS.available]: { tone: 'success', label: 'Available' },
  [OBJECT_STATUS.unavailable]: { tone: 'muted', label: 'Unavailable' },
  [OBJECT_STATUS.maxReached]: { tone: 'warning', label: 'Maximum reached' },
  [OBJECT_STATUS.terrariumFull]: { tone: 'warning', label: 'Terrarium full' },
  [OBJECT_STATUS.noRoom]: { tone: 'warning', label: 'No room' },
}

// Statuses where the reason is more useful than the "2 / 3" count.
const SHOW_REASON = new Set([OBJECT_STATUS.unavailable, OBJECT_STATUS.terrariumFull, OBJECT_STATUS.noRoom])

// One catalogue card. Its own component so it can load its 3D thumbnail.
function CatalogueItem({ categoryId, item, availability, icon, getBadge, getVariant, hasMousePointer }) {
  const { addObject, configuration, selection } = useConfigurator()
  // The selected object's panel (controls, colours, care) opens right under its own card.
  const isSelectedHere =
    selection?.categoryId === categoryId &&
    configuration[categoryId].some((instance) => instance.instanceId === selection.instanceId && instance.id === item.id)
  const thumbnail = useThumbnail(categoryId, item)
  const [showCare, setShowCare] = useState(false)
  const hasCare = Boolean(getCare(categoryId, item.id))
  const chip = statusChip[availability.status]
  const add = (position, instanceId) => addObject(categoryId, item.id, position, instanceId)
  const careId = `care-${item.id}`
  return (
    <>
    <OptionCard
      variant={getVariant?.(item)}
      badge={getBadge?.(item)}
      thumbnail={thumbnail}
      onCardClick={
        hasMousePointer && availability.canAdd
          ? () => {
              if (!endedDragJustNow()) add()
            }
          : undefined
      }
      title={item.name}
      description={item.description}
      price={item.price}
      swatch={item.swatch}
      icon={icon}
      disabled={availability.status === OBJECT_STATUS.unavailable}
      status={<Chip tone={chip.tone}>{chip.label}</Chip>}
      meta={SHOW_REASON.has(availability.status) ? availability.reason : `${availability.count} / ${item.maxQuantity}`}
      thumbProps={
        availability.canAdd
          ? {
              title: `Drag ${item.name} into the terrarium`,
              onPointerDown: (event) => startObjectDrag(event, categoryId, item.id, add),
            }
          : undefined
      }
      actions={
        <span className="option-card__buttons">
          {hasCare && (
            <button
              type="button"
              className={`icon-button icon-button--quiet${showCare ? ' is-active' : ''}`}
              data-anim="pop"
              onClick={() => setShowCare((open) => !open)}
              aria-expanded={showCare}
              aria-controls={careId}
              aria-label={`Care info for ${item.name}`}
              title="Care info"
            >
              <Icon name="info" size={18} />
            </button>
          )}
          <button
            type="button"
            className="icon-button icon-button--primary"
            data-anim="pop"
            onClick={() => add()}
            disabled={!availability.canAdd}
            aria-label={`Add ${item.name}`}
            title={availability.canAdd ? `Add ${item.name}` : availability.reason}
          >
            <Icon name="plus" size={18} />
          </button>
        </span>
      }
    />
    {showCare && !isSelectedHere && (
      <div id={careId} className="care-panel">
        <CareDetails categoryId={categoryId} itemId={item.id} />
      </div>
    )}
    {isSelectedHere && <SelectedObject categoryId={categoryId} />}
    </>
  )
}

// Catalogue cards for any placeable category. Each entry is { item, availability }.
// With a mouse the whole card adds the item; on touch devices only the + button does,
// so scrolling through the list never adds items by accident. The thumbnail can be
// dragged into the 3D view.
export default function CatalogueList({ categoryId, entries, icon, getBadge, getVariant }) {
  const hasMousePointer = useHasMousePointer()
  return (
    <ul className="option-list">
      {entries.map(({ item, availability }) => (
        <li key={item.id}>
          <CatalogueItem
            categoryId={categoryId}
            item={item}
            availability={availability}
            icon={icon}
            getBadge={getBadge}
            getVariant={getVariant}
            hasMousePointer={hasMousePointer}
          />
        </li>
      ))}
    </ul>
  )
}
