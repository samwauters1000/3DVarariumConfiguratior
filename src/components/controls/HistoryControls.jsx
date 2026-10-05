import Icon from '../common/Icon.jsx'
import { initialConfiguration, useConfigurator } from '../../hooks/useConfigurator.jsx'

// Undo / redo and Start over (top left of the 3D view, as in Layout.jpg). Start over sits
// with undo because it can be undone too.
// Keyboard: Ctrl/Cmd + Z to undo, Ctrl/Cmd + Shift + Z or Ctrl + Y to redo.
export default function HistoryControls() {
  const { configuration, canUndo, canRedo, undo, redo, resetConfiguration } = useConfigurator()
  const isEmpty = configuration === initialConfiguration

  return (
    <div className="history-controls" role="group" aria-label="History">
      <button type="button" className="history-controls__button" data-anim="swing-left" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
        <Icon name="undo" size={18} />
      </button>
      <button type="button" className="history-controls__button" data-anim="swing-right" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
        <Icon name="redo" size={18} />
      </button>
      <span className="history-controls__divider" aria-hidden="true" />
      <button
        type="button"
        className="history-controls__button history-controls__button--label"
        data-anim="spin-back"
        onClick={resetConfiguration}
        disabled={isEmpty}
        aria-label="Start over"
        title="Start over (can be undone)"
      >
        <Icon name="rotateLeft" size={18} />
        <span className="history-controls__label">Start over</span>
      </button>
    </div>
  )
}
