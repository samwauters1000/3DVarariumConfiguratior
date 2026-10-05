import { useState } from 'react'
import OptionCard from '../common/OptionCard.jsx'
import ConfirmBox from '../common/ConfirmBox.jsx'
import Icon from '../common/Icon.jsx'
import { isSpecialTerrarium, terrariums } from '../../data/terrariums.js'
import { PLANT_SIZE_LABELS } from '../../data/plants.js'
import { getObjectsRemovedByTerrariumChange } from '../../rules/objectRules.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// "Fern × 2, Croton" from removal entries.
const describeRemoved = (entries) => {
  const counts = new Map()
  entries.forEach(({ item }) => counts.set(item.name, (counts.get(item.name) ?? 0) + 1))
  return [...counts].map(([name, quantity]) => (quantity > 1 ? `${name} × ${quantity}` : name)).join(', ')
}

const describeSizes = (terrarium, removed = []) => {
  if (!terrarium.plantSizes) return null
  const sizes = terrarium.plantSizes.map((size) => PLANT_SIZE_LABELS[size].toLowerCase()).join(' & ')
  return `${sizes} ${removed.every((entry) => entry.categoryId === 'plants') ? 'plants' : 'items'}`
}

function RemovalMessage({ terrarium, removed }) {
  const tooBig = removed.filter((entry) => entry.reason === 'size')
  const lightsOut = removed.filter((entry) => entry.reason === 'light')
  const overCapacity = removed.filter((entry) => entry.reason === 'capacity')
  return (
    <>
      {tooBig.length > 0 && (
        <>
          The {terrarium.name} only fits {describeSizes(terrarium, tooBig)}. Too big: <strong>{describeRemoved(tooBig)}</strong>.{' '}
        </>
      )}
      {lightsOut.length > 0 && (
        <>
          These lights do not fit inside it: <strong>{describeRemoved(lightsOut)}</strong>.{' '}
        </>
      )}
      {overCapacity.length > 0 && (
        <>
          It fits {terrarium.maxPlants} plants, so the most recently added will be removed:{' '}
          <strong>{describeRemoved(overCapacity)}</strong>.
        </>
      )}
    </>
  )
}

function TerrariumList({ items, pendingId, onSelect, onConfirm, onCancel }) {
  const { configuration } = useConfigurator()

  return (
    <ul className="option-list">
      {items.map((terrarium) => {
        const isSpecial = isSpecialTerrarium(terrarium)
        const removed = pendingId === terrarium.id ? getObjectsRemovedByTerrariumChange(configuration, terrarium.id) : []
        const meta = [
          terrarium.dimensions,
          terrarium.maxPlants && `Fits ${terrarium.maxPlants} plants`,
          terrarium.plantSizes && `${describeSizes(terrarium)} only`,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <li key={terrarium.id} className="option-list__item">
            <OptionCard
              variant={isSpecial ? 'rare' : undefined}
              badge={
                isSpecial && (
                  <span className="rare-badge">
                    <Icon name="sparkle" size={12} />
                    Special
                  </span>
                )
              }
              title={terrarium.name}
              description={terrarium.description}
              meta={meta}
              price={terrarium.price}
              icon="terrarium"
              selected={configuration.terrarium === terrarium.id}
              onSelect={() => onSelect(terrarium.id)}
            />
            {removed.length > 0 && (
              <ConfirmBox
                title={`Switch to the ${terrarium.name}?`}
                confirmLabel="Switch and remove"
                cancelLabel="Keep current terrarium"
                onCancel={onCancel}
                onConfirm={() => onConfirm(terrarium.id)}
              >
                <RemovalMessage terrarium={terrarium} removed={removed} />
              </ConfirmBox>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function TerrariumOptions() {
  const { configuration, selectTerrarium } = useConfigurator()
  const [pendingId, setPendingId] = useState(null)
  const regular = terrariums.filter((terrarium) => !isSpecialTerrarium(terrarium))
  const special = terrariums.filter(isSpecialTerrarium)

  const handleSelect = (terrariumId) => {
    if (terrariumId === configuration.terrarium) return
    if (getObjectsRemovedByTerrariumChange(configuration, terrariumId).length > 0) {
      setPendingId(terrariumId)
      return
    }
    setPendingId(null)
    selectTerrarium(terrariumId)
  }

  const listProps = {
    pendingId,
    onSelect: handleSelect,
    onCancel: () => setPendingId(null),
    onConfirm: (terrariumId) => {
      selectTerrarium(terrariumId)
      setPendingId(null)
    },
  }

  return (
    <>
      <section className="option-section" aria-label="Containers">
        <TerrariumList items={regular} {...listProps} />
      </section>

      <section className="option-section rare-section" aria-labelledby="terrarium-special-title">
        <h3 id="terrarium-special-title" className="section-label rare-section__label">
          <Icon name="sparkle" size={14} />
          Special shapes
          <span className="section-label__count">{special.length}</span>
        </h3>
        <p className="section-note">Unusual containers. Small ones fit fewer, smaller plants.</p>
        <TerrariumList items={special} {...listProps} />
      </section>
    </>
  )
}
