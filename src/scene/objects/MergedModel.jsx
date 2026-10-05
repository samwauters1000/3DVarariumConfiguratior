import { useLayoutEffect, useRef, useState } from 'react'
import { Box3, Color, Float32BufferAttribute, Matrix4, MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Performance: a placeholder model is built from many small meshes (one per leaf, stone,
// eye...). Drawing hundreds of meshes per object is slow, especially with shadows. This
// component renders the model once (hidden), then merges all its meshes into one mesh per
// material type, with the colours stored per vertex. It looks the same but draws in a
// handful of calls instead of hundreds.
//
// `mergeKey` must change whenever the model's content changes (seed, item, colour...).

const noRaycast = () => {}

const round = (value, step = 0.05) => Math.round((value ?? 0) / step) * step

// Meshes with the same surface settings can share one merged mesh.
const materialKey = (material) =>
  [
    material.side,
    round(material.roughness),
    round(material.metalness),
    material.emissive?.getHexString() ?? '000000',
    round(material.emissiveIntensity ?? 0),
    material.transparent ? material.opacity : 1,
  ].join('|')

// Optional colour fade from top to bottom (animals, like 3DStyleFrog.jpg: the colour fades
// into a dark green towards the feet). `gradient` = { color, strength, reach }: `reach` is
// the part of the height (from the bottom) that the fade covers.
// `bounds` is the whole model's bounding box, so every part shares one height range.
function applyGradient(geometry, gradient, bounds) {
  const position = geometry.attributes.position
  const colors = geometry.attributes.color
  const { min, max } = bounds
  const height = Math.max(max.y - min.y, 1e-6)
  const target = new Color(gradient.color)
  const reach = gradient.reach ?? 0.6
  for (let index = 0; index < position.count; index++) {
    const fromBottom = (position.getY(index) - min.y) / height
    // Strongest at the feet, fading out smoothly towards `reach`.
    const amount = gradient.strength * Math.max(0, 1 - fromBottom / reach) ** 1.2
    colors.setXYZ(
      index,
      colors.getX(index) + (target.r - colors.getX(index)) * amount,
      colors.getY(index) + (target.g - colors.getY(index)) * amount,
      colors.getZ(index) + (target.b - colors.getZ(index)) * amount,
    )
  }
}

export function mergeMeshes(root, gradient) {
  root.updateWorldMatrix(true, true)
  const toRoot = root.matrixWorld.clone().invert()
  const buckets = new Map()

  root.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh) return
    const material = Array.isArray(object.material) ? object.material[0] : object.material
    const source = object.geometry
    const geometry = source.index ? source.toNonIndexed() : source.clone()
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name)
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals()
    geometry.applyMatrix4(new Matrix4().multiplyMatrices(toRoot, object.matrixWorld))

    // Colour per vertex (material colours are already in linear space, like vertex colours).
    const count = geometry.attributes.position.count
    const colors = new Float32Array(count * 3)
    for (let index = 0; index < count; index++) {
      colors[index * 3] = material.color.r
      colors[index * 3 + 1] = material.color.g
      colors[index * 3 + 2] = material.color.b
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))

    const key = materialKey(material)
    if (!buckets.has(key)) buckets.set(key, { material, geometries: [] })
    buckets.get(key).geometries.push(geometry)
    // The hidden original no longer needs to be hit by pointer events.
    object.raycast = noRaycast
  })

  // The fade is measured over the whole model.
  const bounds = new Box3()
  if (gradient) {
    for (const bucket of buckets.values()) {
      for (const part of bucket.geometries) {
        part.computeBoundingBox()
        bounds.union(part.boundingBox)
      }
    }
  }

  return [...buckets.values()].map(({ material, geometries }) => {
    const geometry = mergeGeometries(geometries, false)
    geometries.forEach((part) => part.dispose())
    // Glossy parts (eyes) keep their own colour.
    if (gradient && material.roughness > 0.4) applyGradient(geometry, gradient, bounds)
    const merged = new MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: material.roughness,
      metalness: material.metalness,
      side: material.side,
      emissive: material.emissive,
      emissiveIntensity: material.emissiveIntensity,
      transparent: material.transparent,
      opacity: material.opacity,
    })
    return { geometry, material: merged, transparent: material.transparent }
  })
}

export default function MergedModel({ mergeKey, gradient, children }) {
  const sourceRef = useRef(null)
  const [parts, setParts] = useState([])

  useLayoutEffect(() => {
    const merged = sourceRef.current ? mergeMeshes(sourceRef.current, gradient) : []
    setParts(merged)
    return () =>
      merged.forEach((part) => {
        part.geometry.dispose()
        part.material.dispose()
      })
    // Only rebuild when the model content changes, not on every render.
  }, [mergeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group>
      {/* Hidden original: rendered once to read its meshes, never drawn. */}
      <group ref={sourceRef} visible={false} userData={{ mergeSource: true }}>
        {children}
      </group>
      {parts.map((part, index) => (
        <mesh key={`${mergeKey}-${index}`} geometry={part.geometry} material={part.material} castShadow={!part.transparent} receiveShadow />
      ))}
    </group>
  )
}
