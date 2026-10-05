import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import { findTerrarium } from '../../data/catalogue.js'
import { getFootprint, getObstacles, validatePlacement } from '../../rules/placementRules.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'

// Step for the arrow pad, in planting-area units (same as the keyboard arrows).
const STEP = 0.06

// Arrow pad directions relative to the screen: "up" moves away from the viewer.
const DIRECTIONS = [
  { id: 'up', icon: 'chevron', label: 'Move back', screen: [0, 1] },
  { id: 'left', icon: 'chevron', label: 'Move left', screen: [-1, 0] },
  { id: 'right', icon: 'chevron', label: 'Move right', screen: [1, 0] },
  { id: 'down', icon: 'chevron', label: 'Move forward', screen: [0, -1] },
]

// "Move" for the selected object: pick a new spot in the 3D view, or nudge it with the
// arrow pad. Makes moving discoverable; dragging in the 3D view keeps working too.
export default function MoveControls({ categoryId, instance, item }) {
  const { configuration, moveObject } = useConfigurator()
  const { controlsRef, pickingSpot, setPickingSpot } = useSceneApi()
  const hasMousePointer = useHasMousePointer()
  const [blocked, setBlocked] = useState(false)
  const isPicking = pickingSpot?.instanceId === instance.instanceId

  const nudge = (screen) => {
    // Turn the screen direction into a direction on the soil, using the camera's angle.
    const azimuth = controlsRef.current?.azimuthAngle ?? 0
    const forward = [-Math.sin(azimuth), -Math.cos(azimuth)] // away from the viewer
    const right = [Math.cos(azimuth), -Math.sin(azimuth)]
    const dx = right[0] * screen[0] + forward[0] * screen[1]
    const dz = right[1] * screen[0] + forward[1] * screen[1]
    const position = { x: instance.position.x + dx * STEP, y: 0, z: instance.position.z + dz * STEP }
    const terrarium = findTerrarium(configuration.terrarium)
    const valid = validatePlacement({
      terrarium,
      position,
      radius: getFootprint(item, instance.scale.x, terrarium, instance.instanceId),
      obstacles: getObstacles(configuration, terrarium, instance.instanceId),
    }).valid
    setBlocked(!valid)
    if (valid) moveObject(categoryId, instance.instanceId, position)
  }

  return (
    <div className="move-controls" role="group" aria-label={`Move ${item.name}`}>
      <div className="move-controls__main">
        <span className="move-controls__label">Move</span>
        <button
          type="button"
          className={`button button--small move-controls__pick${isPicking ? ' is-active' : ''}`}
          data-anim="pop"
          onClick={() => setPickingSpot(isPicking ? null : { categoryId, instanceId: instance.instanceId })}
          aria-pressed={isPicking}
        >
          <Icon name={isPicking ? 'close' : 'move'} size={16} />
          {isPicking ? 'Cancel' : 'Pick a new spot'}
        </button>
        <div className="move-controls__pad">
          {DIRECTIONS.map((direction) => (
            <button
              key={direction.id}
              type="button"
              className={`move-controls__arrow move-controls__arrow--${direction.id}`}
              data-anim={`nudge-${direction.id}`}
              onClick={() => nudge(direction.screen)}
              aria-label={`${direction.label} ${item.name}`}
              title={direction.label}
            >
              <Icon name={direction.icon} size={16} className={`move-controls__icon--${direction.id}`} />
            </button>
          ))}
        </div>
      </div>
      <p className={`move-controls__hint${blocked ? ' is-blocked' : ''}`} role="status">
        {isPicking
          ? `${hasMousePointer ? 'Click' : 'Tap'} a spot on the soil to move the ${item.name}. Esc cancels.`
          : blocked
            ? 'It cannot go further that way: something is in the way or it would touch the glass.'
            : `Or ${hasMousePointer ? 'drag' : 'press and drag'} it in the 3D view${hasMousePointer ? ', or use the arrow keys' : ''}.`}
      </p>
    </div>
  )
}
