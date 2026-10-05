import { categories } from '../data/categories.js'

// The building flow (point 5 of the user tests, review findings R1–R3): which sections are
// required, when a section counts as done, what has to be chosen first, and what comes next.
// Plain data in, plain data out, so the panel and the tests use the same rules.

// A container, a ground and at least one plant are needed to finish (see Confirm).
export const REQUIRED_SECTIONS = new Set(['terrarium', 'ground', 'plants'])

export const isRequiredSection = (categoryId) => REQUIRED_SECTIONS.has(categoryId)

export function isSectionDone(configuration, categoryId) {
  switch (categoryId) {
    case 'terrarium':
      return configuration.terrarium !== null
    case 'ground':
      return configuration.ground !== null
    case 'plants':
    case 'decoration':
    case 'animals':
      return configuration[categoryId].length > 0
    case 'equipment':
      return (configuration.lights?.length ?? 0) > 0 || Boolean(configuration.lid)
    default:
      return false
  }
}

// The step that has to be done before a section can be used, or null. Everything inside the
// glass needs a container; plants, decoration and animals stand on the ground, so they need a
// ground too (lights only need the container).
export function getMissingStep(configuration, categoryId) {
  if (categoryId === 'terrarium') return null
  if (configuration.terrarium === null) return 'terrarium'
  if (['plants', 'decoration', 'animals'].includes(categoryId) && configuration.ground === null) return 'ground'
  return null
}

// The next section in building order, or null after the last one.
export function getNextSection(categoryId) {
  const index = categories.findIndex((category) => category.id === categoryId)
  return index >= 0 && index < categories.length - 1 ? categories[index + 1].id : null
}

export const allRequiredDone = (configuration) => [...REQUIRED_SECTIONS].every((id) => isSectionDone(configuration, id))

// What the "next step" line under a section says, or null when it should stay hidden.
// - A required section that is not done yet shows nothing: the choice comes first.
// - The last section, once everything required is done, points to Confirm.
// - Optional sections can always be skipped.
export function getNextStepHint(configuration, categoryId) {
  const done = isSectionDone(configuration, categoryId)
  if (isRequiredSection(categoryId) && !done) return null
  const next = getNextSection(categoryId)
  if (!next) return allRequiredDone(configuration) ? { kind: 'finish' } : null
  // Skipping ahead past a missing required step does not help: point to that step instead.
  const missing = getMissingStep(configuration, next)
  const target = missing ?? next
  return { kind: done ? 'next' : 'skip', categoryId: target, optional: !isRequiredSection(target) }
}
