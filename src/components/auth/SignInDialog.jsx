import { useState } from 'react'
import Dialog from '../common/Dialog.jsx'
import Alert from '../common/Alert.jsx'
import Icon from '../common/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'

// Google "G" mark for the Google button.
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}

// Optional sign-in: Google or a magic link sent by email (no passwords). Signing in is never
// needed to build, save on this device, share or download a PDF.
export default function SignInDialog({ onClose }) {
  const { isConfigured, signInWithGoogle, signInWithEmail, signInWithTestAccount } = useAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })
  const isWorking = state.status === 'working'

  const run = async (action) => {
    setState({ status: 'working', message: '' })
    try {
      await action()
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const handleEmail = (event) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setState({ status: 'error', message: 'Enter a valid email address.' })
      return
    }
    run(async () => {
      await signInWithEmail(email.trim())
      setState({ status: 'sent', message: '' })
    })
  }

  return (
    <Dialog title="Sign in" subtitle="Keep your saved designs in your account and open them on every device." closeLabel="Close sign in" onClose={onClose}>
      <div className="sign-in">
        {/* Test account: try the signed-in experience straight away, without a real account. */}
        <div className="sign-in__test">
          <span className="avatar avatar--large avatar--plant" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}thumbnails/plants/plant-fittonia.webp`} alt="" />
          </span>
          <div className="sign-in__test-text">
            <p className="sign-in__test-title">Try a test account</p>
            <p className="sign-in__test-note">Sign in instantly as “Test Gardener” and try the account settings. Saved in this browser only.</p>
          </div>
          <button type="button" className="button button--primary sign-in__test-button" data-anim="pop" onClick={() => run(signInWithTestAccount)}>
            Use test account
          </button>
        </div>

        <p className="sign-in__divider">
          <span>or sign in with a real account</span>
        </p>

        {!isConfigured && (
          <Alert tone="info">
            Real sign-in is not connected yet. You can keep building, saving on this device, sharing and downloading PDFs without an account.
          </Alert>
        )}

        {state.status === 'sent' ? (
          <div className="sign-in__sent" role="status">
            <Icon name="check" size={20} />
            <p>
              Check your inbox: we sent a sign-in link to <strong>{email}</strong>. Open it on this device to sign in.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="button button--ghost sign-in__google"
              onClick={() => run(signInWithGoogle)}
              disabled={!isConfigured || isWorking}
            >
              <GoogleMark />
              Continue with Google
            </button>

            <p className="sign-in__divider">
              <span>or get a sign-in link by email</span>
            </p>

            <form className="sign-in__form" onSubmit={handleEmail}>
              <label className="save-form__label" htmlFor="sign-in-email">
                Email address
              </label>
              <div className="save-form__row">
                <input
                  id="sign-in-email"
                  className="text-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!isConfigured || isWorking}
                />
                <button type="submit" className="button button--primary save-form__button" data-anim="pop" disabled={!isConfigured || isWorking}>
                  <Icon name="sparkle" size={16} />
                  {isWorking ? 'Sending…' : 'Send link'}
                </button>
              </div>
            </form>
          </>
        )}

        {state.status === 'error' && <Alert tone="error">{state.message}</Alert>}

        <p className="sign-in__privacy">
          No password needed. We only store your email address (and your name and picture from Google, if you use it) to keep
          your designs in your account.
        </p>
      </div>
    </Dialog>
  )
}
