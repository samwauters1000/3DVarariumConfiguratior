let instanceCounter = 0

// Unique id for a placed object. It also seeds the object's natural variation,
// so the same id always produces the same-looking plant.
export const createInstanceId = (itemId) =>
  `${itemId}-${Date.now().toString(36)}-${(instanceCounter++).toString(36)}`
