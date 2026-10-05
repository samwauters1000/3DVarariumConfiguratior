import Icon from '../common/Icon.jsx'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'
import { flashStage } from '../../utils/microAnimations.js'

// Downloads a PNG of what the 3D view shows right now (without the editing helpers).
function downloadPicture(captureImage) {
  const image = captureImage({ keepView: true })
  if (!image) return
  flashStage()
  const link = document.createElement('a')
  link.href = image.src
  link.download = `vararium-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Top right of the 3D view: day / night lighting and "Save picture".
export default function ViewControls({ hasTerrarium }) {
  const { nightMode, setNightMode, captureImage } = useSceneApi()

  return (
    <div className="history-controls stage__view-controls" role="group" aria-label="View">
      <button
        type="button"
        className={`history-controls__button${nightMode ? ' is-active' : ''}`}
        data-anim="turn-in"
        onClick={() => setNightMode(!nightMode)}
        aria-pressed={nightMode}
        aria-label={nightMode ? 'Switch to day mode' : 'Switch to night mode'}
        title={nightMode ? 'Day mode' : 'Night mode'}
      >
        <Icon name={nightMode ? 'sun' : 'moon'} size={18} />
      </button>
      <button
        type="button"
        className="history-controls__button"
        data-anim="shutter"
        onClick={() => downloadPicture(captureImage)}
        disabled={!hasTerrarium}
        aria-label="Save picture"
        title="Save picture (PNG)"
      >
        <Icon name="camera" size={18} />
      </button>
    </div>
  )
}
