// Shape of the configuration state. It is plain, serialisable data so it can be saved,
// loaded and kept in the undo history. Increase the version when the shape changes.
export const CONFIGURATION_VERSION = 1

export const initialConfiguration = {
  version: CONFIGURATION_VERSION,
  terrarium: null,
  ground: null,
  plants: [],
  decoration: [],
  animals: [],
  // "Lid & light": one optional lid (id or null) and the lights that are switched on
  // (at most one main lamp plus any special lights).
  lid: null,
  lights: [],
}
