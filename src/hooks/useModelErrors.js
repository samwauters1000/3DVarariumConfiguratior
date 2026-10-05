import { useSyncExternalStore } from 'react'

// Models that exist but could not be loaded (corrupt or invalid files). The scene shows
// the simple placeholder instead, and the UI tells the user a simplified version is shown.
let failedModels = []
const listeners = new Set()

export function reportModelError(url, error) {
  if (failedModels.includes(url)) return
  console.error(`Missing model: ${url} could not be loaded.`, error)
  failedModels = [...failedModels, url]
  listeners.forEach((listener) => listener())
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useModelErrors = () => useSyncExternalStore(subscribe, () => failedModels)
