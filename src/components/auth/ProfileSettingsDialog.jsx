import { useRef, useState } from 'react'
import Dialog from '../common/Dialog.jsx'
import Alert from '../common/Alert.jsx'
import Icon from '../common/Icon.jsx'
import Avatar from './Avatar.jsx'
import { plants } from '../../data/plants.js'
import { getPrerenderedThumbnail } from '../../hooks/useThumbnail.js'
import { isValidEmail, useAuth } from '../../hooks/useAuth.jsx'

const PHOTO_SIZE = 160
const MAX_FILE_BYTES = 10 * 1024 * 1024

// Turns an uploaded image into a small square photo (centre crop, 160 px JPEG), so it stays
// light to store and quick to show.
function loadSquarePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file (JPG, PNG or WebP).'))
    if (file.size > MAX_FILE_BYTES) return reject(new Error('That image is larger than 10 MB. Choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = PHOTO_SIZE
      canvas.height = PHOTO_SIZE
      const context = canvas.getContext('2d')
      context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be opened. Try another one.'))
    }
    image.src = url
  })
}

// The 3D plants that have a picture, to use as a profile picture.
const PLANT_AVATARS = plants
  .map((plant) => ({ plant, image: getPrerenderedThumbnail('plants', plant) }))
  .filter((entry) => entry.image)

const sameAvatar = (a, b) => a.kind === b.kind && (a.kind !== 'plant' || a.plantId === b.plantId) && (a.kind !== 'photo' || a.photo === b.photo)

// Account settings: profile picture, name and email.
export default function ProfileSettingsDialog({ onClose }) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [avatar, setAvatar] = useState(user.avatar)
  const [photo, setPhoto] = useState(user.avatar.kind === 'photo' ? user.avatar.photo : null)
  const [state, setState] = useState({ status: 'idle', message: '' })
  const fileRef = useRef(null)
  const isSaving = state.status === 'saving'

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const square = await loadSquarePhoto(file)
      setPhoto(square)
      setAvatar({ kind: 'photo', photo: square })
      setState({ status: 'idle', message: '' })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const handleSave = async (event) => {
    event?.preventDefault()
    if (!name.trim()) return setState({ status: 'error', message: 'Enter a name.' })
    if (!isValidEmail(email)) return setState({ status: 'error', message: 'Enter a valid email address.' })
    setState({ status: 'saving', message: '' })
    try {
      const notice = await updateProfile({ name, email, avatar })
      if (notice) setState({ status: 'notice', message: notice })
      else onClose()
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const choices = [
    { key: 'initials', label: 'Initials', avatar: { kind: 'initials' } },
    ...(user.googlePicture ? [{ key: 'google', label: 'Google picture', avatar: { kind: 'google' } }] : []),
    ...(photo ? [{ key: 'photo', label: 'Your photo', avatar: { kind: 'photo', photo } }] : []),
  ]

  return (
    <Dialog
      title="Account settings"
      subtitle={user.isTest ? 'Test account: changes are saved in this browser only.' : 'Your profile picture, name and email.'}
      closeLabel="Close account settings"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button--primary" data-anim="pop" onClick={handleSave} disabled={isSaving}>
            <Icon name="check" size={18} />
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form className="profile-settings" onSubmit={handleSave}>
        {/* Live preview */}
        <div className="profile-settings__preview">
          <Avatar name={name} avatar={avatar} googlePicture={user.googlePicture} size="xl" />
          <div>
            <p className="account-menu__name">{name.trim() || 'Your name'}</p>
            <p className="account-menu__email">{email.trim() || 'your@email.com'}</p>
          </div>
        </div>

        <section className="profile-settings__section" aria-labelledby="profile-picture-title">
          <h3 id="profile-picture-title" className="section-label">
            Profile picture
          </h3>
          <div className="profile-settings__choices">
            {choices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                className={`profile-settings__choice${sameAvatar(avatar, choice.avatar) ? ' is-selected' : ''}`}
                onClick={() => setAvatar(choice.avatar)}
                aria-pressed={sameAvatar(avatar, choice.avatar)}
              >
                <Avatar name={name} avatar={choice.avatar} googlePicture={user.googlePicture} size="medium" />
                {choice.label}
              </button>
            ))}
            <button type="button" className="profile-settings__choice" data-anim="pop" onClick={() => fileRef.current?.click()}>
              <span className="avatar avatar--medium profile-settings__upload-icon">
                <Icon name="upload" size={18} />
              </span>
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          </div>

          <p className="section-note">Or pick one of the 3D plants:</p>
          <div className="profile-settings__plants" role="group" aria-label="3D plant pictures">
            {PLANT_AVATARS.map(({ plant, image }) => {
              const choice = { kind: 'plant', plantId: plant.id }
              const isSelected = sameAvatar(avatar, choice)
              return (
                <button
                  key={plant.id}
                  type="button"
                  className={`profile-settings__plant${isSelected ? ' is-selected' : ''}`}
                  onClick={() => setAvatar(choice)}
                  aria-pressed={isSelected}
                  aria-label={plant.name}
                  title={plant.name}
                >
                  <img src={image} alt="" draggable="false" />
                </button>
              )
            })}
          </div>
        </section>

        <section className="profile-settings__section" aria-labelledby="profile-details-title">
          <h3 id="profile-details-title" className="section-label">
            Name and email
          </h3>
          <label className="save-form__label" htmlFor="profile-name">
            Name
          </label>
          <input id="profile-name" className="text-input" value={name} maxLength={40} autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          <label className="save-form__label" htmlFor="profile-email">
            Email
          </label>
          <input id="profile-email" className="text-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {!user.isTest && <p className="section-note">Changing your email sends a confirmation link to the new address.</p>}
        </section>

        {state.status === 'error' && <Alert tone="error">{state.message}</Alert>}
        {state.status === 'notice' && <Alert tone="info">{state.message}</Alert>}
        {/* Enter in a field saves. */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Dialog>
  )
}
