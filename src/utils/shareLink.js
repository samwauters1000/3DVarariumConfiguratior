import { PLACEABLE_CATEGORY_IDS } from '../data/objectCategories.js'
import { CONFIGURATION_VERSION } from '../state/configuration.js'
import { sanitizeConfiguration } from './configurationStorage.js'

// Share links: the whole design packed into the URL (#design=...), so anyone who opens the
// link sees exactly the same terrarium. Numbers are rounded to keep the link short, and the
// data goes through the same safety checks as saved designs when it is opened.

const PARAM = 'design='
const round = (value) => Math.round(value * 1000) / 1000

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}

// Compact form: [id, instanceId, x, z, rotationY, scale, variant?] per object.
export function encodeConfiguration(configuration) {
  const compact = { v: CONFIGURATION_VERSION, t: configuration.terrarium, g: configuration.ground, l: configuration.lid, li: configuration.lights }
  for (const categoryId of PLACEABLE_CATEGORY_IDS) {
    compact[categoryId] = configuration[categoryId].map((instance) => {
      const entry = [instance.id, instance.instanceId, round(instance.position.x), round(instance.position.z), round(instance.rotation.y), round(instance.scale.x)]
      if (instance.variant) entry.push(instance.variant)
      return entry
    })
  }
  return toBase64Url(JSON.stringify(compact))
}

export function decodeConfiguration(encoded) {
  try {
    const compact = JSON.parse(fromBase64Url(encoded))
    const raw = { version: compact.v, terrarium: compact.t, ground: compact.g, lid: compact.l, lights: Array.isArray(compact.li) ? compact.li : compact.li ? [compact.li] : [] }
    for (const categoryId of PLACEABLE_CATEGORY_IDS) {
      raw[categoryId] = (compact[categoryId] ?? []).map(([id, instanceId, x, z, rotationY, scale, variant]) => ({
        id,
        instanceId,
        position: { x, y: 0, z },
        rotation: { x: 0, y: rotationY, z: 0 },
        scale: { x: scale, y: scale, z: scale },
        variant,
      }))
    }
    return sanitizeConfiguration(raw)
  } catch {
    return null
  }
}

export function createShareLink(configuration) {
  const url = new URL(window.location.href)
  url.hash = PARAM + encodeConfiguration(configuration)
  return url.toString()
}

// Design from the current URL (if any). The hash is removed afterwards, so a later refresh
// shows the user's own autosaved work instead of the shared design again.
export function takeSharedConfiguration() {
  const hash = window.location.hash.slice(1)
  if (!hash.startsWith(PARAM)) return null
  const configuration = decodeConfiguration(hash.slice(PARAM.length))
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return configuration
}
