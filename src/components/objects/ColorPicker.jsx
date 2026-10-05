// Colour swatches for objects with colour variants (animals). Each swatch shows the
// variant's body colour with its accent colour as a dot.
export default function ColorPicker({ variants, selected, onSelect }) {
  const current = variants.find((variant) => variant.id === selected)
  return (
    <div className="color-picker">
      <p className="color-picker__label">
        Colour <span className="color-picker__name">{current?.name}</span>
      </p>
      <div className="color-picker__swatches" role="radiogroup" aria-label="Colour">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={variant.id === selected}
            aria-label={variant.name}
            title={variant.name}
            className={`color-swatch${variant.id === selected ? ' is-selected' : ''}`}
            style={{ '--swatch-body': variant.colors.body, '--swatch-accent': variant.colors.accent }}
            onClick={() => onSelect(variant.id)}
          />
        ))}
      </div>
    </div>
  )
}
