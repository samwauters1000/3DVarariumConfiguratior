import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Vector3 } from 'three'
import { createRandom, seedFromString } from '../../utils/variation.js'

// Organic low-poly geometry: lumpy rocks and curved, tapering trunks. Flat shading makes
// the facets visible, in the style of the plants.

// Lumpy rock: an icosahedron whose corners are pushed in and out. The displacement depends
// on the corner position, so faces that share a corner stay connected.
export function createRockGeometry(seed, { detail = 1, roughness = 0.28 } = {}) {
  const geometry = new IcosahedronGeometry(1, detail)
  const positions = geometry.attributes.position
  const bumps = new Map()
  const random = createRandom(seedFromString(`${seed}:rock`))
  const corner = new Vector3()
  for (let index = 0; index < positions.count; index++) {
    corner.fromBufferAttribute(positions, index)
    const key = `${corner.x.toFixed(3)},${corner.y.toFixed(3)},${corner.z.toFixed(3)}`
    if (!bumps.has(key)) bumps.set(key, 1 + (random() - 0.5) * 2 * roughness)
    corner.multiplyScalar(bumps.get(key))
    // Flatten the underside so the rock sits on the ground.
    if (corner.y < -0.35) corner.y = -0.35 + (corner.y + 0.35) * 0.25
    positions.setXYZ(index, corner.x, corner.y, corner.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

// Tube along a list of points with a radius that changes along its length (thick at the
// base, thin at the tip). `radiusAt(t)` gets 0 at the start and 1 at the end.
export function createTaperedTube(points, radiusAt, radialSegments = 6) {
  const vertices = []
  const rings = []
  const up = new Vector3(0, 1, 0)
  for (let index = 0; index < points.length; index++) {
    const previous = points[Math.max(0, index - 1)]
    const next = points[Math.min(points.length - 1, index + 1)]
    const direction = new Vector3().subVectors(next, previous).normalize()
    const side = new Vector3().crossVectors(direction, Math.abs(direction.y) > 0.95 ? new Vector3(1, 0, 0) : up).normalize()
    const normal = new Vector3().crossVectors(side, direction).normalize()
    const radius = radiusAt(index / (points.length - 1))
    const ring = []
    for (let segment = 0; segment < radialSegments; segment++) {
      const angle = (segment / radialSegments) * Math.PI * 2
      ring.push(
        points[index]
          .clone()
          .addScaledVector(side, Math.cos(angle) * radius)
          .addScaledVector(normal, Math.sin(angle) * radius),
      )
    }
    rings.push(ring)
  }
  for (let index = 0; index < rings.length - 1; index++) {
    for (let segment = 0; segment < radialSegments; segment++) {
      const nextSegment = (segment + 1) % radialSegments
      const a = rings[index][segment]
      const b = rings[index + 1][segment]
      const c = rings[index + 1][nextSegment]
      const d = rings[index][nextSegment]
      vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray())
    }
  }
  // Close the tip.
  const tip = points[points.length - 1]
  const last = rings[rings.length - 1]
  for (let segment = 0; segment < radialSegments; segment++) {
    vertices.push(...last[segment].toArray(), ...tip.toArray(), ...last[(segment + 1) % radialSegments].toArray())
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}
