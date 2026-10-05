// Chooses how heavy the 3D rendering may be on this device.
//
// 'high': desktop / laptop with WebGL 2 — ambient occlusion, 1024 px shadows, pixel ratio up to 1.5.
// 'low':  phones, tablets (touch as main input), devices without WebGL 2 or with little
//         memory — no post-processing, smaller shadow map, lower pixel ratio. Tablets have
//         large, high-resolution screens with mobile GPUs; the post-processing buffers can
//         exhaust their memory and make the 3D view go blank.

function supportsWebGL2() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch {
    return false
  }
}

let cached = null

export function getGraphicsQuality() {
  if (cached) return cached
  const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4
  cached = isTouchDevice || lowMemory || !supportsWebGL2() ? 'low' : 'high'
  return cached
}

export const QUALITY_SETTINGS = {
  high: { dpr: [1, 1.5], shadowMapSize: 1024, ambientOcclusion: true, antialias: true },
  low: { dpr: [1, 1.25], shadowMapSize: 512, ambientOcclusion: false, antialias: true },
}
