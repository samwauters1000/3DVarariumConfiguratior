import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import Alert from '../common/Alert.jsx'
import Dialog from '../common/Dialog.jsx'
import { formatPrice } from '../../utils/pricing.js'
import { formatDate } from '../../utils/summary.js'
import { exportConfigurationPdf } from '../../utils/pdf.js'
import { createShareLink } from '../../utils/shareLink.js'
import { useConfigurator } from '../../hooks/useConfigurator.jsx'

// After finishing, people want to keep or share their design (review finding R7), so the
// summary offers that next to the PDF.
function KeepOrShare({ onSaveDesign }) {
  const { configuration } = useConfigurator()
  const [share, setShare] = useState({ status: 'idle', link: '' })

  const handleCopy = async () => {
    const link = createShareLink(configuration)
    try {
      await navigator.clipboard.writeText(link)
      setShare({ status: 'copied', link })
    } catch {
      setShare({ status: 'manual', link })
    }
  }

  return (
    <section className="keep-share" aria-labelledby="keep-share-title">
      <div>
        <h3 id="keep-share-title" className="section-label">Keep or share it</h3>
        <p className="section-note">Save it to come back later, or send a link that shows exactly this terrarium.</p>
      </div>
      <div className="keep-share__actions">
        <button type="button" className="button button--ghost" data-anim="pop" onClick={onSaveDesign}>
          <Icon name="bookmark" size={18} />
          Save design
        </button>
        <button type="button" className="button button--ghost" data-anim="pop" onClick={handleCopy}>
          <Icon name={share.status === 'copied' ? 'check' : 'share'} size={18} />
          {share.status === 'copied' ? 'Link copied' : 'Copy link'}
        </button>
      </div>
      {share.status === 'manual' && (
        <input className="text-input" readOnly value={share.link} onFocus={(event) => event.target.select()} aria-label="Share link" />
      )}
    </section>
  )
}

// Receipt-style review of the confirmed configuration.
export default function ConfigurationSummary({ summary, onClose, onSaveDesign }) {
  const [exportState, setExportState] = useState('idle')

  const handleExport = async () => {
    setExportState('working')
    try {
      await exportConfigurationPdf(summary)
      setExportState('idle')
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportState('error')
    }
  }

  return (
    <Dialog
      title="Your terrarium"
      subtitle="Review your terrarium, then download, save or share it."
      closeLabel="Close summary"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Back to editing
          </button>
          <button type="button" className="button button--primary" onClick={handleExport} disabled={exportState === 'working'}>
            <Icon name="download" size={18} />
            {exportState === 'working' ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </>
      }
    >
      {summary.previewImage && (
        <figure className="summary__preview">
          <img src={summary.previewImage.src} alt={`3D preview of the configured ${summary.terrariumName}`} />
        </figure>
      )}

      {/* Visible straight away, without scrolling past the receipt. */}
      <KeepOrShare onSaveDesign={onSaveDesign} />

      <article className="receipt" aria-label="Configuration receipt">
        <div className="receipt__head">
          <p className="receipt__title">Terrarium configuration</p>
          <div className="receipt__meta">
            <span>{summary.reference}</span>
            <span>{formatDate(summary.createdAt)}</span>
          </div>
        </div>

        {summary.sections.map((section) => (
          <section key={section.id} className="receipt__section" aria-label={section.label}>
            <h3 className="section-label section-label--caps">{section.label}</h3>
            <ul className="receipt__lines">
              {section.lines.map((line) => (
                <li key={line.id} className="receipt__line">
                  <span className="receipt__name">
                    {line.name}
                    {line.quantity > 1 && <span className="receipt__quantity">× {line.quantity}</span>}
                  </span>
                  {line.quantity > 1 && <span className="receipt__unit">{formatPrice(line.unitPrice)} each</span>}
                  <span className="receipt__amount">{formatPrice(line.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="receipt__total">
          <span>Total</span>
          <span>{formatPrice(summary.total)}</span>
        </div>

        {/* Care warnings and tips at the end of the receipt (review finding R9). */}
        {summary.careWarnings?.length > 0 && (
          <section className="receipt__care" aria-labelledby="receipt-care-title">
            <h3 id="receipt-care-title" className="section-label section-label--caps">
              Before you build
            </h3>
            <ul className="receipt__care-list">
              {summary.careWarnings.map((warning) => (
                <li key={warning.id} className={`receipt__care-item receipt__care-item--${warning.tone}`}>
                  {warning.text}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      {summary.careSheet?.length > 0 && (
        <p className="section-note">The PDF includes a care sheet for every plant and animal.</p>
      )}

      {exportState === 'error' && <Alert tone="error">The PDF could not be created. Please try again.</Alert>}
    </Dialog>
  )
}
