import { DoubleSide } from 'three'

// Shared material settings for the placeholder models.
export const glassMaterialProps = {
  color: '#ffffff',
  transparent: true,
  opacity: 0.1,
  roughness: 0.04,
  metalness: 0,
  clearcoat: 0.4,
  clearcoatRoughness: 0.08,
  envMapIntensity: 0.55,
  side: DoubleSide,
  depthWrite: false,
}

export const woodMaterialProps = { color: '#b89572', roughness: 0.75, metalness: 0 }

export const brassMaterialProps = { color: '#b08d57', roughness: 0.35, metalness: 0.85 }

// Glass is drawn last so the plants and soil inside stay visible through it.
export const GLASS_RENDER_ORDER = 10
