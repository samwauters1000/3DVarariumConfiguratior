import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import Alert from '../common/Alert.jsx'
import Dialog from '../common/Dialog.jsx'
import { formatPrice } from '../../utils/pricing.js'
import { formatDate } from '../../utils/summary.js'
import { exportConfigurationPdf } from '../../utils/pdf.js'

// Receipt-style review of the confirmed configuration.
export default function ConfigurationSummary({ summary, onClose }) {
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
      subtitle="Review your configuration before downloading it."
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
      </article>

      {summary.careWarnings?.length > 0 && (
        <section className="care-tips is-open" aria-label="Care tips">
          <p className="care-tips__toggle">
            <Icon name="info" size={16} />
            <span className="care-tips__title">Before you build</span>
          </p>
          <ul className="care-tips__list">
            {summary.careWarnings.map((warning) => (
              <li key={warning.id} className={`care-tips__item care-tips__item--${warning.tone}`}>
                {warning.text}
              </li>
            ))}
          </ul>
        </section>
      )}
      {summary.careSheet?.length > 0 && (
        <p className="section-note">The PDF includes a care sheet for every plant and animal.</p>
      )}

      {exportState === 'error' && <Alert tone="error">The PDF could not be created. Please try again.</Alert>}
    </Dialog>
  )
}
