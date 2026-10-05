// Ground types. Which plants can grow in each one is defined on the plants
// (`compatibleGround`), so there is a single source of truth for compatibility.
// `layers` are the colours of the drainage and top layer in the 3D scene;
// `surface` adds visible detail on top (pebbles, bark chips, moss tufts).
export const groundTypes = [
  {
    id: 'soil',
    name: 'Soil',
    description: 'Rich potting mix for tropical plants.',
    price: 8,
    swatch: '#5a4535',
    layers: { drainage: '#a39a8c', top: '#5a4535' },
    surface: { type: 'clumps', colors: ['#5a4535', '#4d3a2c', '#654e3c'] },
    model: '/models/ground/soil.glb',
  },
  {
    id: 'sand',
    name: 'Sand',
    description: 'Dry, fast-draining sand for succulents.',
    price: 6,
    swatch: '#d8c7a0',
    layers: { drainage: '#a39a8c', top: '#d8c7a0' },
    surface: { type: 'dunes', colors: ['#d8c7a0', '#cdbb92', '#e1d2ae'] },
    model: '/models/ground/sand.glb',
  },
  {
    id: 'gravel',
    name: 'Gravel',
    description: 'Airy pebbles for dry-loving plants.',
    price: 7,
    swatch: '#9d988f',
    layers: { drainage: '#7f7a72', top: '#8f8a81' },
    surface: { type: 'pebbles', colors: ['#b3ada3', '#8c877e', '#c4bfb5', '#9e998f'] },
    model: '/models/ground/gravel.glb',
  },
  {
    id: 'moss',
    name: 'Moss',
    description: 'Moist moss for humidity lovers.',
    price: 9,
    swatch: '#6f8a4f',
    layers: { drainage: '#a39a8c', top: '#5f7a42' },
    surface: { type: 'tufts', colors: ['#6f8a4f', '#7d9a5a', '#5b7340'] },
    model: '/models/ground/moss.glb',
  },
  {
    id: 'bark',
    name: 'Bark',
    description: 'Chunky bark for orchids and epiphytes.',
    price: 8,
    swatch: '#7a5236',
    layers: { drainage: '#a39a8c', top: '#5e3f2a' },
    surface: { type: 'chips', colors: ['#7a5236', '#8e6242', '#65432c'] },
    model: '/models/ground/bark.glb',
  },
]
