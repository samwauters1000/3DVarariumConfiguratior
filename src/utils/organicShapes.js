import { createRandom, range, seedFromString } from './variation.js'

// Natural, curved paths for upright decoration (branches, cork, poles). Shared by the 3D
// model and the climbing rules, so a climbing plant follows exactly the same bend as the
// branch it grows on. No three.js here, so the rules can use it.
//
// Items opt in with `organic: { lean: [min, max], sway: [min, max] }`, as fractions of the
// object's height: `lean` is how far the top leans over, `sway` a sideways bow in the middle.

export function getSupportPath(item, seed) {
  const settings = item.organic ?? { lean: [0, 0], sway: [0, 0] }
  const random = createRandom(seedFromString(`${seed}:path`))
  const leanDirection = random() * Math.PI * 2
  const swayDirection = leanDirection + Math.PI / 2 + (random() - 0.5)
  const lean = range(random, ...settings.lean)
  const sway = range(random, ...settings.sway)
  // Offset (as a fraction of the height) of the centre line at height fraction t.
  return (t) => {
    const leanOffset = lean * t * t
    const swayOffset = sway * Math.sin(Math.PI * t)
    return {
      x: Math.cos(leanDirection) * leanOffset + Math.cos(swayDirection) * swayOffset,
      z: Math.sin(leanDirection) * leanOffset + Math.sin(swayDirection) * swayOffset,
    }
  }
}

// Rotates an (x, z) offset the same way three.js rotates an object around the y axis.
export const rotateAroundY = ({ x, z }, angle) => ({
  x: x * Math.cos(angle) + z * Math.sin(angle),
  z: -x * Math.sin(angle) + z * Math.cos(angle),
})
