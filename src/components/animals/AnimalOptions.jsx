import CollapsibleSection from '../common/CollapsibleSection.jsx'
import CatalogueList from '../objects/CatalogueList.jsx'
import PlacedObjectList from '../objects/PlacedObjectList.jsx'
import { animals } from '../../data/animals.js'
import { findGround } from '../../data/catalogue.js'
import { getItemAvailability } from '../../rules/objectRules.js'
import { isGroundCompatible } from '../../rules/plantRules.js'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

const CATEGORY = 'animals'

// Small label with the number of colour variants.
const colorBadge = (item) => item.colorVariants?.length > 1 && <span className="habit-badge">{item.colorVariants.length} colours</span>

// Animals catalogue. Animals that do not suit the chosen ground are folded into a compact
// row at the bottom, like the plants.
export default function AnimalOptions() {
  const { configuration } = useConfigurator()
  const hasMousePointer = useHasMousePointer()
  const ground = findGround(configuration.ground)
  const entries = animals.map((item) => ({ item, availability: getItemAvailability(CATEGORY, item, configuration) }))
  const suitable = entries.filter((entry) => !ground || isGroundCompatible(entry.item, ground.id))
  const unsuitable = entries.filter((entry) => ground && !isGroundCompatible(entry.item, ground.id))
  const listProps = { categoryId: CATEGORY, icon: 'animal', getBadge: colorBadge }

  return (
    <>
      <p className="section-note">
        {hasMousePointer ? 'Click an animal to place it, or drag it into the terrarium.' : 'Press + or drag an animal into the terrarium.'} Select a
        placed animal to change its colour.
      </p>

      <div className="collapsible-stack">
        <CollapsibleSection title={ground ? `Animals for ${ground.name.toLowerCase()}` : 'Animals'} count={suitable.length} note="Small, cute vivarium animals. Some come in several colours.">
          <CatalogueList entries={suitable} {...listProps} />
          {unsuitable.length > 0 && (
            <CollapsibleSection title={`Not suitable for ${ground.name.toLowerCase()}`} count={unsuitable.length} variant="nested" defaultOpen={false} note="These animals need a more humid ground.">
              <CatalogueList entries={unsuitable} {...listProps} />
            </CollapsibleSection>
          )}
        </CollapsibleSection>
      </div>

      <PlacedObjectList categoryId={CATEGORY} icon="animal" />
    </>
  )
}
