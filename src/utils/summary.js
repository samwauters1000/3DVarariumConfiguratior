import { findTerrarium } from '../data/catalogue.js'
import { findItem } from '../data/objectCategories.js'
import { getCare } from '../data/care.js'
import { getCareWarnings } from '../rules/careWarnings.js'
import { calculateTotalPrice, getPriceSections } from './pricing.js'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatDate = (date) => dateFormatter.format(date)

// Short human-readable reference, e.g. TC-20260928-4F7K.
export function createConfigurationReference(date) {
  const stamp = date.toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')
  return `TC-${stamp}-${suffix}`
}

// Care sheet: every chosen plant and animal once, with its care facts.
export function createCareSheet(configuration) {
  const sheet = []
  for (const categoryId of ['plants', 'animals']) {
    const seen = new Set()
    for (const instance of configuration[categoryId]) {
      if (seen.has(instance.id)) continue
      seen.add(instance.id)
      const item = findItem(categoryId, instance.id)
      const care = getCare(categoryId, instance.id)
      if (!item || !care) continue
      const facts =
        categoryId === 'plants'
          ? [['Light', care.light], ['Water', care.water], ['Humidity', care.humidity], ['Care', care.difficulty]]
          : [['Humidity', care.humidity], ['Food', care.food], ['Care', care.difficulty]]
      sheet.push({ id: item.id, categoryId, name: item.name, facts, tip: care.tip })
    }
  }
  return sheet
}

// A frozen snapshot of the configuration at the moment it was confirmed.
export function createSummary(configuration, previewImage) {
  const createdAt = new Date()
  return {
    reference: createConfigurationReference(createdAt),
    createdAt,
    terrariumName: findTerrarium(configuration.terrarium)?.name ?? 'Terrarium',
    sections: getPriceSections(configuration),
    total: calculateTotalPrice(configuration),
    careSheet: createCareSheet(configuration),
    careWarnings: getCareWarnings(configuration),
    previewImage,
  }
}
