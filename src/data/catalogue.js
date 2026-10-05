import { terrariums } from './terrariums.js'
import { groundTypes } from './ground.js'
import { plants } from './plants.js'

export const findTerrarium = (id) => terrariums.find((item) => item.id === id) ?? null
export const findGround = (id) => groundTypes.find((item) => item.id === id) ?? null
export const findPlant = (id) => plants.find((item) => item.id === id) ?? null

export const getGroundName = (id) => findGround(id)?.name ?? id
