import { createContext, useContext, useMemo, useRef, useState } from 'react'

// Lets regular UI talk to the 3D scene: the camera controls (bottom toolbar), a snapshot
// function (summary preview, PDF and "Save picture"), the day / night lighting and
// "Pick a new spot" for moving the selected object.
const SceneApiContext = createContext(null)

export function SceneApiProvider({ children }) {
  const controlsRef = useRef(null)
  const captureRef = useRef(null)
  const [nightMode, setNightMode] = useState(false)
  // "Pick a new spot": the object ({ categoryId, instanceId }) that moves to the next spot
  // clicked on the soil, or null.
  const [pickingSpot, setPickingSpot] = useState(null)
  const value = useMemo(
    () => ({
      controlsRef,
      captureRef,
      nightMode,
      setNightMode,
      pickingSpot,
      setPickingSpot,
      // options.keepView: capture the current camera view instead of the default framing.
      captureImage: (options) => {
        try {
          return captureRef.current?.(options) ?? null
        } catch (error) {
          console.error('Could not capture the 3D preview:', error)
          return null
        }
      },
    }),
    [nightMode, pickingSpot],
  )
  return <SceneApiContext.Provider value={value}>{children}</SceneApiContext.Provider>
}

export function useSceneApi() {
  const context = useContext(SceneApiContext)
  if (!context) throw new Error('useSceneApi must be used inside SceneApiProvider')
  return context
}
