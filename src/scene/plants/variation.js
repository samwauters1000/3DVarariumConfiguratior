import { Color } from 'three'

// Scene-side helpers for plant variation. The seeded random and shape logic lives in
// utils/variation.js (no three.js), so the placement rules can use it as well.
export * from '../../utils/variation.js'

// Lighter/darker, more/less saturated version of a colour; `hueOffset` shifts every leaf
// of one plant the same way (from its shape), the random part varies per leaf.
export function varyColor(hex, random, amount = 0.1, hueOffset = 0) {
  const color = new Color(hex)
  color.offsetHSL(hueOffset * 0.05 + (random() - 0.5) * amount * 0.3, (random() - 0.5) * amount, (random() - 0.5) * amount * 1.5)
  return `#${color.getHexString()}`
}

// Richer, more saturated version of a catalogue colour for the 3D models. The catalogue
// swatches are soft sage tones for the UI; the reference style uses fuller greens.
export function richColor(hex, saturation = 0.14, lightness = 0.02) {
  const color = new Color(hex)
  color.offsetHSL(0, saturation, lightness)
  return `#${color.getHexString()}`
}
