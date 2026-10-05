import { lazy, Suspense } from 'react'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'
import { useModelErrors } from '../../hooks/useModelErrors.js'
import Icon from '../common/Icon.jsx'
import CameraToolbar from '../controls/CameraToolbar.jsx'
import HistoryControls from '../controls/HistoryControls.jsx'
import ViewControls from '../controls/ViewControls.jsx'
import OnboardingHints from './OnboardingHints.jsx'
import SceneErrorBoundary from '../../scene/SceneErrorBoundary.jsx'
import { getView, resetCamera, rotateCamera, zoomCamera } from '../../scene/cameraSettings.js'
import { findTerrarium } from '../../data/catalogue.js'
import { findItem } from '../../data/objectCategories.js'
import { useHasMousePointer } from '../../hooks/useMediaQuery.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// three.js is large, so the scene is loaded separately from the rest of the UI.
const TerrariumScene = lazy(() => import('../../scene/TerrariumScene.jsx'))

export default function Stage() {
  const { configuration } = useConfigurator()
  const { controlsRef, nightMode, pickingSpot, setPickingSpot } = useSceneApi()
  const hasMousePointer = useHasMousePointer()
  const modelErrors = useModelErrors()
  const terrarium = findTerrarium(configuration.terrarium)
  const pickedInstance = pickingSpot && configuration[pickingSpot.categoryId]?.find((instance) => instance.instanceId === pickingSpot.instanceId)
  const pickedItem = pickedInstance ? findItem(pickingSpot.categoryId, pickedInstance.id) : null

  return (
    <section className={`stage${nightMode ? ' is-night' : ''}`} aria-label="Terrarium preview">
      <SceneErrorBoundary>
        <Suspense
          fallback={
            <div className="stage__message">
              <p className="stage__message-text">Loading 3D preview…</p>
            </div>
          }
        >
          <TerrariumScene />
        </Suspense>
      </SceneErrorBoundary>

      <div className="stage__overlay stage__overlay--top">
        <HistoryControls />
        <span className="stage__badge">
          <Icon name="terrarium" size={16} />
          <span className="stage__badge-text">{terrarium ? terrarium.name : 'No terrarium selected'}</span>
        </span>
        <ViewControls hasTerrarium={Boolean(terrarium)} />
      </div>

      {modelErrors.length > 0 && (
        <p className="stage__notice" role="status">
          Some 3D models could not be loaded. Simplified versions are shown.
        </p>
      )}

      {!terrarium && (
        <div className="stage__hint">
          <p>Choose a terrarium to begin.</p>
        </div>
      )}

      {terrarium && <OnboardingHints />}

      {pickedItem && (
        <p className={`stage__picking${pickingSpot.blocked ? ' is-blocked' : ''}`} role="status">
          <Icon name="move" size={16} />
          {pickingSpot.blocked
            ? 'Not there: too close to the glass or another object. Try a green spot'
            : `${hasMousePointer ? 'Click' : 'Tap'} a spot on the soil to move the ${pickedItem.name}`}
          <button type="button" className="text-button stage__picking-cancel" onClick={() => setPickingSpot(null)}>
            Cancel
          </button>
        </p>
      )}

      <div className="stage__overlay stage__overlay--bottom">
        <CameraToolbar
          onRotateLeft={() => rotateCamera(controlsRef.current, 1)}
          onRotateRight={() => rotateCamera(controlsRef.current, -1)}
          onZoomIn={() => zoomCamera(controlsRef.current, 1)}
          onZoomOut={() => zoomCamera(controlsRef.current, -1)}
          onReset={() => resetCamera(controlsRef.current, getView(terrarium))}
        />
      </div>
    </section>
  )
}
