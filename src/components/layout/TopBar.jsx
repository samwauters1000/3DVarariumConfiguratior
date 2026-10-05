import Icon from '../common/Icon.jsx'
import AccountButton from '../auth/AccountButton.jsx'

export default function TopBar({ onOpenSavedDesigns }) {
  return (
    <header className="top-bar">
      {/* One title only (after user testing): bold, on the left. */}
      <h1 className="top-bar__brand">Vararium Configurator</h1>
      <div className="top-bar__actions">
        <button type="button" className="button button--ghost" data-anim="pop" onClick={onOpenSavedDesigns} title="Saved designs">
          <Icon name="bookmark" size={18} />
          <span className="button__label">Saved designs</span>
        </button>
        {/* Start over moved next to undo / redo in the 3D view. */}
        {/* Optional login: "Sign in", or a round avatar with a menu when signed in. */}
        <AccountButton />
      </div>
    </header>
  )
}
