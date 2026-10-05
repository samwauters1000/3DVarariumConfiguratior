import CollapsibleSection from '../common/CollapsibleSection.jsx'
import CatalogueList from '../objects/CatalogueList.jsx'
import PlacedObjectList from '../objects/PlacedObjectList.jsx'
import { DECORATION_SIZES, decorationItems } from '../../data/decoration.js'
import { findTerrarium } from '../../data/catalogue.js'
import { getItemAvailability, OBJECT_STATUS } from '../../rules/objectRules.js'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

const CATEGORY = 'decoration'

// Small label with the item type (Stone, Wood, Climbable, ...).
const typeBadge = (item) => item.type && <span className="habit-badge">{item.type}</span>

// Decoration catalogue in foldable Small / Medium / Large sections, like the plants.
// Items that are too big for the chosen container are folded into a compact row at the
// bottom of their section.
export default function DecorationOptions() {
  const { configuration } = useConfigurator()
  const hasMousePointer = useHasMousePointer()
  const terrarium = findTerrarium(configuration.terrarium)
  const entries = decorationItems.map((item) => ({ item, availability: getItemAvailability(CATEGORY, item, configuration) }))
  const isTooBig = (entry) => entry.availability.status === OBJECT_STATUS.unavailable && entry.availability.reason?.startsWith('Too big')
  const listProps = { categoryId: CATEGORY, icon: 'decoration', getBadge: typeBadge }

  return (
    <>
      <p className="section-note">
        {hasMousePointer ? 'Click an item to place it, or drag it into the terrarium.' : 'Press + or drag an item into the terrarium.'}{' '}
        Climbing plants grow up items marked Climbable.
      </p>

      <div className="collapsible-stack">
        {DECORATION_SIZES.map((size) => {
          const inSize = entries.filter((entry) => entry.item.size === size.id)
          const fitting = inSize.filter((entry) => !isTooBig(entry))
          const tooBig = inSize.filter(isTooBig)
          return (
            <CollapsibleSection key={size.id} title={size.label} count={fitting.length} note={size.note}>
              {fitting.length > 0 && <CatalogueList entries={fitting} {...listProps} />}
              {tooBig.length > 0 && (
                <CollapsibleSection title={`Too big for the ${terrarium?.name ?? 'container'}`} count={tooBig.length} variant="nested" defaultOpen={false}>
                  <CatalogueList entries={tooBig} {...listProps} />
                </CollapsibleSection>
              )}
            </CollapsibleSection>
          )
        })}
      </div>

      <PlacedObjectList categoryId={CATEGORY} icon="decoration" />
    </>
  )
}
