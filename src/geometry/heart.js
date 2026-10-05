// Pure geometry (no three.js), so the placement rules can use it too.
// Faceted heart outline (x = width, y = height) for the heart terrarium.
// Uses the classic heart curve with few points for a geometric, low-poly look,
// with the bottom tip cut off so the terrarium stands on a flat base.
const HEART_SCALE = 0.066
const SEGMENTS = 16
const TIP_CUT = 0.36

// Keeps the part of a polygon on one side of a horizontal line (Sutherland–Hodgman).
function clipHorizontal(points, lineY, keepBelow) {
  const inside = (point) => (keepBelow ? point.y <= lineY : point.y >= lineY)
  const result = []
  points.forEach((current, index) => {
    const previous = points[(index + points.length - 1) % points.length]
    const currentInside = inside(current)
    const previousInside = inside(previous)
    if (currentInside !== previousInside) {
      const t = (lineY - previous.y) / (current.y - previous.y)
      result.push({ x: previous.x + (current.x - previous.x) * t, y: lineY })
    }
    if (currentInside) result.push(current)
  })
  return result
}

function createOutline() {
  const points = []
  for (let index = 0; index < SEGMENTS; index++) {
    const t = (index / SEGMENTS) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    points.push({ x: x * HEART_SCALE, y: y * HEART_SCALE })
  }
  const bottom = Math.min(...points.map((point) => point.y))
  const cut = clipHorizontal(points, bottom + TIP_CUT, false)
  const base = bottom + TIP_CUT
  // Shift so the flat base sits at y = 0.
  return cut.map((point) => ({ x: point.x, y: point.y - base }))
}

export const HEART_OUTLINE = createOutline()
export const HEART_HEIGHT = Math.max(...HEART_OUTLINE.map((point) => point.y))
// Height of the dip between the two lobes (the point on the centre line at the top).
export const HEART_CUSP_Y = Math.max(...HEART_OUTLINE.filter((point) => Math.abs(point.x) < 1e-6).map((point) => point.y))
export const HEART_BASE_WIDTH = (() => {
  const onBase = HEART_OUTLINE.filter((point) => Math.abs(point.y) < 1e-6)
  return Math.max(...onBase.map((point) => point.x)) - Math.min(...onBase.map((point) => point.x))
})()

// Slice of the heart between two heights, shrunk slightly so it fits inside the glass.
export function getHeartSlice(bottomY, topY, inset = 1) {
  const slice = clipHorizontal(clipHorizontal(HEART_OUTLINE, topY, true), bottomY, false)
  return slice.map((point) => ({ x: point.x * inset, y: point.y }))
}

// Inner width of the heart at a given height.
export function getHeartWidthAt(y, inset = 1) {
  const slice = getHeartSlice(y - 1e-4, y + 1e-4, inset)
  if (slice.length === 0) return 0
  return Math.max(...slice.map((point) => point.x)) - Math.min(...slice.map((point) => point.x))
}
