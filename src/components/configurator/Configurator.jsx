import { useCallback, useEffect, useState } from 'react'
import TopBar from '../layout/TopBar.jsx'
import Stage from '../layout/Stage.jsx'
import OptionsPanel from './OptionsPanel.jsx'
import DragGhost from '../objects/DragGhost.jsx'
import ConfigurationSummary from '../summary/ConfigurationSummary.jsx'
import SavedDesignsDialog from '../saved/SavedDesignsDialog.jsx'
import { createSummary } from '../../utils/summary.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'

const isTypingTarget = (element) =>
  element instanceof HTMLElement && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))

export default function Configurator() {
  const { configuration, selection, removeObject, clearSelection, undo, redo, moveObject, rotateObject, scaleObject } = useConfigurator()
  const { captureImage, pickingSpot, setPickingSpot } = useSceneApi()
  const [activeCategory, setActiveCategory] = useState('terrarium')
  const [activeTab, setActiveTab] = useState('options')
  const [summary, setSummary] = useState(null)
  const [isSavedDesignsOpen, setIsSavedDesignsOpen] = useState(false)
  const isDialogOpen = Boolean(summary) || isSavedDesignsOpen

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId)
    setActiveTab('options')
  }

  const handleConfirm = () => {
    clearSelection()
    setSummary(createSummary(configuration, captureImage()))
  }

  const closeSummary = useCallback(() => setSummary(null), [])
  const closeSavedDesigns = useCallback(() => setIsSavedDesignsOpen(false), [])

  // Keyboard shortcuts: undo / redo; for the selected object: arrows move it, Shift + arrows
  // rotate it, + / - resize it, Delete removes it and Escape cancels "Pick a new spot" or
  // deselects it.
  useEffect(() => {
    const handleKey = (event) => {
      if (isDialogOpen || isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      const withModifier = event.ctrlKey || event.metaKey

      if (withModifier && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (withModifier && key === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (event.key === 'Escape') {
        // First cancel "Pick a new spot", then deselect.
        if (pickingSpot) setPickingSpot(null)
        else clearSelection()
      }
      if (!selection) return
      const { categoryId, instanceId } = selection
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        removeObject(categoryId, instanceId)
        return
      }
      if (event.key === '+' || event.key === '=') return scaleObject(categoryId, instanceId, 1)
      if (event.key === '-' || event.key === '_') return scaleObject(categoryId, instanceId, -1)

      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      const direction = arrows[event.key]
      if (!direction) return
      event.preventDefault()
      if (event.shiftKey) {
        if (direction[0] !== 0) rotateObject(categoryId, instanceId, -direction[0])
        return
      }
      const instance = configuration[categoryId].find((item) => item.instanceId === instanceId)
      if (!instance) return
      // Moves in steps across the planting area; refused steps (collision, edge) do nothing.
      const step = event.altKey ? 0.02 : 0.06
      moveObject(categoryId, instanceId, { x: instance.position.x + direction[0] * step, z: instance.position.z + direction[1] * step })
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isDialogOpen, selection, configuration, removeObject, clearSelection, undo, redo, moveObject, rotateObject, scaleObject, pickingSpot, setPickingSpot])

  return (
    <div className="app">
      <TopBar onOpenSavedDesigns={() => setIsSavedDesignsOpen(true)} />
      <main className="workspace">
        <Stage />
        <OptionsPanel
          activeCategory={activeCategory}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onConfirm={handleConfirm}
          onSelectCategory={handleCategorySelect}
        />
      </main>
      <DragGhost />
      {summary && <ConfigurationSummary summary={summary} onClose={closeSummary} />}
      {isSavedDesignsOpen && <SavedDesignsDialog onClose={closeSavedDesigns} />}
    </div>
  )
}
