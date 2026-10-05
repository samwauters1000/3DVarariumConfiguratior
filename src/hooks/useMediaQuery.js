import { useSyncExternalStore } from 'react'

// Subscribes to a CSS media query, e.g. to tell mouse devices from touch devices.
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// True on devices with a precise pointer that can hover (desktop / laptop with a mouse).
export const useHasMousePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
