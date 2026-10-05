import { getCare } from '../../data/care.js'

// Care facts for a plant or animal as small labelled tiles, plus a practical tip.
export default function CareDetails({ categoryId, itemId }) {
  const care = getCare(categoryId, itemId)
  if (!care) return null

  const facts =
    categoryId === 'plants'
      ? [
          ['Light', care.light],
          ['Water', care.water],
          ['Humidity', care.humidity],
          ['Care', care.difficulty],
        ]
      : [
          ['Humidity', care.humidity],
          ['Care', care.difficulty],
          ['Food', care.food],
        ]

  return (
    <dl className="care-details">
      {facts.map(([label, value]) => (
        <div key={label} className={`care-details__fact${label === 'Food' ? ' care-details__fact--wide' : ''}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
      <p className="care-details__tip">{care.tip}</p>
    </dl>
  )
}
