import { findGround, findTerrarium } from '../data/catalogue.js'
import { findItem, placeableCategories, PLACEABLE_CATEGORY_IDS } from '../data/objectCategories.js'
import { getColorVariant } from '../data/animals.js'
import { findLid, getLights } from '../data/equipment.js'

const priceFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const formatPrice = (amount) => priceFormatter.format(amount)

// Groups the configuration into priced sections. The total is always derived from this.
export function getPriceSections(configuration) {
  const sections = []

  const terrarium = findTerrarium(configuration.terrarium)
  if (terrarium) {
    sections.push({
      id: 'terrarium',
      label: 'Terrarium',
      lines: [{ id: terrarium.id, name: terrarium.name, quantity: 1, unitPrice: terrarium.price, total: terrarium.price }],
    })
  }

  const ground = findGround(configuration.ground)
  if (ground) {
    sections.push({
      id: 'ground',
      label: 'Ground',
      lines: [{ id: ground.id, name: ground.name, quantity: 1, unitPrice: ground.price, total: ground.price }],
    })
  }

  // Lid and lights, in building order: after the decoration, before the animals.
  const equipment = [findLid(configuration.lid), ...getLights(configuration.lights)].filter(Boolean)
  const equipmentSection = equipment.length > 0 && {
    id: 'equipment',
    label: 'Lights',
    lines: equipment.map((item) => ({ id: item.id, name: item.name, quantity: 1, unitPrice: item.price, total: item.price })),
  }

  // One section per placeable category (plants, decoration, animals), grouped per item
  // (and per colour variant, e.g. "Tiny Dart Frog (Blue)").
  for (const categoryId of PLACEABLE_CATEGORY_IDS) {
    if (categoryId === 'animals' && equipmentSection) sections.push(equipmentSection)
    const lines = new Map()
    for (const instance of configuration[categoryId]) {
      const item = findItem(categoryId, instance.id)
      if (!item) continue
      const variant = getColorVariant(item, instance.variant)
      const key = variant ? `${item.id}:${variant.id}` : item.id
      const name = variant ? `${item.name} (${variant.name})` : item.name
      const line = lines.get(key) ?? { id: key, name, quantity: 0, unitPrice: item.price, total: 0 }
      line.quantity += 1
      line.total = line.quantity * line.unitPrice
      lines.set(key, line)
    }
    if (lines.size > 0) {
      sections.push({ id: categoryId, label: placeableCategories[categoryId].label, lines: [...lines.values()] })
    }
  }

  return sections
}

export const calculateTotalPrice = (configuration) =>
  getPriceSections(configuration)
    .flatMap((section) => section.lines)
    .reduce((sum, line) => sum + line.total, 0)
