import Icon from './Icon.jsx'
import { formatPrice } from '../../utils/pricing.js'

// Generic catalogue card used by every category.
export default function OptionCard({
  title,
  description,
  meta,
  price,
  swatch,
  icon,
  selected = false,
  disabled = false,
  status,
  onSelect,
  actions,
  thumbProps,
  badge,
  variant,
  onCardClick,
  // Optional image (e.g. a 3D thumbnail) shown instead of the icon.
  thumbnail,
}) {
  const isButton = typeof onSelect === 'function'
  const Element = isButton ? 'button' : 'div'
  // A card that contains its own buttons (like +) can still be clickable as a whole;
  // clicks on those inner buttons are left to them. Keyboard users use the inner buttons.
  const isClickable = !isButton && typeof onCardClick === 'function'

  const handleCardClick = (event) => {
    if (event.target.closest('button')) return
    onCardClick()
  }

  return (
    <Element
      className={`option-card${variant ? ` option-card--${variant}` : ''}${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}${isClickable ? ' is-clickable' : ''}`}
      {...(isButton
        ? { type: 'button', onClick: onSelect, disabled, 'aria-pressed': selected }
        : { 'aria-disabled': disabled, onClick: isClickable ? handleCardClick : undefined })}
    >
      <span
        className={`option-card__thumb${thumbProps ? ' is-draggable' : ''}${thumbnail ? ' has-image' : ''}`}
        style={swatch ? { '--swatch': swatch } : undefined}
        aria-hidden="true"
        {...thumbProps}
      >
        {thumbnail ? <img src={thumbnail} alt="" draggable="false" /> : <Icon name={icon} size={24} />}
      </span>

      <span className="option-card__body">
        <span className="option-card__title">
          {title}
          {badge}
        </span>
        {description && <span className="option-card__description">{description}</span>}
        {(meta || status) && (
          <span className="option-card__meta">
            {status}
            {meta && <span className="option-card__meta-text">{meta}</span>}
          </span>
        )}
      </span>

      <span className="option-card__side">
        <span className="option-card__price">{formatPrice(price)}</span>
        {selected && isButton && (
          <span className="option-card__check" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>
        )}
        {actions}
      </span>
    </Element>
  )
}
