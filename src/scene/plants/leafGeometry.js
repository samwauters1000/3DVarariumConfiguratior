import { BufferGeometry, Float32BufferAttribute } from 'three'

// Low-poly leaf geometry in the style of 3DStylePlants.jpg: a few flat facets, a fold along
// the midrib (the two halves angle upwards like a shallow V) and a slight droop towards the
// tip. Every leaf is built along +z from the stem (z = 0) to the tip (z = 1), 1 unit wide.
// Meshes scale it to their own length and width, so one geometry per shape is shared.

// Half-width of the outline at position t (0 = base, 1 = tip), as a fraction of the width.
const OUTLINES = {
  // Rubber-plant / ficus style: pointed oval.
  oval: (t) => 0.5 * Math.pow(Math.sin(Math.PI * t), 0.75) * (1 - 0.25 * t),
  // Narrow and pointed: fern leaflets, croton, orchids.
  lance: (t) => 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 1.2),
  // Wide at the base, long taper: aloe, bromeliad, air plant, snake plant.
  sword: (t) => 0.5 * Math.pow(1 - t, 0.75),
  // Almost circular: peperomia, pilea, marcgravia.
  round: (t) => 0.5 * Math.pow(Math.sin(Math.PI * t), 0.45),
  // Heart: wide rounded lobes at the base, pointed tip (philodendron, pothos, anthurium).
  heart: (t) => 0.5 * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.65),
  // Monstera: heart outline with slits cut into the sides (see SLITS).
  monstera: (t) => 0.5 * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * t)), 0.55),
}

// Shape details: rows along the length, fold (height of the halves), droop at the tip,
// and for heart shapes how far the notch between the lobes reaches into the leaf.
const SHAPES = {
  oval: { rows: 7, fold: 0.18, droop: 0.12 },
  lance: { rows: 7, fold: 0.16, droop: 0.1 },
  sword: { rows: 6, fold: 0.3, droop: 0.05 },
  round: { rows: 6, fold: 0.12, droop: 0.06 },
  heart: { rows: 8, fold: 0.16, droop: 0.12, notch: 0.14 },
  monstera: { rows: 10, fold: 0.1, droop: 0.1, notch: 0.12, slits: [2, 4, 6, 8] },
}

function buildLeaf(shapeName) {
  const shape = SHAPES[shapeName]
  const outline = OUTLINES[shapeName]
  const positions = []

  // Each row has 5 points across: left edge, left middle, midrib, right middle, right edge.
  // The middle points let the Monstera leaf lose its outer facets (slits).
  const rows = []
  for (let row = 0; row <= shape.rows; row++) {
    const t = row / shape.rows
    const halfWidth = outline(t)
    const droop = -shape.droop * t * t
    const midZ = row === 0 && shape.notch ? shape.notch : t
    const fold = shape.fold * halfWidth * 2
    rows.push([
      [-halfWidth, droop + fold, t],
      [-halfWidth * 0.5, droop + fold * 0.5, t],
      [0, droop, midZ],
      [halfWidth * 0.5, droop + fold * 0.5, t],
      [halfWidth, droop + fold, t],
    ])
  }

  const pushTriangle = (a, b, c) => positions.push(...a, ...b, ...c)
  for (let row = 0; row < shape.rows; row++) {
    const current = rows[row]
    const next = rows[row + 1]
    const isSlit = shape.slits?.includes(row)
    for (let column = 0; column < 4; column++) {
      // Slits: skip the outer facets on both sides for this row.
      if (isSlit && (column === 0 || column === 3)) continue
      pushTriangle(current[column], next[column], next[column + 1])
      pushTriangle(current[column], next[column + 1], current[column + 1])
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

// A point on the leaf's upper surface (in the unscaled leaf space), for details such as
// veins or speckles. `side` runs from -1 (left edge) to 1 (right edge), `t` along the leaf.
export function getLeafSurfacePoint(shapeName, side, t) {
  const shape = SHAPES[shapeName] ?? SHAPES.oval
  const halfWidth = (OUTLINES[shapeName] ?? OUTLINES.oval)(t)
  const fold = shape.fold * halfWidth * 2
  return [side * halfWidth, -shape.droop * t * t + fold * Math.abs(side) + 0.003, t]
}

const cache = new Map()

// Shared geometry per leaf shape. Never dispose these; they are reused by every plant.
export function getLeafGeometry(shapeName) {
  if (!cache.has(shapeName)) cache.set(shapeName, buildLeaf(SHAPES[shapeName] ? shapeName : 'oval'))
  return cache.get(shapeName)
}

export const LEAF_SHAPES = Object.keys(SHAPES)
