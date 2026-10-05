import OptionCard from '../common/OptionCard.jsx'
import Alert from '../common/Alert.jsx'
import { getLightSizeLabel, lids, lights } from '../../data/equipment.js'
import { findTerrarium } from '../../data/catalogue.js'
import { getLightAvailability } from '../../rules/equipmentRules.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

const LIGHT_PURPOSE = {
  'light-led': 'Grow light',
  'light-led-60': 'Grow light',
  'light-puck': 'Day light',
  'light-cork': 'Bottle light',
  'light-uvb': 'For reptiles',
  'light-moon': 'Only on in night mode',
  'light-mushroom': 'Stands on the soil',
  'light-fairy': 'Fits any container',
}

// "Room for lights": the real space inside the chosen container.
function describeRoom(terrarium) {
  const space = terrarium.lightSpace ?? {}
  const parts = [space.bar ? `bars up to ${space.bar} cm` : 'no light bars', `round lights up to Ø ${space.puck} cm`]
  if (space.cork) parts.push('a cork light')
  return `Room inside the ${terrarium.name}: ${parts.join(', ')}.`
}

function LightList({ items, configuration, toggleLight }) {
  return (
    <ul className="option-list">
      {items.map((light) => {
        const isOn = configuration.lights.includes(light.id)
        const { canAdd, reason } = getLightAvailability(light, configuration)
        return (
          <li key={light.id} className="option-list__item">
            <OptionCard
              title={light.name}
              description={light.description}
              meta={!isOn && !canAdd ? reason : `${getLightSizeLabel(light)} · ${LIGHT_PURPOSE[light.id]}`}
              price={light.price}
              swatch={light.swatch}
              icon="lamp"
              selected={isOn}
              disabled={!isOn && !canAdd}
              onSelect={() => toggleLight(light.id)}
            />
          </li>
        )
      })}
    </ul>
  )
}

// "Lights": one day light, any number of extra lights, and the lid for open containers.
// Every light has a fixed real size and only fits when the container has room for it.
// Clicking a selected card again removes it.
export default function EquipmentOptions() {
  const { configuration, selectLid, toggleLight } = useConfigurator()
  const terrarium = findTerrarium(configuration.terrarium)
  const canHaveLid = Boolean(terrarium?.lidable)

  return (
    <>
      {!terrarium && <Alert tone="warning">Choose a terrarium before adding lights.</Alert>}
      {terrarium && <p className="section-note light-room">{describeRoom(terrarium)}</p>}

      <section className="option-section" aria-labelledby="light-options-title">
        <h3 id="light-options-title" className="section-label">Day light</h3>
        <p className="section-note">Mounted inside the glass. One day light per terrarium.</p>
        <LightList items={lights.filter((light) => light.kind === 'main')} configuration={configuration} toggleLight={toggleLight} />
      </section>

      <section className="option-section" aria-labelledby="special-light-options-title">
        <h3 id="special-light-options-title" className="section-label">Extra lights</h3>
        <p className="section-note">UVB for reptiles, a moonlight for watching animals after dark, and mood lights. Combine them with the day light; switch on night mode to see them glow.</p>
        <LightList items={lights.filter((light) => light.kind === 'special')} configuration={configuration} toggleLight={toggleLight} />
      </section>

      <section className="option-section" aria-labelledby="lid-options-title">
        <h3 id="lid-options-title" className="section-label">Lid</h3>
        {terrarium && !canHaveLid && <p className="section-note">The {terrarium.name} is closed and already has its own top.</p>}
        <ul className="option-list">
          {lids.map((lid) => (
            <li key={lid.id} className="option-list__item">
              <OptionCard
                title={lid.name}
                description={lid.description}
                meta={lid.ventilated ? 'Ventilated' : 'Holds humidity'}
                price={lid.price}
                swatch={lid.swatch}
                icon="lid"
                selected={configuration.lid === lid.id}
                disabled={!canHaveLid}
                onSelect={() => selectLid(configuration.lid === lid.id ? null : lid.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
