import { Shape } from 'three'

// Turns a list of { x, y } points into a three.js Shape (for extruded geometry).
export function toShape(points) {
  const shape = new Shape()
  points.forEach((point, index) => (index === 0 ? shape.moveTo(point.x, point.y) : shape.lineTo(point.x, point.y)))
  shape.closePath()
  return shape
}
