import { findGround, findTerrarium } from '../data/catalogue.js'
import { findItem, PLACEABLE_CATEGORY_IDS } from '../data/objectCategories.js'
import { CONFIGURATION_VERSION, initialConfiguration } from '../state/configuration.js'
import { fitsTerrarium, isGroundCompatible } from '../rules/plantRules.js'
import { clampScale, resolvePlacements } from '../rules/placementRules.js'
import { getColorVariant } from '../data/animals.js'
import { findLid } from '../data/equipment.js'
import { getValidLights } from '../rules/equipmentRules.js'

// Browser storage for configurations: an autosave of the current design and a list of
// named saved designs. Storage can be unavailable (private mode, full, blocked), so every
// access is guarded and failures never break the configurator.

const AUTOSAVE_KEY = 'terrarium-configurator:current'
const DESIGNS_KEY = 'terrarium-configurator:designs'
export const MAX_SAVED_DESIGNS = 20

function readJson(key) {
  try {
    const text = window.localStorage.getItem(key)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

// ---------- Validation ----------

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const toVector = (value, fallback) => ({
  x: isNumber(value?.x) ? value.x : fallback.x,
  y: isNumber(value?.y) ? value.y : fallback.y,
  z: isNumber(value?.z) ? value.z : fallback.z,
})

// Turns stored data back into a valid configuration: unknown items are dropped, broken
// values are repaired and all rules (ground, quantities, capacity, placement) are applied.
// Returns null when the data is not a configuration at all.
export function sanitizeConfiguration(raw) {
  if (!raw || typeof raw !== 'object' || (raw.version ?? 1) > CONFIGURATION_VERSION) return null

  const terrarium = findTerrarium(raw.terrarium)
  const ground = terrarium ? findGround(raw.ground) : null
  const configuration = {
    ...initialConfiguration,
    terrarium: terrarium?.id ?? null,
    ground: ground?.id ?? null,
    lid: terrarium?.lidable ? (findLid(raw.lid)?.id ?? null) : null,
    // `light` (one id) is the older format, before several lights could be switched on.
    lights: getValidLights(Array.isArray(raw.lights) ? raw.lights : raw.light ? [raw.light] : [], terrarium, Boolean(ground)),
  }

  for (const categoryId of PLACEABLE_CATEGORY_IDS) {
    const counts = new Map()
    const seen = new Set()
    const instances = Array.isArray(raw[categoryId]) ? raw[categoryId] : []
    configuration[categoryId] = ground
      ? instances
          .filter((instance) => {
            const item = findItem(categoryId, instance?.id)
            if (!item || !isGroundCompatible(item, ground.id) || !fitsTerrarium(item, terrarium)) return false
            if (typeof instance.instanceId !== 'string' || seen.has(instance.instanceId)) return false
            const count = (counts.get(item.id) ?? 0) + 1
            if (count > item.maxQuantity) return false
            counts.set(item.id, count)
            seen.add(instance.instanceId)
            return true
          })
          .map((instance) => {
            const item = findItem(categoryId, instance.id)
            const scale = isNumber(instance.scale?.x) ? clampScale(instance.scale.x, item) : 1
            // Colour variant: keep a valid one, otherwise fall back to the default.
            const variant = item.colorVariants ? (getColorVariant(item, instance.variant)?.id ?? item.colorVariants[0].id) : undefined
            return {
              id: instance.id,
              instanceId: instance.instanceId,
              position: toVector(instance.position, { x: 0, y: 0, z: 0 }),
              rotation: toVector(instance.rotation, { x: 0, y: 0, z: 0 }),
              scale: { x: scale, y: scale, z: scale },
              ...(variant ? { variant } : {}),
            }
          })
      : []
  }

  if (terrarium?.maxPlants) configuration.plants = configuration.plants.slice(0, terrarium.maxPlants)
  return resolvePlacements(configuration)
}

// ---------- Autosave ----------

export const loadAutosave = () => sanitizeConfiguration(readJson(AUTOSAVE_KEY))

export function saveAutosave(configuration) {
  try {
    writeJson(AUTOSAVE_KEY, configuration)
  } catch {
    // Autosave is a convenience; ignore storage errors.
  }
}

// ---------- Saved designs ----------

export function listSavedDesigns() {
  const designs = readJson(DESIGNS_KEY)
  if (!Array.isArray(designs)) return []
  return designs
    .filter((design) => design && typeof design.id === 'string' && design.configuration)
    .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
}

// Saves a design. Throws a readable error when storage is full or unavailable.
export function saveDesign({ name, configuration, thumbnail, summary }) {
  const designs = listSavedDesigns()
  if (designs.length >= MAX_SAVED_DESIGNS) {
    throw new Error(`You can keep up to ${MAX_SAVED_DESIGNS} saved designs. Delete one to save a new design.`)
  }
  const design = {
    id: `design-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || 'My terrarium',
    savedAt: Date.now(),
    configuration,
    thumbnail,
    summary,
  }
  try {
    writeJson(DESIGNS_KEY, [design, ...designs])
  } catch {
    throw new Error('Your browser could not save this design. Storage may be full or disabled.')
  }
  return design
}

export function deleteDesign(designId) {
  try {
    writeJson(
      DESIGNS_KEY,
      listSavedDesigns().filter((design) => design.id !== designId),
    )
    return true
  } catch {
    return false
  }
}
