import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { mergeMeshes } from '../src/scene/objects/MergedModel.jsx'

// Two matte boxes, one at the feet and one on top, plus a glossy "eye" at the feet.
function buildModel() {
  const root = new Group()
  const matte = new MeshStandardMaterial({ color: '#3a78c8', roughness: 0.78 })
  const feet = new Mesh(new BoxGeometry(1, 0.1, 1), matte)
  feet.position.y = 0.05
  const top = new Mesh(new BoxGeometry(1, 0.1, 1), matte)
  top.position.y = 0.95
  const eye = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshStandardMaterial({ color: '#141414', roughness: 0.2 }))
  eye.position.y = 0.05
  root.add(feet, top, eye)
  return root
}

const averageColorAt = (geometry, test) => {
  const position = geometry.attributes.position
  const color = geometry.attributes.color
  let sum = 0
  let count = 0
  for (let index = 0; index < position.count; index++) {
    if (!test(position.getY(index))) continue
    sum += color.getZ(index) // blue channel
    count++
  }
  return sum / count
}

describe('merged models', () => {
  it('fade matte parts towards the bottom when a gradient is given', () => {
    const parts = mergeMeshes(buildModel(), { color: '#2f3d2c', strength: 0.6 })
    const matte = parts.find((part) => part.material.roughness > 0.4)
    const bottomBlue = averageColorAt(matte.geometry, (y) => y < 0.2)
    const topBlue = averageColorAt(matte.geometry, (y) => y > 0.8)
    expect(bottomBlue).toBeLessThan(topBlue * 0.75)
  })

  it('leave glossy parts (eyes) and models without a gradient unchanged', () => {
    const parts = mergeMeshes(buildModel(), { color: '#2f3d2c', strength: 0.6 })
    const eye = parts.find((part) => part.material.roughness < 0.4)
    const plain = mergeMeshes(buildModel()).find((part) => part.material.roughness > 0.4)
    expect(averageColorAt(eye.geometry, () => true)).toBeCloseTo(new MeshStandardMaterial({ color: '#141414' }).color.b, 5)
    expect(averageColorAt(plain.geometry, (y) => y < 0.2)).toBeCloseTo(averageColorAt(plain.geometry, (y) => y > 0.8), 5)
  })
})
