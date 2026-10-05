import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon.jsx'
import SignInDialog from './SignInDialog.jsx'
import ProfileSettingsDialog from './ProfileSettingsDialog.jsx'
import Avatar from './Avatar.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'

// Top bar: "Sign in" when signed out; when signed in, the avatar and name. Clicking opens a
// small menu with the account details, a settings button and Sign out.
export default function AccountButton() {
  const { user, loading, signOut } = useAuth()
  const [dialog, setDialog] = useState(null) // 'sign-in' | 'settings' | null
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef(null)

  // Close the menu on a click outside or Escape.
  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handlePointer = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isMenuOpen])

  // A successful sign-in closes the sign-in dialog.
  useEffect(() => {
    if (user && dialog === 'sign-in') setDialog(null)
  }, [user, dialog])

  if (loading) return <span className="avatar avatar--medium avatar--loading" aria-label="Checking sign-in" />

  if (!user) {
    return (
      <>
        <button type="button" className="button button--ghost account-button" data-anim="pop" onClick={() => setDialog('sign-in')} title="Sign in">
          <Icon name="user" size={18} />
          <span className="button__label">Sign in</span>
        </button>
        {dialog === 'sign-in' && <SignInDialog onClose={() => setDialog(null)} />}
      </>
    )
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu__toggle"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={`Account: ${user.name}`}
        title={user.name}
      >
        <Avatar name={user.name} avatar={user.avatar} googlePicture={user.googlePicture} />
        <span className="account-menu__toggle-name">{user.name}</span>
      </button>

      {isMenuOpen && (
        <div className="account-menu__popover" role="menu">
          <div className="account-menu__who">
            <Avatar name={user.name} avatar={user.avatar} googlePicture={user.googlePicture} size="large" />
            <div className="account-menu__details">
              <p className="account-menu__name">{user.name}</p>
              <p className="account-menu__email">{user.email}</p>
              {user.isTest && <span className="habit-badge account-menu__badge">Test account</span>}
            </div>
            <button
              type="button"
              role="menuitem"
              className="icon-button account-menu__settings"
              data-anim="spin"
              onClick={() => {
                setIsMenuOpen(false)
                setDialog('settings')
              }}
              aria-label="Account settings"
              title="Account settings"
            >
              <Icon name="settings" size={18} />
            </button>
          </div>
          <p className="account-menu__note">
            {user.isTest
              ? 'This test account only exists in this browser. Saving designs to an account is coming soon.'
              : 'Saving designs to your account is coming soon. Your designs are saved on this device for now.'}
          </p>
          {error && <p className="account-menu__error">{error}</p>}
          <button
            type="button"
            role="menuitem"
            className="button button--ghost account-menu__sign-out"
            onClick={async () => {
              try {
                setError('')
                await signOut()
                setIsMenuOpen(false)
              } catch (signOutError) {
                setError(signOutError.message)
              }
            }}
          >
            <Icon name="signOut" size={18} />
            Sign out
          </button>
        </div>
      )}

      {dialog === 'settings' && <ProfileSettingsDialog onClose={() => setDialog(null)} />}
    </div>
  )
}
