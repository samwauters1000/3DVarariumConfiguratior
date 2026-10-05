// Terrarium options. `placeholder` picks the temporary geometry used until the final
// .glb models are ready. `interior` describes the inside of the container in scene units:
// - groundShape: 'round' (cylinder layers), 'box' (rectangular) or 'heart'
// - where the ground layers sit; the planting area is derived from this shape
// Optional:
// - collection: 'special' for unusual shapes, shown in their own highlighted group
// - maxPlants: how many plants physically fit
// - plantScale: plants are shown smaller in small containers
// - plantSizes: which plant sizes fit (default: all). Low or tiny containers exclude tall plants.
// - view: camera framing for containers that are much bigger or smaller than usual
// - closed: the container has its own lid or narrow opening (animals cannot escape)
// - lidable: an open container that can get a lid from "Lid & light"
// - top: where the opening / top of the container is, for lids in the 3D scene
// - cmPerUnit: real size of one scene unit in this container, so lights are drawn at their
//   true size (a 20 cm LED bar looks 20 cm long next to this container)
// - lightSpace: real room for lights, in cm (see data/equipment.js): bar = longest light bar
//   that fits (0 = no flat place for a bar), puck = widest round light under the top, floor =
//   width of soil available for a lamp standing on it, cork = has a cork (Cork LED)
// - lightMount: where lights sit inside the glass, in scene units: ceilingY (attachment
//   point), puckY (round lights), barY (light bars), flush (bars fixed straight to a flat
//   ceiling) and rod (length of a brass rod across an open rim to hang lights from)
export const terrariums = [
  {
    id: 'terrarium-dome',
    name: 'Glass Dome',
    description: 'Classic bell jar with a wooden base.',
    dimensions: '25 × 25 × 32 cm',
    price: 35,
    model: '/models/terrariums/glass-dome.glb',
    placeholder: 'dome',
    closed: true,
    top: { y: 1.8, shape: 'round', radius: 0.3 },
    cmPerUnit: 13.2,
    lightSpace: { bar: 22, puck: 9, floor: 22 },
    lightMount: { ceilingY: 1.78, puckY: 1.72, barY: 1.3 },
    interior: {
      groundShape: { type: 'round', radialSegments: 12 },
      floorY: 0.14,
      drainage: { height: 0.06, bottomRadius: 0.9, topRadius: 0.9 },
      soil: { height: 0.16, bottomRadius: 0.9, topRadius: 0.9 },
    },
  },
  {
    id: 'terrarium-geometric',
    name: 'Geometric Prism',
    description: 'Faceted glass with a brass frame.',
    dimensions: '22 × 22 × 28 cm',
    price: 42,
    model: '/models/terrariums/geometric-prism.glb',
    placeholder: 'prism',
    closed: true,
    top: { y: 1.66, shape: 'round', radius: 0.3 },
    cmPerUnit: 11.6,
    lightSpace: { bar: 17, puck: 9, floor: 19 },
    lightMount: { ceilingY: 1.6, puckY: 1.35, barY: 1.1 },
    interior: {
      groundShape: { type: 'round', radialSegments: 6 },
      floorY: 0.06,
      drainage: { height: 0.06, bottomRadius: 0.9, topRadius: 0.9 },
      soil: { height: 0.16, bottomRadius: 0.9, topRadius: 0.9 },
    },
  },
  {
    id: 'terrarium-bowl',
    name: 'Open Bowl',
    description: 'Wide, open glass bowl for low plants.',
    dimensions: '30 × 30 × 18 cm',
    price: 28,
    model: '/models/terrariums/open-bowl.glb',
    plantSizes: ['small', 'medium'],
    placeholder: 'bowl',
    lidable: true,
    top: { y: 0.96, shape: 'round', radius: 1.03 },
    cmPerUnit: 13.2,
    lightSpace: { bar: 26, puck: 20, floor: 25 },
    lightMount: { ceilingY: 0.95, puckY: 0.89, barY: 0.9, rod: 2.02 },
    interior: {
      groundShape: { type: 'round', radialSegments: 12 },
      floorY: 0,
      drainage: { height: 0.07, bottomRadius: 0.58, topRadius: 0.72 },
      soil: { height: 0.22, bottomRadius: 0.72, topRadius: 1.0 },
    },
  },

  // Special shapes
  {
    id: 'terrarium-heart',
    name: 'Brass Heart',
    description: 'Faceted heart of glass panels in a polished brass frame.',
    dimensions: '32 × 14 × 24 cm',
    price: 68,
    collection: 'special',
    maxPlants: 5,
    plantScale: 0.7,
    model: '/models/terrariums/brass-heart.glb',
    plantSizes: ['small', 'medium'],
    placeholder: 'heart',
    closed: true,
    top: { y: 1.6, shape: 'round', radius: 0.3 },
    cmPerUnit: 15.2,
    lightSpace: { bar: 0, puck: 12, floor: 16 },
    lightMount: { ceilingY: 1.14, puckY: 1.1 },
    interior: {
      groundShape: { type: 'heart', depth: 0.8, inset: 0.93 },
      floorY: 0.05,
      drainage: { height: 0.08 },
      soil: { height: 0.3 },
    },
    view: { halfWidth: 1.85, halfHeight: 1.25, targetY: 0.8, ringRadius: 1.45 },
  },
  {
    id: 'terrarium-bottle',
    name: 'Tiny Bottle',
    description: 'Corked mini bottle for a few tiny plants. Fits in your hand.',
    dimensions: '8 × 8 × 12 cm',
    price: 19,
    collection: 'special',
    maxPlants: 3,
    plantScale: 0.45,
    model: '/models/terrariums/tiny-bottle.glb',
    plantSizes: ['small'],
    placeholder: 'bottle',
    closed: true,
    top: { y: 1.1, shape: 'round', radius: 0.14 },
    cmPerUnit: 10.5,
    lightSpace: { bar: 0, puck: 2.5, floor: 7, cork: true },
    lightMount: { ceilingY: 0.95, puckY: 0.93 },
    interior: {
      groundShape: { type: 'round', radialSegments: 10 },
      floorY: 0.01,
      drainage: { height: 0.05, bottomRadius: 0.34, topRadius: 0.35 },
      soil: { height: 0.1, bottomRadius: 0.35, topRadius: 0.36 },
    },
    view: { halfWidth: 0.7, halfHeight: 0.68, targetY: 0.5, ringRadius: 0.6, minDistance: 1 },
  },
  {
    id: 'terrarium-panorama',
    name: 'Panorama Tank',
    description: 'Extra-large rectangular glass tank for a whole landscape.',
    dimensions: '90 × 45 × 45 cm',
    price: 129,
    collection: 'special',
    model: '/models/terrariums/panorama-tank.glb',
    placeholder: 'panorama',
    lidable: true,
    top: { y: 1.43, shape: 'box', width: 2.8, depth: 1.4 },
    cmPerUnit: 32,
    lightSpace: { bar: 84, puck: 30, floor: 80 },
    lightMount: { ceilingY: 1.43, puckY: 1.4, barY: 1.37, flush: true },
    interior: {
      groundShape: { type: 'box', width: 2.7, depth: 1.3 },
      floorY: 0.08,
      drainage: { height: 0.08 },
      soil: { height: 0.24 },
    },
    view: { halfWidth: 2.25, halfHeight: 1.25, targetY: 0.7, ringRadius: 2.0, maxDistance: 12 },
  },
]

export const isSpecialTerrarium = (terrarium) => terrarium.collection === 'special'
