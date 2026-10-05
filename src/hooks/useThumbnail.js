import { useEffect, useSyncExternalStore } from 'react'
import { getGraphicsQuality } from '../scene/graphicsQuality.js'
import { prerenderedThumbnails, THUMBNAIL_VERSION } from '../data/thumbnails.generated.js'

// Thumbnail image of a catalogue item, made from its 3D model.
//
// 1. Pre-rendered image (public/thumbnails, made by `npm run thumbnails`): used on every
//    device, including phones and tablets. Just an image, so no extra 3D work at all.
// 2. Otherwise (a new item without an image yet), rendered live on desktop only; phones and
//    tablets keep the icon, to save GPU memory. The live renderer (and three.js) is only
//    loaded when it is actually needed.
//
// Returns null until an image is available.

let rendererModule = null
let loading = null
let version = 0
const listeners = new Set()

const notify = () => {
  version++
  listeners.forEach((listener) => listener())
}

function loadRenderer() {
  loading ??= import('../scene/thumbnails/thumbnailRenderer.jsx').then((module) => {
    rendererModule = module
    module.subscribeToThumbnails(notify)
    notify()
    return module
  })
  return loading
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const THUMBNAIL_CATEGORIES = new Set(['plants', 'decoration', 'animals'])

export const getPrerenderedThumbnail = (categoryId, item) =>
  item && prerenderedThumbnails.has(`${categoryId}:${item.id}`)
    ? `${import.meta.env.BASE_URL}thumbnails/${categoryId}/${item.id}.webp?v=${THUMBNAIL_VERSION}`
    : null

export function useThumbnail(categoryId, item) {
  const prerendered = THUMBNAIL_CATEGORIES.has(categoryId) ? getPrerenderedThumbnail(categoryId, item) : null
  const liveEnabled = !prerendered && Boolean(item) && THUMBNAIL_CATEGORIES.has(categoryId) && getGraphicsQuality() === 'high'
  useSyncExternalStore(subscribe, () => version)

  useEffect(() => {
    if (liveEnabled) loadRenderer().then((module) => module.requestThumbnail(categoryId, item))
  }, [liveEnabled, categoryId, item])

  if (prerendered) return prerendered
  return liveEnabled && rendererModule ? rendererModule.getCachedThumbnail(categoryId, item) : null
}
