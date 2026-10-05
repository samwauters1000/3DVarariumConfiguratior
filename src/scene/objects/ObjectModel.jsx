import { memo, useMemo } from 'react'
import PlantPlaceholder from '../plants/PlantPlaceholder.jsx'
import DecorationPlaceholder from '../decoration/DecorationPlaceholder.jsx'
import AnimalPlaceholder from '../animals/AnimalPlaceholder.jsx'
import ModelWithFallback from '../models/ModelWithFallback.jsx'
import MergedModel from './MergedModel.jsx'
import { getGrowth } from '../plants/variation.js'

// Simple rounded shape for categories without their own placeholders.
function GenericPlaceholder({ item }) {
  const radius = item.footprint ?? 0.12
  return (
    <mesh position={[0, radius * 0.45, 0]} scale={[1, 0.6, 0.85]}>
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial color={item.swatch ?? '#9d988f'} roughness={0.8} />
    </mesh>
  )
}

// Animals fade into a dark moss green towards their feet (3DStyleFrog.jpg).
export const ANIMAL_GRADIENT = { color: '#2a3a28', strength: 0.85, reach: 0.75 }

const placeholders = {
  plants: PlantPlaceholder,
  decoration: DecorationPlaceholder,
  animals: AnimalPlaceholder,
}

// The 3D model of any placed object: the real .glb when available, otherwise the
// category's placeholder, merged into a few meshes for performance. `seed` (the instance
// id) gives each object its own variation; `variant` is the chosen colour (animals).
// Memoised: a model only re-renders when its own item, seed or colour changes.
function ObjectModel({ categoryId, item, seed, variant }) {
  const Placeholder = placeholders[categoryId] ?? GenericPlaceholder
  const growth = useMemo(() => getGrowth(item, seed), [item, seed])

  return (
    <ModelWithFallback
      url={item.model}
      placeholder={
        <MergedModel mergeKey={`${item.id}:${seed}:${variant ?? ''}`} gradient={categoryId === 'animals' ? ANIMAL_GRADIENT : undefined}>
          <Placeholder item={item} plant={item} seed={seed} variant={variant} />
        </MergedModel>
      }
      // Real models vary in size like placeholders do; placeholders apply their own growth.
      modelScale={growth}
    />
  )
}

export default memo(ObjectModel)
