import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls as DreiCameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import { CAMERA_SETTINGS, DEFAULT_VIEW, frameTerrarium } from './cameraSettings.js'

const { ACTION } = CameraControlsImpl

// Orbit-style camera: rotate and zoom only, no panning, within sensible limits.
// Re-frames automatically when a terrarium of a different size is chosen.
export default function CameraControls({ controlsRef, terrarium }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return undefined

    // The scene renders on demand, so keep requesting frames while the camera moves
    // (including transitions started by the bottom toolbar).
    const events = ['transitionstart', 'control', 'update', 'wake']
    events.forEach((type) => controls.addEventListener(type, invalidate))
    invalidate()
    return () => events.forEach((type) => controls.removeEventListener(type, invalidate))
  }, [controlsRef, invalidate])

  const terrariumId = terrarium?.id ?? null
  useEffect(() => {
    frameTerrarium(controlsRef.current, terrarium, terrariumId !== null)
    // Only re-frame when the terrarium itself changes (terrariumId), not on every render.
  }, [controlsRef, terrariumId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DreiCameraControls
      ref={controlsRef}
      makeDefault
      minDistance={DEFAULT_VIEW.minDistance}
      maxDistance={DEFAULT_VIEW.maxDistance}
      minPolarAngle={CAMERA_SETTINGS.minPolarAngle}
      maxPolarAngle={CAMERA_SETTINGS.maxPolarAngle}
      smoothTime={0.3}
      draggingSmoothTime={0.12}
      dollySpeed={0.6}
      mouseButtons={{ left: ACTION.ROTATE, middle: ACTION.DOLLY, right: ACTION.NONE, wheel: ACTION.DOLLY }}
      touches={{ one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE }}
    />
  )
}
