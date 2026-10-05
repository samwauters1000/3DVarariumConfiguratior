// Care information per plant and animal, shown in the catalogue (info button), in the
// selected-item panel and as a care sheet in the PDF. Kept apart from the catalogue data so
// it can be written and checked on its own.
//
// Plants: light, water, humidity (Low / Medium / High), difficulty (Easy / Medium / Expert)
// and one practical tip.
// Animals: humidity, food, difficulty, a tip, and flags used by the compatibility warnings:
// - needsHide: wants a hiding place (hide-type decoration)
// - climbs: escapes from containers without a lid
// - solitary: should not share the terrarium with other larger animals
// - predator: may eat small animals (and be stressed by them)
// - needsUvb: needs a UVB light (reptiles that bask, like chameleons)

const plant = (light, water, humidity, difficulty, tip) => ({ light, water, humidity, difficulty, tip })

export const plantCare = {
  'plant-fittonia': plant('Medium', 'High', 'High', 'Easy', 'Wilts dramatically when dry, and recovers within hours after watering.'),
  'plant-moss': plant('Medium', 'High', 'High', 'Easy', 'Mist it often; it browns in dry air.'),
  'plant-pilea': plant('Bright', 'Medium', 'Medium', 'Easy', 'Let the top of the soil dry out between waterings.'),
  'plant-pilea-glauca': plant('Medium', 'Medium', 'Medium', 'Easy', 'Trim runners to keep it compact.'),
  'plant-creeping-fig': plant('Medium', 'Medium', 'High', 'Easy', 'Grows fast; prune it so it does not cover everything.'),
  'plant-marcgravia': plant('Medium', 'Medium', 'High', 'Medium', 'Give it cork or bark to climb; it flattens against the surface.'),
  'plant-peacock-fern': plant('Low', 'High', 'High', 'Medium', 'Keep it out of direct sun to keep the blue sheen.'),
  'plant-air-plant': plant('Bright', 'Low', 'Low', 'Easy', 'Soak it in water for 20 minutes once a week, then let it dry.'),
  'plant-echeveria': plant('Bright', 'Low', 'Low', 'Easy', 'Water only when the soil is completely dry.'),
  'plant-cactus': plant('Bright', 'Low', 'Low', 'Easy', 'Water sparingly, even less in winter.'),
  'plant-lithops': plant('Bright', 'Low', 'Low', 'Medium', 'Do not water while it is splitting into new leaves.'),
  'plant-string-of-pearls': plant('Bright', 'Low', 'Low', 'Medium', 'Water when the pearls look slightly wrinkled.'),
  'plant-fern': plant('Medium', 'High', 'High', 'Easy', 'Keep the soil evenly moist; never let it dry out.'),
  'plant-peperomia': plant('Medium', 'Medium', 'Medium', 'Easy', 'Thick leaves store water; avoid soggy soil.'),
  'plant-orchid': plant('Medium', 'Medium', 'High', 'Medium', 'Let the roots breathe; they rot in wet soil.'),
  'plant-bromeliad': plant('Bright', 'Medium', 'High', 'Easy', 'Keep a little water in the central cup.'),
  'plant-birds-nest-fern': plant('Low', 'Medium', 'High', 'Easy', 'Water around the base, not into the centre.'),
  'plant-maidenhair-fern': plant('Low', 'High', 'High', 'Expert', 'Very sensitive to dry air and dry soil.'),
  'plant-mini-aloe': plant('Bright', 'Low', 'Low', 'Easy', 'Loves sun; water deeply but rarely.'),
  'plant-croton': plant('Bright', 'Medium', 'Medium', 'Medium', 'Needs bright light to keep its colours.'),
  'plant-pothos': plant('Low', 'Medium', 'Medium', 'Easy', 'Very forgiving; tolerates low light.'),
  'plant-philodendron-verrucosum': plant('Medium', 'Medium', 'High', 'Expert', 'Needs constant high humidity for its velvety leaves.'),
  'plant-jewel-orchid': plant('Low', 'Medium', 'High', 'Medium', 'Grown for its leaves; keep it out of direct sun.'),
  'plant-variegated-haworthia': plant('Bright', 'Low', 'Low', 'Easy', 'Grows slowly; water only when dry.'),
  'plant-pitcher-plant': plant('Bright', 'High', 'High', 'Expert', 'Use rain or distilled water; never fertilise.'),
  'plant-tillandsia-xerographica': plant('Bright', 'Low', 'Low', 'Easy', 'Mist lightly; it takes up water through its leaves.'),
  'plant-thai-constellation': plant('Medium', 'Medium', 'High', 'Medium', 'Bright indirect light keeps the cream speckles.'),
  'plant-queen-anthurium': plant('Medium', 'Medium', 'High', 'Expert', 'Needs warm, very humid air and airy roots.'),
}

const animal = (humidity, food, difficulty, tip, flags = {}) => ({ humidity, food, difficulty, tip, ...flags })

export const animalCare = {
  'animal-snail': animal('High', 'Vegetables and cuttlebone', 'Easy', 'Keep the ground damp and offer calcium.'),
  'animal-dart-frog': animal('High', 'Fruit flies and springtails', 'Medium', 'Needs misting every day.', { needsHide: true, climbs: true, predator: true }),
  'animal-crested-gecko': animal('Medium', 'Fruit mix and insects', 'Easy', 'Mist in the evening; it is active at night.', { needsHide: true, climbs: true, solitary: true, predator: true }),
  'animal-isopods': animal('High', 'Leaf litter and wood', 'Easy', 'Give them leaf litter and a damp corner.'),
  'animal-springtails': animal('High', 'Mould and plant waste', 'Easy', 'The perfect clean-up crew; keep the soil moist.'),
  'animal-jumping-spider': animal('Medium', 'Small flies', 'Medium', 'Best kept on its own; it hunts small animals.', { needsHide: true, climbs: true, solitary: true, predator: true }),
  'animal-millipede': animal('High', 'Leaf litter and vegetables', 'Easy', 'Loves to burrow in deep, moist ground.', { needsHide: true }),
  'animal-tree-frog': animal('High', 'Crickets and flies', 'Medium', 'Sleeps on leaves during the day; mist daily.', { needsHide: true, climbs: true, predator: true }),
  'animal-chameleon': animal('Medium', 'Small insects', 'Expert', 'Prefers to live alone, needs lots of climbing branches and a UVB light.', { needsHide: true, climbs: true, solitary: true, predator: true, needsUvb: true }),
  'animal-hermit-crab': animal('High', 'Fruit, vegetables and pellets', 'Medium', 'Offer spare shells so it can move house.', { needsHide: true, climbs: true }),
}

export const getCare = (categoryId, itemId) => (categoryId === 'plants' ? plantCare[itemId] : categoryId === 'animals' ? animalCare[itemId] : null) ?? null
