// "Lights": optional equipment, plus the lid for open containers.
//
// Lids only fit open containers (`lidable` on terrariums); closed containers have their own.
// A lid keeps climbing animals in and holds humidity.
//
// Lights are real products with one fixed size (in cm). They sit inside the glass, so a
// light only fits when the container has room for it (`lightSpace` on terrariums), and it is
// drawn at its true size. How a light is mounted decides which room it needs:
// - mount 'bar':    a straight bar under the top (or across an open rim); needs `bar` cm
// - mount 'puck':   a round light fixed under the top; needs `puck` cm of width
// - mount 'cork':   built into the cork of a bottle; needs a corked container
// - mount 'floor':  stands on the soil; needs `floor` cm of soil width (minFloorCm)
// - mount 'string': a flexible string of lights; fits every container
// kind 'main' = the day light, one per terrarium (choosing another replaces it);
// kind 'special' = extra lights that combine with everything.
// nightOnly: only switched on in night mode (like a real moonlight LED on a timer).
// Colours follow real products: 6500 K daylight LEDs, neutral white pucks, violet-white
// UVB tubes, blue moonlight LEDs and warm 2700 K fairy lights.
export const lids = [
  {
    id: 'lid-glass',
    name: 'Glass Lid',
    description: 'Clear glass cover. Keeps humidity high and animals in.',
    price: 12,
    swatch: '#dfe8e4',
    ventilated: false,
  },
  {
    id: 'lid-mesh',
    name: 'Mesh Lid',
    description: 'Fine metal mesh. Keeps animals in with plenty of fresh air.',
    price: 10,
    swatch: '#4a4a48',
    ventilated: true,
  },
]

export const lights = [
  {
    id: 'light-led',
    name: 'LED Grow Bar 20 cm',
    description: 'Full-spectrum 6500 K LED bar. Helps light-hungry plants grow.',
    price: 18,
    swatch: '#f4f8ff',
    kind: 'main',
    mount: 'bar',
    sizeCm: 20,
    style: 'bar',
    color: '#f2f7ff',
    intensity: 2.2,
    growLight: true,
  },
  {
    id: 'light-led-60',
    name: 'LED Grow Bar 60 cm',
    description: 'Long full-spectrum 6500 K LED bar for large tanks.',
    price: 39,
    swatch: '#f4f8ff',
    kind: 'main',
    mount: 'bar',
    sizeCm: 60,
    style: 'bar',
    color: '#f2f7ff',
    intensity: 3,
    growLight: true,
  },
  {
    id: 'light-puck',
    name: 'LED Puck Light',
    description: 'Round, flat Ø 7 cm LED fixed under the top. Neutral white light for small setups.',
    price: 14,
    swatch: '#fff4e2',
    kind: 'main',
    mount: 'puck',
    sizeCm: 7,
    style: 'puck',
    color: '#fff1dc',
    intensity: 1.8,
    growLight: false,
  },
  {
    id: 'light-cork',
    name: 'Cork LED Light',
    description: 'A cork with a tiny LED built in. The classic light for bottle gardens.',
    price: 9,
    swatch: '#e2c39a',
    kind: 'main',
    mount: 'cork',
    sizeCm: 2.5,
    style: 'cork',
    color: '#fff0d6',
    intensity: 0.9,
    growLight: false,
  },
  {
    id: 'light-uvb',
    name: 'UVB T5 Tube 38 cm',
    description: 'UVB tube with a reflector. Reptiles like chameleons need it to stay healthy.',
    price: 26,
    swatch: '#ece8ff',
    kind: 'special',
    mount: 'bar',
    sizeCm: 38,
    style: 'uvb',
    color: '#e6e2ff',
    intensity: 0.9,
    growLight: false,
    uvb: true,
  },
  {
    id: 'light-moon',
    name: 'Moonlight LED',
    description: 'Tiny Ø 2 cm blue night light, used in real vivariums to watch animals after dark.',
    price: 8,
    swatch: '#b9c8ff',
    kind: 'special',
    mount: 'puck',
    sizeCm: 2,
    style: 'moon',
    color: '#7f9bff',
    intensity: 0.7,
    growLight: false,
    nightOnly: true,
  },
  {
    id: 'light-mushroom',
    name: 'Glowing Mushroom Lamp',
    description: 'A 6 cm cluster of mushrooms that glows softly on the soil.',
    price: 14,
    swatch: '#9ff0d8',
    kind: 'special',
    mount: 'floor',
    sizeCm: 6,
    minFloorCm: 12,
    style: 'mushroom',
    color: '#8ff5d6',
    intensity: 0.9,
    growLight: false,
    spot: { round: { x: -0.42, z: -0.6 }, rect: { x: -0.78, z: -0.55 } },
    footprint: 0.13,
  },
  {
    id: 'light-fairy',
    name: 'Fairy Lights 1 m',
    description: 'A thin wire with tiny warm LEDs, draped around the edge of the soil. Fits any container.',
    price: 9,
    swatch: '#ffe6a8',
    kind: 'special',
    mount: 'string',
    sizeCm: 100,
    style: 'fairy',
    color: '#ffd98a',
    intensity: 0.5,
    growLight: false,
  },
]

// Size label shown on the cards, e.g. "20 cm" or "Ø 7 cm".
export function getLightSizeLabel(light) {
  if (light.mount === 'bar') return `${light.sizeCm} cm long`
  if (light.mount === 'puck' || light.mount === 'cork') return `Ø ${light.sizeCm} cm`
  if (light.mount === 'floor') return `${light.sizeCm} cm wide`
  return `${light.sizeCm / 100} m string`
}

export const findLid = (id) => lids.find((lid) => lid.id === id) ?? null
export const findLight = (id) => lights.find((light) => light.id === id) ?? null
export const getLights = (ids = []) => ids.map(findLight).filter(Boolean)
