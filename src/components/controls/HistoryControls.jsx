import Icon from '../common/Icon.jsx'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// Undo / redo buttons (top left of the 3D view, as in Layout.jpg).
// Keyboard: Ctrl/Cmd + Z to undo, Ctrl/Cmd + Shift + Z or Ctrl + Y to redo.
export default function HistoryControls() {
  const { canUndo, canRedo, undo, redo } = useConfigurator()

  return (
    <div className="history-controls" role="group" aria-label="History">
      <button type="button" className="history-controls__button" data-anim="swing-left" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
        <Icon name="undo" size={18} />
      </button>
      <button type="button" className="history-controls__button" data-anim="swing-right" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
        <Icon name="redo" size={18} />
      </button>
    </div>
  )
}
