import { useEffect, useMemo, useRef, useState } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import ObjectModel from './objects/ObjectModel.jsx'
import ClimbingGrowth from './plants/ClimbingGrowth.jsx'
import AnimalIdle from './animals/AnimalIdle.jsx'
import ClampToStage from './ClampToStage.jsx'
import { findClimbingSupport } from '../rules/climbingRules.js'
import ObjectControls from '../components/controls/ObjectControls.jsx'
import { findItem, getAllInstances } from '../data/objectCategories.js'
import {
  canScaleObject,
  getFootprint,
  getObstacles,
  getPlantingArea,
  toNormalized,
  toWorld,
  validatePlacement,
} from '../rules/placementRules.js'
import { objectDragStore } from '../hooks/useObjectDrag.js'
import { useConfigurator } from '../hooks/useConfigurator.jsx'
import { useSceneApi } from '../hooks/useSceneApi.jsx'

// Places every object category (plants, decoration, animals) in the terrarium, and
// handles selecting, moving (dragging, or "Pick a new spot", with collision feedback) and
// dropping from the catalogue.

// Ignore clicks that were really the end of a camera drag.
const CLICK_DRAG_TOLERANCE = 4
const VALID_COLOR = '#f3f4ec'
const INVALID_COLOR = '#d9776b'

const setCursor = (cursor) => {
  document.body.style.cursor = cursor
}

// Objects marked like this are hidden when the preview image is captured.
const HIDE_IN_CAPTURE = { hideInCapture: true }

