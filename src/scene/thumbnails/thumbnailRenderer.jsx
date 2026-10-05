import { useLayoutEffect, useRef } from 'react'
import { Box3, NeutralToneMapping, Vector3 } from 'three'
import { createRoot, useThree } from '@react-three/fiber'
import PlantPlaceholder from '../plants/PlantPlaceholder.jsx'
import DecorationPlaceholder from '../decoration/DecorationPlaceholder.jsx'
import AnimalPlaceholder from '../animals/AnimalPlaceholder.jsx'
import MergedModel from '../objects/MergedModel.jsx'
import { ANIMAL_GRADIENT } from '../objects/ObjectModel.jsx'

// Catalogue thumbnails rendered from the items' own 3D models. One small hidden canvas
// renders every item once (in a queue), and the images are kept in memory. The seed is
// fixed per item, so the thumbnail always shows the same, representative specimen.

const SIZE = 160
const placeholders = { plants: PlantPlaceholder, decoration: DecorationPlaceholder, animals: AnimalPlaceholder }

const cache = new Map()
const listeners = new Set()
const queue = []
let root = null
let store = null
let busy = false
// PNG for live thumbnails; the pre-render script switches to WebP (smaller files).
let imageFormat = 'image/png'

const keyOf = (categoryId, item) => `${categoryId}:${item.id}`

// Frames the model: the camera looks at it from slightly above, at a distance that fits it.
function ThumbnailScene({ categoryId, item, onReady }) {
  const groupRef = useRef(null)
  const Placeholder = placeholders[categoryId]
  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    const box = new Box3().setFromObject(groupRef.current)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const radius = Math.max(size.x, size.y, size.z) * 0.62 + 0.01
    const distance = radius / Math.tan((camera.fov * Math.PI) / 360)
    camera.position.set(center.x + distance * 0.55, center.y + distance * 0.45, center.z + distance * 0.72)
    camera.near = distance / 50
    camera.far = distance * 10
    camera.lookAt(center)
    camera.updateProjectionMatrix()
    onReady()
  }, [item, onReady, camera])

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#fffaf0', '#c9cfb6', 1.1]} />
      <directionalLight position={[-3, 6, 4]} intensity={1.4} color="#fff4e2" />
      <group ref={groupRef}>
        {/* Same merge step as in the scene, so animals get their colour fade here too. */}
        <MergedModel mergeKey={`${item.id}:thumbnail`} gradient={categoryId === 'animals' ? ANIMAL_GRADIENT : undefined}>
          <Placeholder item={item} plant={item} seed={`${item.id}-thumbnail`} variant={item.colorVariants?.[0]?.id} />
        </MergedModel>
      </group>
    </>
  )
}

async function ensureRoot() {
  if (root) return
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  root = createRoot(canvas)
  await root.configure({
    gl: { antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: NeutralToneMapping },
    camera: { fov: 30 },
    size: { width: SIZE, height: SIZE, top: 0, left: 0 },
    dpr: 1,
    frameloop: 'never',
  })
}

async function processQueue() {
  if (busy) return
  busy = true
  try {
    await ensureRoot()
    while (queue.length > 0) {
      const { categoryId, item } = queue.shift()
      const key = keyOf(categoryId, item)
      if (cache.has(key)) continue
      const ready = new Promise((resolve) => {
        store = root.render(<ThumbnailScene key={key} categoryId={categoryId} item={item} onReady={resolve} />)
      })
      await ready
      // Let the merged model swap in before taking the picture.
      await new Promise((resolve) => setTimeout(resolve, 30))
      const { gl, scene, camera } = store.getState()
      gl.render(scene, camera)
      cache.set(key, gl.domElement.toDataURL(imageFormat, 0.92))
      listeners.forEach((listener) => listener())
      // Give the page a moment between items, so scrolling stays smooth.
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
  } catch (error) {
    console.error('Thumbnails could not be rendered; icons are shown instead.', error)
    queue.length = 0
  } finally {
    busy = false
  }
}

export function requestThumbnail(categoryId, item) {
  const key = keyOf(categoryId, item)
  if (cache.has(key)) return cache.get(key)
  if (!queue.some((entry) => keyOf(entry.categoryId, entry.item) === key)) queue.push({ categoryId, item })
  processQueue()
  return null
}

export const getCachedThumbnail = (categoryId, item) => cache.get(keyOf(categoryId, item)) ?? null

// Used by `npm run thumbnails` (scripts/generate-thumbnails.mjs): renders every given
// item and returns [{ categoryId, id, dataUrl }] as WebP, to be saved as static files.
export async function renderAllThumbnails(entries) {
  imageFormat = 'image/webp'
  cache.clear()
  entries.forEach(({ categoryId, item }) => queue.push({ categoryId, item }))
  await processQueue()
  return entries.map(({ categoryId, item }) => ({ categoryId, id: item.id, dataUrl: cache.get(keyOf(categoryId, item)) ?? null }))
}

export function subscribeToThumbnails(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
