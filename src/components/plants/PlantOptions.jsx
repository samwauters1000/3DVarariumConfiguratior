import { useMemo, useState } from 'react'
import Icon from '../common/Icon.jsx'
import EmptyState from '../common/EmptyState.jsx'
import CollapsibleSection from '../common/CollapsibleSection.jsx'
import CatalogueList from '../objects/CatalogueList.jsx'
import PlacedObjectList from '../objects/PlacedObjectList.jsx'
import { getPlantGroup, isClimber, isRarePlant, PLANT_GROUPS, plants } from '../../data/plants.js'
import { findGround } from '../../data/catalogue.js'
import { getItemAvailability } from '../../rules/objectRules.js'
import { isGroundCompatible } from '../../rules/plantRules.js'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { chooseFillSet, hasContents, isFillSetEmpty } from '../../rules/autoFill.js'

const CATEGORY = 'plants'

const GROUP_NOTES = {
  small: 'Ground covers, creepers and small climbers.',
  medium: 'Bushy and rosette plants of medium height.',
  large: 'Tall statement plants. They need a tall container.',
  special: 'Rare collector plants. Limited to three of each per terrarium.',
}

const plantBadges = (item) => (
  <>
    {isRarePlant(item) && (
      <span className="rare-badge">
        <Icon name="sparkle" size={12} />
        Rare
      </span>
    )}
    {isClimber(item) && <span className="habit-badge">Climber</span>}
  </>
)
const rareVariant = (item) => (isRarePlant(item) ? 'rare' : undefined)

// Plant catalogue as sections stacked under each other: Small, Medium, Large, Special,
// then plants that do not suit the chosen ground. Each section header folds it open/closed.
export default function PlantOptions() {
  const { configuration, fillDesign } = useConfigurator()
  const ground = findGround(configuration.ground)
  const [includeAnimal, setIncludeAnimal] = useState(true)
  const canFill = useMemo(
    () => Boolean(ground) && !isFillSetEmpty(chooseFillSet(configuration, { includeAnimal })),
    [configuration, ground, includeAnimal],
  )
  const hasMousePointer = useHasMousePointer()

  const entries = plants.map((item) => ({ item, availability: getItemAvailability(CATEGORY, item, configuration) }))
  const isSuitable = (entry) => !ground || isGroundCompatible(entry.item, ground.id)
  const listProps = { categoryId: CATEGORY, icon: 'plant', getBadge: plantBadges, getVariant: rareVariant }

  return (
    <>
      <div className="fill-banner">
        <div className="fill-banner__body">
          <p className="fill-banner__title">Not sure where to start?</p>
          <p className="fill-banner__text">
            A complete setup: plants, decoration and lights{includeAnimal ? ', plus an animal if one fits' : ''}.
            {hasContents(configuration) && ' Replaces what is in your terrarium now (undo brings it back).'}
          </p>
          {!canFill && (
            <p className="fill-banner__reason" role="status">
              {ground
                ? `Nothing in the catalogue fits this container with . Try another ground or container.`
                : 'Choose a ground first: it decides which plants can grow.'}
            </p>
          )}
          <label className="fill-banner__option">
            <input type="checkbox" checked={includeAnimal} onChange={(event) => setIncludeAnimal(event.target.checked)} />
            Include an animal
          </label>
        </div>
        <button
          type="button"
          className="button button--primary fill-banner__button"
          data-anim="twinkle"
          onClick={() => fillDesign({ includeAnimal })}
          disabled={!canFill}
          title={canFill ? 'Add a complete, matching setup' : undefined}
        >
          <Icon name="sparkle" size={16} />
          Fill for me
        </button>
      </div>

      <p className="section-note">
        {ground ? `Showing plants for ${ground.name.toLowerCase()}. ` : ''}
        {hasMousePointer ? 'Click a plant to place it, or drag it into the terrarium.' : 'Press + or drag a plant into the terrarium.'}
      </p>

      <div className="collapsible-stack">
        {PLANT_GROUPS.map((group) => {
          const inGroup = entries.filter((entry) => getPlantGroup(entry.item) === group.id)
          const groupEntries = inGroup.filter(isSuitable)
          const unsuitable = inGroup.filter((entry) => !isSuitable(entry))
          const isSpecial = group.id === 'special'
          return (
            <CollapsibleSection
              key={group.id}
              title={isSpecial ? 'Special' : group.label}
              count={groupEntries.length}
              icon={isSpecial ? 'sparkle' : undefined}
              variant={isSpecial ? 'rare' : undefined}
              note={GROUP_NOTES[group.id]}
            >
              {groupEntries.length > 0 ? (
                <CatalogueList entries={groupEntries} {...listProps} />
              ) : (
                <EmptyState icon="plant" title={`No ${group.label.toLowerCase()} plants grow in ${ground?.name.toLowerCase()}`}>
                  Try another ground type.
                </EmptyState>
              )}
              {/* Plants of this size that need another ground: folded into one compact row. */}
              {unsuitable.length > 0 && (
                <CollapsibleSection
                  title={`Not suitable for ${ground.name.toLowerCase()}`}
                  count={unsuitable.length}
                  variant="nested"
                  defaultOpen={false}
                  note="These plants need a different ground."
                >
                  <CatalogueList entries={unsuitable} {...listProps} />
                </CollapsibleSection>
              )}
            </CollapsibleSection>
          )
        })}
      </div>

      <PlacedObjectList categoryId={CATEGORY} icon="plant" />
    </>
  )
}
