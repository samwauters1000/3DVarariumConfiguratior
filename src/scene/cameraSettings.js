// One camera, shared by direct mouse/touch input and the bottom camera toolbar.
export const CAMERA_SETTINGS = {
  fov: 38,
  // Default viewing angle: slightly above the terrarium, looking from the front.
  polarAngle: 1.18,
  azimuthAngle: 0,
  // Keep the camera above the floor and away from straight top-down views.
  minPolarAngle: 0.25,
  maxPolarAngle: 1.45,
  rotateStep: Math.PI / 4,
  zoomStep: 0.8,
}

// Framing used when a terrarium has no `view` of its own: the area that must fit on
// screen (terrarium plus the 360° ring), where to look, and zoom limits.
export const DEFAULT_VIEW = {
  halfWidth: 1.75,
  halfHeight: 1.35,
  targetY: 0.75,
  ringRadius: 1.5,
  minDistance: 2.4,
  maxDistance: 9,
}

// Every container is modelled in its own scene units (`cmPerUnit` in data/terrariums.js); the
// workbench, pots and desk lamp have fixed real sizes in cm and are converted to those units,
// so a container always stands at its real size on the same bench. Before a container is
// chosen, the bench uses the Glass Dome's units.
export const REFERENCE_CM_PER_UNIT = 13.2
export const getCmPerUnit = (terrarium) => terrarium?.cmPerUnit ?? REFERENCE_CM_PER_UNIT

// Framing before a terrarium is chosen: the whole workbench (top, edges and legs), looking at
// the bench top instead of at a terrarium that is not there yet.
export const EMPTY_VIEW = {
  ...DEFAULT_VIEW,
  halfWidth: 7.2,
  halfHeight: 4,
  targetY: 0.1,
  maxDistance: 28,
}

const LARGEST_CONTAINER_CM = 90

// Largest real size of a container in cm, from its dimensions ("25 × 25 × 32 cm").
export function getLargestSizeCm(terrarium) {
  const sizes = String(terrarium?.dimensions ?? '').match(/\d+(\.\d+)?/g)?.map(Number) ?? []
  return sizes.length > 0 ? Math.max(...sizes) : LARGEST_CONTAINER_CM
}

// Every container fills the view when it is chosen, so small ones are easy to work on. Small
// containers can be zoomed out further, to see them at their real size on the bench next to
// the pots and lamp (a 12 cm bottle as far as the 90 cm tank).
export function getView(terrarium) {
  if (!terrarium) return EMPTY_VIEW
  const view = { ...DEFAULT_VIEW, ...terrarium.view }
  return { ...view, maxDistance: view.maxDistance * (LARGEST_CONTAINER_CM / getLargestSizeCm(terrarium)) ** 0.6 }
}

export const getCameraTarget = (view) => [0, view.targetY, 0]

// Distance at which the view fits the viewport, for any screen shape.
export function getFitDistance(aspect, view) {
  const halfFov = (CAMERA_SETTINGS.fov * Math.PI) / 360
  const vertical = view.halfHeight / Math.tan(halfFov)
  const horizontal = view.halfWidth / (Math.tan(halfFov) * aspect)
  return Math.min(Math.max(vertical, horizontal, view.minDistance), view.maxDistance)
}

export function getDefaultCameraPosition(aspect, view = DEFAULT_VIEW) {
  const distance = getFitDistance(aspect, view)
  const { polarAngle, azimuthAngle } = CAMERA_SETTINGS
  return [
    distance * Math.sin(polarAngle) * Math.sin(azimuthAngle),
    view.targetY + distance * Math.cos(polarAngle),
    distance * Math.sin(polarAngle) * Math.cos(azimuthAngle),
  ]
}

export function rotateCamera(controls, direction) {
  controls?.rotate(direction * CAMERA_SETTINGS.rotateStep, 0, true)
}

export function zoomCamera(controls, direction) {
  controls?.dolly(direction * CAMERA_SETTINGS.zoomStep, true)
}

export function resetCamera(controls, view = DEFAULT_VIEW, enableTransition = true) {
  if (!controls) return
  const position = getDefaultCameraPosition(controls.camera.aspect || 1, view)
  controls.setLookAt(...position, ...getCameraTarget(view), enableTransition)
}

// Applies a terrarium's zoom limits and frames it.
export function frameTerrarium(controls, terrarium, enableTransition = true) {
  if (!controls) return
  const view = getView(terrarium)
  controls.minDistance = view.minDistance
  controls.maxDistance = view.maxDistance
  resetCamera(controls, view, enableTransition)
}
