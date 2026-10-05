import { useState } from 'react'
import Dialog from '../common/Dialog.jsx'
import Icon from '../common/Icon.jsx'
import Alert from '../common/Alert.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { findTerrarium } from '../../data/catalogue.js'
import { getAllInstances } from '../../data/objectCategories.js'
import { calculateTotalPrice, formatPrice } from '../../utils/pricing.js'
import { deleteDesign, listSavedDesigns, MAX_SAVED_DESIGNS, saveDesign, sanitizeConfiguration } from '../../utils/configurationStorage.js'
import { flattenToJpeg } from '../../utils/image.js'
import { createShareLink } from '../../utils/shareLink.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'
import { useSceneApi } from '../../hooks/useSceneApi.jsx'

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const describe = (configuration) => {
  const terrarium = findTerrarium(configuration.terrarium)
  const count = getAllInstances(configuration).length
  return {
    terrariumName: terrarium?.name ?? 'No terrarium',
    objectCount: count,
    total: calculateTotalPrice(configuration),
  }
}

// Copy a link that contains the whole design. Falls back to a selectable text field when
// the clipboard is not available (e.g. insecure context on a phone over the local network).
function ShareLink({ configuration }) {
  const [state, setState] = useState({ status: 'idle', link: '' })
  const canShare = configuration.terrarium !== null

  const handleCopy = async () => {
    const link = createShareLink(configuration)
    try {
      await navigator.clipboard.writeText(link)
      setState({ status: 'copied', link })
    } catch {
      setState({ status: 'manual', link })
    }
  }

  return (
    <div className="share-link">
      <div className="share-link__row">
        <div>
          <p className="save-form__label">Share this design</p>
          <p className="section-note">Anyone with the link sees exactly this terrarium.</p>
        </div>
        <button type="button" className="button button--ghost" data-anim="pop" onClick={handleCopy} disabled={!canShare}>
          <Icon name={state.status === 'copied' ? 'check' : 'share'} size={18} />
          {state.status === 'copied' ? 'Link copied' : 'Copy link'}
        </button>
      </div>
      {state.status === 'manual' && (
        <input className="text-input" readOnly value={state.link} onFocus={(event) => event.target.select()} aria-label="Share link" />
      )}
    </div>
  )
}

// Save the current design under a name, and load or delete saved designs.
// Everything is stored in this browser only.
export default function SavedDesignsDialog({ onClose }) {
  const { configuration, loadConfiguration } = useConfigurator()
  const { captureImage } = useSceneApi()
  const [designs, setDesigns] = useState(listSavedDesigns)
  const [name, setName] = useState(() => {
    const terrarium = findTerrarium(configuration.terrarium)
    return terrarium ? `My ${terrarium.name}` : 'My terrarium'
  })
  const [message, setMessage] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const canSave = configuration.terrarium !== null

  const handleSave = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const snapshot = captureImage()
      const thumbnail = snapshot ? (await flattenToJpeg(snapshot, { maxWidth: 320, quality: 0.75 })).src : null
      saveDesign({ name, configuration, thumbnail, summary: describe(configuration) })
      setDesigns(listSavedDesigns())
      setMessage({ tone: 'success', text: `"${name.trim() || 'My terrarium'}" was saved.` })
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = (design) => {
    if (!sanitizeConfiguration(design.configuration)) {
      setMessage({ tone: 'error', text: 'This design could not be loaded.' })
      return
    }
    loadConfiguration(design.configuration)
    onClose()
  }

  const handleDelete = (design) => {
    deleteDesign(design.id)
    setDesigns(listSavedDesigns())
    setPendingDelete(null)
    setMessage({ tone: 'info', text: `"${design.name}" was deleted.` })
  }

  return (
    <Dialog
      title="Saved designs"
      subtitle="Designs are stored in this browser. Loading a design can be undone."
      closeLabel="Close saved designs"
      onClose={onClose}
    >
      <ShareLink configuration={configuration} />

      <form className="save-form" onSubmit={handleSave}>
        <label className="save-form__label" htmlFor="design-name">
          Save current design
        </label>
        <div className="save-form__row">
          <input
            id="design-name"
            className="text-input"
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            disabled={!canSave}
            placeholder="Design name"
          />
          <button type="submit" className="button button--primary save-form__button" data-anim="pop" disabled={!canSave || isSaving}>
            <Icon name="save" size={18} />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {!canSave && <p className="section-note">Choose a terrarium before saving a design.</p>}
      </form>

      {message && (
        <Alert tone={message.tone === 'success' ? 'info' : message.tone}>{message.text}</Alert>
      )}

      <section className="option-section" aria-labelledby="saved-designs-title">
        <h3 id="saved-designs-title" className="section-label">
          Your designs
          <span className="section-label__count">
            {designs.length} / {MAX_SAVED_DESIGNS}
          </span>
        </h3>
        {designs.length === 0 ? (
          <EmptyState icon="bookmark" title="No saved designs yet">
            Save your current terrarium to come back to it later.
          </EmptyState>
        ) : (
          <ul className="design-list">
            {designs.map((design) => {
              const info = design.summary ?? describe(design.configuration)
              return (
                <li key={design.id} className="design-card">
                  <div className="design-card__thumb">
                    {design.thumbnail ? <img src={design.thumbnail} alt="" /> : <Icon name="terrarium" size={28} />}
                  </div>
                  <div className="design-card__body">
                    <p className="design-card__name">{design.name}</p>
                    <p className="design-card__meta">
                      {info.terrariumName} · {info.objectCount} {info.objectCount === 1 ? 'item' : 'items'} · {formatPrice(info.total)}
                    </p>
                    <p className="design-card__date">Saved {dateTimeFormatter.format(design.savedAt)}</p>
                  </div>
                  <div className="design-card__actions">
                    {pendingDelete === design.id ? (
                      <>
                        <button type="button" className="button button--ghost design-card__button" onClick={() => setPendingDelete(null)}>
                          Keep
                        </button>
                        <button type="button" className="button button--danger design-card__button" onClick={() => handleDelete(design)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="button button--primary design-card__button" onClick={() => handleLoad(design)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setPendingDelete(design.id)}
                          aria-label={`Delete ${design.name}`}
                          title="Delete"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </Dialog>
  )
}
