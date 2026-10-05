import { useState } from 'react'
import OptionCard from '../common/OptionCard.jsx'
import Alert from '../common/Alert.jsx'
import ConfirmBox from '../common/ConfirmBox.jsx'
import { groundTypes } from '../../data/ground.js'
import { canChooseGround } from '../../rules/configurationRules.js'
import { getPlantsForGround } from '../../rules/plantRules.js'
import { getObjectsRemovedByGroundChange } from '../../rules/objectRules.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

const describeRemoved = (removed) =>
  removed.map(({ item, quantity }) => (quantity > 1 ? `${item.name} × ${quantity}` : item.name)).join(', ')

export default function GroundOptions() {
  const { configuration, selectGround } = useConfigurator()
  const [pendingGroundId, setPendingGroundId] = useState(null)
  const isLocked = !canChooseGround(configuration)

  const handleSelect = (groundId) => {
    if (groundId === configuration.ground) return
    if (getObjectsRemovedByGroundChange(configuration, groundId).length > 0) {
      setPendingGroundId(groundId)
      return
    }
    setPendingGroundId(null)
    selectGround(groundId)
  }

  return (
    <section className="option-section" aria-label="Ground layers">
      {isLocked && <Alert tone="warning">Choose a terrarium before adding a ground layer.</Alert>}
      <ul className="option-list">
        {groundTypes.map((ground) => {
          const suitablePlants = getPlantsForGround(ground.id)
          const removed = pendingGroundId === ground.id ? getObjectsRemovedByGroundChange(configuration, ground.id) : []
          const removedCount = removed.reduce((sum, entry) => sum + entry.quantity, 0)
          return (
            <li key={ground.id} className="option-list__item">
              <OptionCard
                title={ground.name}
                description={ground.description}
                meta={`${suitablePlants.length} ${suitablePlants.length === 1 ? 'plant grows' : 'plants grow'} here`}
                price={ground.price}
                swatch={ground.swatch}
                icon="ground"
                selected={configuration.ground === ground.id}
                disabled={isLocked}
                onSelect={() => handleSelect(ground.id)}
              />
              {removed.length > 0 && (
                <ConfirmBox
                  title={`Switch to ${ground.name}?`}
                  confirmLabel="Switch and remove"
                  cancelLabel="Keep current ground"
                  onCancel={() => setPendingGroundId(null)}
                  onConfirm={() => {
                    selectGround(ground.id)
                    setPendingGroundId(null)
                  }}
                >
                  {removedCount === 1 ? 'This item does' : `These ${removedCount} items do`} not suit{' '}
                  {ground.name.toLowerCase()} and will be removed: <strong>{describeRemoved(removed)}</strong>.
                </ConfirmBox>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
