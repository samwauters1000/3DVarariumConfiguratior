import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { initialConfiguration } from '../state/configuration.js'
import { findInstance, historyReducer } from '../state/configurationReducer.js'
import { loadAutosave, saveAutosave } from '../utils/configurationStorage.js'
import { createInstanceId } from '../utils/ids.js'
import { chooseFillSet } from '../rules/autoFill.js'
import { takeSharedConfiguration } from '../utils/shareLink.js'

export { initialConfiguration }

// Starts from the autosaved design (if any), so a page refresh does not lose work.
// A shared link (#design=...) wins over the autosave.
const createInitialHistory = () => ({ past: [], present: takeSharedConfiguration() ?? loadAutosave() ?? initialConfiguration, future: [] })

const ConfiguratorContext = createContext(null)

export function ConfiguratorProvider({ children }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, createInitialHistory)
  const configuration = history.present
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  // A share link opened in an already open tab only changes the hash: load it too.
  useEffect(() => {
    const handleHashChange = () => {
      const shared = takeSharedConfiguration()
      if (shared) dispatch({ type: 'load', configuration: shared })
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => saveAutosave(configuration), 300)
    return () => clearTimeout(timer)
  }, [configuration])
  // Selection is UI state, not part of the saved configuration: { categoryId, instanceId }.
  const [selectedObject, setSelectedObject] = useState(null)
  const selection =
    selectedObject && findInstance(configuration, selectedObject.categoryId, selectedObject.instanceId)
      ? selectedObject
      : null

  const value = useMemo(
    () => ({
      configuration,
      selection,
      canUndo,
      canRedo,
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      loadConfiguration: (saved) => {
        dispatch({ type: 'load', configuration: saved })
        setSelectedObject(null)
      },
      selectTerrarium: (terrariumId) => dispatch({ type: 'selectTerrarium', terrariumId }),
      selectGround: (groundId) => dispatch({ type: 'selectGround', groundId }),
      // Pass null to remove the lid or lamp.
      selectLid: (lidId) => dispatch({ type: 'selectLid', lidId }),
      toggleLight: (lightId) => dispatch({ type: 'toggleLight', lightId }),
      // `instanceId` can be passed when it was created earlier (e.g. at the start of a drag,
      // so the drop preview shows exactly the object that will be placed).
      addObject: (categoryId, itemId, position, instanceId = createInstanceId(itemId)) => {
        dispatch({ type: 'addObject', categoryId, itemId, instanceId, position })
        setSelectedObject({ categoryId, instanceId })
      },
      moveObject: (categoryId, instanceId, position) => dispatch({ type: 'moveObject', categoryId, instanceId, position }),
      // "Fill for me": a complete setup (plants, decoration, lights, optionally an animal).
      fillDesign: (options) => {
        const set = chooseFillSet(configuration, options)
        const withIds = (ids) => ids.map((itemId) => ({ itemId, instanceId: createInstanceId(itemId) }))
        dispatch({ type: 'fillDesign', decoration: withIds(set.decoration), plants: withIds(set.plants), animals: withIds(set.animals), lid: set.lid, lights: set.lights })
        setSelectedObject(null)
      },
      setObjectVariant: (categoryId, instanceId, variant) => dispatch({ type: 'setObjectVariant', categoryId, instanceId, variant }),
      rotateObject: (categoryId, instanceId, direction) => dispatch({ type: 'rotateObject', categoryId, instanceId, direction }),
      scaleObject: (categoryId, instanceId, direction) => dispatch({ type: 'scaleObject', categoryId, instanceId, direction }),
      removeObject: (categoryId, instanceId) => dispatch({ type: 'removeObject', categoryId, instanceId }),
      selectObject: (categoryId, instanceId) => setSelectedObject({ categoryId, instanceId }),
      clearSelection: () => setSelectedObject(null),
      resetConfiguration: () => {
        dispatch({ type: 'reset' })
        setSelectedObject(null)
      },
    }),
    [configuration, selection, canUndo, canRedo],
  )

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>
}

export function useConfigurator() {
  const context = useContext(ConfiguratorContext)
  if (!context) throw new Error('useConfigurator must be used inside ConfiguratorProvider')
  return context
}
