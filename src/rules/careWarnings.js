import { findTerrarium } from '../data/catalogue.js'
import { findItem } from '../data/objectCategories.js'
import { animalCare, plantCare } from '../data/care.js'
import { findLid, getLights } from '../data/equipment.js'

// Care advice for the whole terrarium: things that are allowed, but not good for the plants
// or animals. Unlike the hard rules (ground, size, room) these never block anything; they
// are shown as tips in the options panel, the summary and the PDF.
//
// Each warning: { id, section, tone: 'warning' | 'info', text }. section is where it can be
// fixed (a section id), used for the warning dot on the section buttons.

// Clean-up crew: small animals that live happily alongside others.
const CLEAN_UP_CREW = new Set(['animal-isopods', 'animal-springtails', 'animal-snail'])

const unique = (list) => [...new Map(list.map((entry) => [entry.id, entry])).values()]
const names = (items) => {
  const list = unique(items).map((item) => item.name)
  return list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

export function getCareWarnings(configuration) {
  const terrarium = findTerrarium(configuration.terrarium)
  if (!terrarium) return []
  const warnings = []
  const animalItems = configuration.animals.map((instance) => findItem('animals', instance.id)).filter(Boolean)
  const plantItems = configuration.plants.map((instance) => findItem('plants', instance.id)).filter(Boolean)
  const decorationItems = configuration.decoration.map((instance) => findItem('decoration', instance.id)).filter(Boolean)
  const lid = findLid(configuration.lid)
  const hasGrowLight = getLights(configuration.lights).some((light) => light.growLight)
  const isClosed = terrarium.closed || Boolean(lid)

  // Escape: climbing animals in an open container.
  const climbers = animalItems.filter((item) => animalCare[item.id]?.climbs)
  if (!isClosed && climbers.length > 0) {
    warnings.push({
      id: 'escape',
      section: 'equipment',
      tone: 'warning',
      text: `The ${terrarium.name} is open: the ${names(climbers)} could escape. Add a lid under Lights.`,
    })
  }

  // Hiding place.
  const needHide = animalItems.filter((item) => animalCare[item.id]?.needsHide)
  if (needHide.length > 0 && !decorationItems.some((item) => item.hide)) {
    warnings.push({
      id: 'hide',
      section: 'decoration',
      tone: 'warning',
      text: `The ${names(needHide)} ${unique(needHide).length === 1 ? 'needs' : 'need'} a hiding place, like a Coconut Hide, Cork Tube or Mossy Log.`,
    })
  }

  // Animals that prefer to live alone, or that may eat each other.
  const housemates = unique(animalItems.filter((item) => !CLEAN_UP_CREW.has(item.id)))
  const loner = housemates.find((item) => animalCare[item.id]?.solitary)
  if (loner && housemates.length > 1) {
    warnings.push({
      id: 'solitary',
      section: 'animals',
      tone: 'warning',
      text: `The ${loner.name} prefers to live alone. Keep it apart from the ${names(housemates.filter((item) => item.id !== loner.id))}.`,
    })
  } else {
    const predators = housemates.filter((item) => animalCare[item.id]?.predator)
    if (predators.length > 1) {
      warnings.push({ id: 'predators', section: 'animals', tone: 'warning', text: `The ${names(predators)} may stress or eat each other. Choose one of them.` })
    }
  }

  // UVB: basking reptiles need it for their bones (vitamin D3).
  const needUvb = animalItems.filter((item) => animalCare[item.id]?.needsUvb)
  if (needUvb.length > 0 && !getLights(configuration.lights).some((light) => light.uvb)) {
    warnings.push({
      id: 'uvb',
      section: 'equipment',
      tone: 'warning',
      text: `The ${names(needUvb)} needs a UVB T5 Tube (Lights). It only fits the Panorama Tank.`,
    })
  }

  // Humidity: humid-loving animals next to dry-loving plants.
  const humidAnimals = animalItems.filter((item) => animalCare[item.id]?.humidity === 'High')
  const dryPlants = plantItems.filter((item) => plantCare[item.id]?.humidity === 'Low')
  if (humidAnimals.length > 0 && dryPlants.length > 0) {
    warnings.push({
      id: 'humidity',
      section: 'animals',
      tone: 'warning',
      text: `The ${names(humidAnimals)} ${unique(humidAnimals).length === 1 ? 'needs' : 'need'} humid air, but the ${names(dryPlants)} ${unique(dryPlants).length === 1 ? 'prefers' : 'prefer'} it dry.`,
    })
  }

  // Tips: humidity escapes from open containers; light-hungry plants like a lamp.
  const humidPlants = plantItems.filter((item) => plantCare[item.id]?.humidity === 'High')
  if ((!isClosed || lid?.ventilated) && humidPlants.length > 0) {
    warnings.push({
      id: 'dry-air',
      section: 'equipment',
      tone: 'info',
      text: `${lid?.ventilated ? 'With a mesh lid' : 'Without a lid'}, humidity-loving plants like the ${names(humidPlants.slice(0, 2))} dry out faster. Mist them often.`,
    })
  }
  const brightPlants = plantItems.filter((item) => plantCare[item.id]?.light === 'Bright')
  if (brightPlants.length > 0 && !hasGrowLight) {
    warnings.push({
      id: 'light',
      section: 'equipment',
      tone: 'info',
      text: `The ${names(brightPlants.slice(0, 2))} ${brightPlants.length === 1 ? 'grows' : 'grow'} best in bright light: place it near a window or add an LED Grow Light.`,
    })
  }

  return warnings
}