// Ring on the soil showing the ground an object covers (its footprint).
function FootprintRing({ radius, color }) {
  return (
    <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={HIDE_IN_CAPTURE}>
      <ringGeometry args={[radius * 0.86, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}

function PlacedObject({ categoryId, instance, item, area, surfaceY, radius, plantScale, isSelected, support, validateMove, actions, picking, pickPreview }) {
  const controls = useThree((state) => state.controls)
  const soilPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -surfaceY), [surfaceY])
  const hitPoint = useMemo(() => new Vector3(), [])
  const isDragging = useRef(false)
  // While moving (dragging, or "Pick a new spot"), the object follows the pointer; it is only
  // committed when the spot is valid.
  const [dragMove, setMove] = useState(null)
  const move = dragMove ?? pickPreview

  const { rotation, scale } = instance
  const position = move?.position ?? instance.position
  const world = toWorld(area, position)

  const endMove = (event) => {
    if (!isDragging.current) return
    isDragging.current = false
    event.target.releasePointerCapture?.(event.pointerId)
    if (controls) controls.enabled = true
    setCursor('grab')
    if (move?.valid) actions.onMove(move.position)
    setMove(null)
  }

  return (
    <group position={[world.x, surfaceY + position.y, world.z]}>
      {/* Pointer handling covers the whole object, including a climbing plant's vine. */}
      <group
        onPointerDown={(event) => {
          // A selected object can be dragged across the soil. While picking a spot, clicks
          // go through objects to the soil.
          if (!isSelected || picking) return
          event.stopPropagation()
          isDragging.current = true
          event.target.setPointerCapture(event.pointerId)
          if (controls) controls.enabled = false
          setCursor('grabbing')
        }}
        onPointerMove={(event) => {
          if (!isDragging.current) return
          event.stopPropagation()
          const point = event.ray.intersectPlane(soilPlane, hitPoint)
          if (!point) return
          const next = toNormalized(area, point)
          setMove({ position: next, valid: validateMove(next) })
        }}
        onPointerUp={endMove}
        onPointerCancel={endMove}
        onClick={(event) => {
          if (picking) return
          event.stopPropagation()
          if (event.delta > CLICK_DRAG_TOLERANCE) return
          actions.onSelect()
        }}
        onPointerOver={(event) => {
          if (picking) return
          event.stopPropagation()
          setCursor(isSelected ? 'grab' : 'pointer')
        }}
        onPointerOut={() => {
          if (!isDragging.current && !picking) setCursor('')
        }}
      >
        {support && !move ? (
          // A climber next to a support grows up it (drawn in scene units, not rotated).
          <ClimbingGrowth plant={item} seed={instance.instanceId} support={support} sizeScale={scale.x * plantScale} />
        ) : (
          <group rotation={[rotation.x, rotation.y, rotation.z]} scale={[scale.x * plantScale, scale.y * plantScale, scale.z * plantScale]}>
            {item.idle ? (
              <AnimalIdle type={item.idle} seed={instance.instanceId}>
                <ObjectModel categoryId={categoryId} item={item} seed={instance.instanceId} variant={instance.variant} />
              </AnimalIdle>
            ) : (
              <ObjectModel categoryId={categoryId} item={item} seed={instance.instanceId} variant={instance.variant} />
            )}
          </group>
        )}
      </group>

      {isSelected && (
        <>
          <FootprintRing radius={radius} color={move && !move.valid ? INVALID_COLOR : VALID_COLOR} />
          {!move && !picking && (
            <Html position={[0, 0.72 * scale.y * plantScale + 0.04, 0]} center zIndexRange={[5, 0]}>
              {/* Stays inside the 3D view, also when the object is near an edge. */}
              <ClampToStage>
                <div
                  className="scene-toolbar"
                  role="toolbar"
                  aria-label={`${item.name} actions`}
                  // Keep toolbar clicks from rotating the camera or clearing the selection.
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="scene-toolbar__name">{item.name}</span>
                  <ObjectControls item={item} variant="compact" {...actions} />
                </div>
              </ClampToStage>
            </Html>
          )}
        </>
      )}
    </group>
  )
}

// Shows where an object dragged from a catalogue will land, and whether it may go there.
function DropPreview({ terrarium, area, surfaceY, obstacles, plantScale }) {
  const { camera, gl } = useThree()
  const [preview, setPreview] = useState(null)
  const tools = useMemo(
    () => ({ raycaster: new Raycaster(), pointer: new Vector2(), hit: new Vector3(), plane: new Plane(new Vector3(0, 1, 0), 0) }),
    [],
  )
  const lastPointer = useRef(null)

  useEffect(() => {
    tools.plane.constant = -surfaceY

    const clear = () => {
      setPreview(null)
      objectDragStore.setState({ dropTarget: null })
    }

    const update = () => {
      const { categoryId, itemId, instanceId, pointer } = objectDragStore.getState()
      if (!itemId) {
        lastPointer.current = null
        setPreview(null)
        return
      }
      // Our own dropTarget update also notifies listeners; only react to pointer moves.
      if (pointer === lastPointer.current) return
      lastPointer.current = pointer

      const rect = gl.domElement.getBoundingClientRect()
      const isOverCanvas = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom
      if (!isOverCanvas) return clear()

      tools.pointer.set(((pointer.x - rect.left) / rect.width) * 2 - 1, -((pointer.y - rect.top) / rect.height) * 2 + 1)
      tools.raycaster.setFromCamera(tools.pointer, camera)
      const point = tools.raycaster.ray.intersectPlane(tools.plane, tools.hit)
      if (!point) return clear()

      const item = findItem(categoryId, itemId)
      const radius = getFootprint(item, 1, terrarium, instanceId)
      const position = toNormalized(area, point)
      const { valid, reason } = validatePlacement({ terrarium, position, radius, obstacles })
      setPreview({ categoryId, item, instanceId, radius, world: [point.x, surfaceY, point.z], valid })
      objectDragStore.setState({ dropTarget: { position, valid, reason } })
    }

    update()
    return objectDragStore.subscribe(update)
  }, [camera, gl, tools, terrarium, area, surfaceY, obstacles])

  if (!preview) return null

  return (
    <group position={preview.world} userData={HIDE_IN_CAPTURE}>
      {preview.valid && (
        <group scale={plantScale}>
          <ObjectModel categoryId={preview.categoryId} item={preview.item} seed={preview.instanceId} />
        </group>
      )}
      <FootprintRing radius={preview.radius} color={preview.valid ? VALID_COLOR : INVALID_COLOR} />
    </group>
  )
}

// "Pick a new spot": an invisible surface over the soil. The selected object follows the
// pointer (green or red ring); a click on a valid spot moves it there. Objects let these
// clicks through while picking.
function SpotPicker({ area, surfaceY, validate, onPreview, onPick, onBlocked }) {
  return (
    <mesh
      position={[0, surfaceY + 0.002, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      userData={HIDE_IN_CAPTURE}
      onPointerMove={(event) => {
        event.stopPropagation()
        const next = toNormalized(area, event.point)
        onPreview({ position: next, valid: validate(next) })
        setCursor('crosshair')
      }}
      onPointerOut={() => setCursor('')}
      onClick={(event) => {
        event.stopPropagation()
        if (event.delta > CLICK_DRAG_TOLERANCE) return
        const next = toNormalized(area, event.point)
        if (validate(next)) onPick(next)
        else onBlocked()
      }}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export default function PlacementSystem({ terrarium, surfaceY }) {
  const { configuration, selection, selectObject, moveObject, rotateObject, scaleObject, removeObject } = useConfigurator()
  const { pickingSpot, setPickingSpot } = useSceneApi()
  const area = useMemo(() => getPlantingArea(terrarium), [terrarium])
  const plantScale = terrarium.plantScale ?? 1
  const obstacles = useMemo(() => getObstacles(configuration, terrarium), [configuration, terrarium])
  const [pickPreview, setPickPreview] = useState(null)
  const picking = Boolean(pickingSpot && selection?.instanceId === pickingSpot.instanceId)

  // Picking ends when another object (or nothing) is selected.
  useEffect(() => {
    if (pickingSpot && selection?.instanceId !== pickingSpot.instanceId) setPickingSpot(null)
  }, [pickingSpot, selection, setPickingSpot])
  useEffect(() => {
    if (!picking) {
      setPickPreview(null)
      setCursor('')
    }
  }, [picking])

  const pickedInstance = picking ? configuration[pickingSpot.categoryId].find((entry) => entry.instanceId === pickingSpot.instanceId) : null
  const pickedItem = pickedInstance && findItem(pickingSpot.categoryId, pickedInstance.id)
  const validatePick = (position) =>
    validatePlacement({
      terrarium,
      position,
      radius: getFootprint(pickedItem ?? {}, pickedInstance?.scale.x ?? 1, terrarium, pickedInstance?.instanceId),
      obstacles: getObstacles(configuration, terrarium, pickedInstance?.instanceId),
    }).valid

  return (
    <group>
      {picking && pickedInstance && (
        <SpotPicker
          area={area}
          surfaceY={surfaceY}
          validate={validatePick}
          onPreview={(preview) => {
            setPickPreview(preview)
            if (preview.valid && pickingSpot.blocked) setPickingSpot({ ...pickingSpot, blocked: false })
          }}
          onBlocked={() => setPickingSpot({ ...pickingSpot, blocked: true })}
          onPick={(position) => {
            moveObject(pickingSpot.categoryId, pickingSpot.instanceId, position)
            setPickingSpot(null)
          }}
        />
      )}
      {getAllInstances(configuration).map(({ categoryId, instance }) => {
        const item = findItem(categoryId, instance.id)
        if (!item) return null
        const radius = getFootprint(item, instance.scale.x, terrarium, instance.instanceId)
        const others = getObstacles(configuration, terrarium, instance.instanceId)
        return (
          <PlacedObject
            key={instance.instanceId}
            categoryId={categoryId}
            instance={instance}
            item={item}
            area={area}
            surfaceY={surfaceY}
            radius={radius}
            plantScale={plantScale}
            isSelected={selection?.instanceId === instance.instanceId}
            picking={picking}
            pickPreview={picking && pickingSpot.instanceId === instance.instanceId ? pickPreview : null}
            support={categoryId === 'plants' ? findClimbingSupport(configuration, terrarium, instance, item) : null}
            validateMove={(position) => validatePlacement({ terrarium, position, radius, obstacles: others }).valid}
            actions={{
              canGrow: canScaleObject(configuration, categoryId, instance, 1),
              canShrink: canScaleObject(configuration, categoryId, instance, -1),
              onSelect: () => selectObject(categoryId, instance.instanceId),
              onMove: (position) => moveObject(categoryId, instance.instanceId, position),
              onPickSpot: () => setPickingSpot({ categoryId, instanceId: instance.instanceId }),
              onRotate: (direction) => rotateObject(categoryId, instance.instanceId, direction),
              onScale: (direction) => scaleObject(categoryId, instance.instanceId, direction),
              onRemove: () => {
                removeObject(categoryId, instance.instanceId)
                setCursor('')
              },
            }}
          />
        )
      })}
      <DropPreview terrarium={terrarium} area={area} surfaceY={surfaceY} obstacles={obstacles} plantScale={plantScale} />
    </group>
  )
}
