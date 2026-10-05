import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'

// Short tips shown on the first visit, over the 3D view. Closing them is remembered in this
// browser. The wording follows the device (mouse or touch).
const STORAGE_KEY = 'vararium:hints-dismissed'

const readDismissed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function OnboardingHints() {
  const [dismissed, setDismissed] = useState(readDismissed)
  const hasMouse = useHasMousePointer()
  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Not remembered; the tips simply show again next time.
    }
  }

  const tips = hasMouse
    ? [
        ['rotateLeft', 'Drag to rotate, scroll to zoom'],
        ['plant', 'Click a plant, or drag it into the terrarium'],
        ['move', 'Select an item to move, rotate or resize it (arrow keys work too)'],
      ]
    : [
        ['rotateLeft', 'Drag with one finger to rotate, pinch to zoom'],
        ['plant', 'Press + or drag a plant into the terrarium'],
        ['move', 'Tap an item to move, rotate or resize it'],
      ]

  return (
    <div className="hints" role="note" aria-label="Tips">
      <ul className="hints__list">
        {tips.map(([icon, text]) => (
          <li key={text} className="hints__tip">
            <Icon name={icon} size={16} />
            {text}
          </li>
        ))}
      </ul>
      <button type="button" className="button button--primary hints__button" onClick={dismiss}>
        Got it
      </button>
    </div>
  )
}
