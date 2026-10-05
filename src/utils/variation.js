// Natural variation for placed objects: every instance gets its own size, proportions,
// lean, leaf count, leaf sizes and colour. Everything is derived from a seed (the instance
// id), so an object always looks the same after moving it, switching terrarium or reloading.
// This file has no three.js dependency, so the placement rules can use it too.

export function seedFromString(text) {
  let hash = 2166136261
  for (const character of text) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// Small, fast seeded random generator (mulberry32).
export function createRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (random, min, max) => min + random() * (max - min)
export const pickOne = (random, list) => list[Math.floor(random() * list.length)]
export const intRange = (random, min, max) => Math.floor(min + random() * (max - min + 1))
export const chance = (random, probability) => random() < probability

const DEFAULT_BASE_SIZE = 1.15

// Medium and large objects start bigger than small ones, and can be scaled up further
// (see getMaxScale in rules/placementRules.js).
export const SIZE_CLASS_SCALE = { small: 1, medium: 1.2, large: 1.4 }
export const getSizeClassScale = (item) => SIZE_CLASS_SCALE[item.size] ?? 1

// Overall shape of one object, shared by placeholders, real models and the placement rules:
// - growth: 70–135% of the species' average size (`baseSize`), young to mature
// - height / width: independent stretch, so some plants are tall and narrow, others low and wide
// - lean: a slight tilt of the whole plant in a random direction
// - hue: a per-plant colour shift, so two plants of one species differ in colour too
export function getPlantShape(item, seed) {
  const random = createRandom(seedFromString(`${seed}:shape`))
  return {
    growth: range(random, 0.7, 1.35) * (item.baseSize ?? DEFAULT_BASE_SIZE) * getSizeClassScale(item),
    height: range(random, 0.8, 1.3),
    width: range(random, 0.85, 1.2),
    lean: range(random, 0, 0.18),
    leanDirection: random() * Math.PI * 2,
    hue: random() - 0.5,
  }
}

// Uniform size factor of an object (used for real models).
export const getGrowth = (item, seed) => getPlantShape(item, seed).growth

// How much ground an object covers compared to its species' average (growth × width).
// Bigger size classes are drawn larger, but their ground footprint grows less (square
// root): tall plants spread their leaves over their neighbours instead of taking up
// that much more soil.
export function getSpreadFactor(item, seed) {
  const shape = getPlantShape(item, seed)
  const classScale = getSizeClassScale(item)
  return (shape.growth / ((item.baseSize ?? DEFAULT_BASE_SIZE) * classScale)) * shape.width * Math.sqrt(classScale)
}
