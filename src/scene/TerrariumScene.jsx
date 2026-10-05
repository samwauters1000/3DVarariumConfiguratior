import { useRef, useState } from 'react'
import { NeutralToneMapping } from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import CameraControls from './CameraControls.jsx'
import SceneBridge from './SceneBridge.jsx'
import TerrariumModel from './terrariums/TerrariumModel.jsx'
import GroundLayers, { getSoilSurfaceY } from './GroundLayers.jsx'
import PlacementSystem from './PlacementSystem.jsx'
import Equipment from './equipment/Equipment.jsx'
import Workbench from './Workbench.jsx'
import DeskLamp from './DeskLamp.jsx'
import { CAMERA_SETTINGS, getCmPerUnit, getDefaultCameraPosition, getView } from './cameraSettings.js'
import { findGround, findTerrarium } from '../data/catalogue.js'
import { useConfigurator } from '../hooks/useConfigurator.jsx'
import { useSceneApi } from '../hooks/useSceneApi.jsx'
import { getGraphicsQuality, QUALITY_SETTINGS } from './graphicsQuality.js'

const CLICK_DRAG_TOLERANCE = 4

// Day: soft, warm studio light like 3DStylePlants.jpg (bright sky fill, warm key light from
// the front-left, cool rim light); the desk lamp is off. Night (DarkModeLamp.jpg): a dark
// grey-green room with only a very faint cool glow from a window. The desk lamp is on and
// lights the terrarium, so the background and the bench stay dark outside its light; the
// terrarium's own lights and glowing decoration stand out.
const LIGHTING = {
  day: {
    background: '#e8ebdf',
    ambient: 0.45,
    hemisphere: ['#fffaf0', '#c9cfb6', 1.15],
    key: { intensity: 1.45, color: '#fff4e2' },
    rim: { intensity: 0.45, color: '#e6f0ff' },
    environment: 1,
    ring: '#e3e8d8',
  },
  night: {
    background: '#232825',
    ambient: 0.04,
    hemisphere: ['#9aa59a', '#1f2420', 0.14],
    key: { intensity: 0.07, color: '#c8d2ff' },
    rim: { intensity: 0.1, color: '#aab6c8' },
    environment: 0.12,
    ring: '#8a9688',
  },
}

function Lighting({ shadowMapSize, mode }) {
  return (
    <>
      <ambientLight intensity={mode.ambient} />
      <hemisphereLight args={mode.hemisphere} />
      <directionalLight
        position={[-3, 6, 4]}
        intensity={mode.key.intensity}
        color={mode.key.color}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
      />
      <directionalLight position={[4, 3, -3]} intensity={mode.rim.intensity} color={mode.rim.color} />
      {/* Soft studio reflections for the glass, generated locally (no HDR download). */}
      <Environment resolution={256} frames={1} environmentIntensity={mode.environment}>
        <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 4, 1]} />
        <Lightformer intensity={1.2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer intensity={1.2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>
    </>
  )
}

// Every solid object casts and receives soft shadows (glass and helpers do not), so leaves
// shade each other and the soil, like the soft studio shadows in 3DStylePlants.jpg.
// The hidden originals of merged models (userData.mergeSource) are skipped, so this walk
// stays cheap even with many placed objects.
function setupShadows(object) {
  if (object.userData.mergeSource) return
  if (object.isMesh && !object.userData.shadowsSet) {
    const transparent = object.material?.transparent
    object.castShadow = !transparent && !object.userData.hideInCapture
    object.receiveShadow = !transparent
    object.userData.shadowsSet = true
  }
  for (const child of object.children) setupShadows(child)
}

function ShadowSetup() {
  useFrame(({ scene }) => setupShadows(scene))
  return null
}

// The terrarium stands on a wooden potting bench (3DWorkkbench.jpg), with the 360° ring
// from the layout moodboard on top of it.
function Floor({ ringRadius, cmPerUnit, shadowScale, mode }) {
  return (
    <>
      <Workbench cmPerUnit={cmPerUnit} />
      {/* The 360° ring from the layout moodboard. */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius, ringRadius + ringRadius * 0.014, 128]} />
        <meshBasicMaterial color={mode.ring} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={shadowScale} blur={2.4} far={2} resolution={512} />
    </>
  )
}

// If the browser drops the WebGL context (out of GPU memory, app switched on a tablet),
// restart the 3D view instead of leaving it blank. Gives up after a few quick failures and
// shows a message, so a device that cannot run the 3D at all is not stuck in a loop.
function useContextRecovery() {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const lostAt = useRef([])
  const onCreated = ({ gl }) => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      const now = Date.now()
      lostAt.current = [...lostAt.current.filter((time) => now - time < 30000), now]
      if (lostAt.current.length >= 3) setFailed(true)
      else setTimeout(() => setAttempt((value) => value + 1), 500)
    })
  }
  return { attempt, failed, onCreated }
}

export default function TerrariumScene() {
  const { configuration, clearSelection } = useConfigurator()
  const { controlsRef, nightMode } = useSceneApi()
  const mode = nightMode ? LIGHTING.night : LIGHTING.day
  const pointerDown = useRef({ x: 0, y: 0 })
  const terrarium = findTerrarium(configuration.terrarium)
  const ground = findGround(configuration.ground)
  const view = getView(terrarium)
  const quality = QUALITY_SETTINGS[getGraphicsQuality()]
  const { attempt, failed, onCreated } = useContextRecovery()

  if (failed) {
    return (
      <div className="stage__message" role="alert">
        <p className="stage__message-title">The 3D preview stopped working on this device</p>
        <p className="stage__message-text">You can keep configuring with the options panel. Reload the page to try the 3D preview again.</p>
      </div>
    )
  }

  return (
    <Canvas
      key={attempt}
      onCreated={onCreated}
      className="stage__canvas"
      frameloop="demand"
      dpr={quality.dpr}
      shadows="percentage"
      gl={{ antialias: quality.antialias, alpha: true, toneMapping: NeutralToneMapping, powerPreference: 'high-performance' }}
      camera={{ position: getDefaultCameraPosition(1.2), fov: CAMERA_SETTINGS.fov, near: 0.05, far: 60 }}
      onPointerDown={(event) => {
        pointerDown.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerMissed={(event) => {
        const moved = Math.hypot(event.clientX - pointerDown.current.x, event.clientY - pointerDown.current.y)
        if (moved <= CLICK_DRAG_TOLERANCE) clearSelection()
      }}
    >
      {/* Solid background (stage colour): see-through glass must blend with a real colour,
          otherwise it turns white once the depth effect is applied. */}
      <color attach="background" args={[mode.background]} />
      <Lighting shadowMapSize={quality.shadowMapSize} mode={mode} />
      <Floor ringRadius={view.ringRadius} cmPerUnit={getCmPerUnit(terrarium)} shadowScale={view.ringRadius * 3.3} mode={mode} />
      <DeskLamp cmPerUnit={getCmPerUnit(terrarium)} on={nightMode} />
      <CameraControls controlsRef={controlsRef} terrarium={terrarium} />
      <ShadowSetup />
      <SceneBridge terrarium={terrarium} />

      {terrarium && (
        <group>
          {ground && <GroundLayers terrarium={terrarium} ground={ground} />}
          {ground && <PlacementSystem terrarium={terrarium} surfaceY={getSoilSurfaceY(terrarium)} />}
          <TerrariumModel terrarium={terrarium} />
          <Equipment terrarium={terrarium} configuration={configuration} nightMode={nightMode} shadows={quality.ambientOcclusion} />
        </group>
      )}

      {/* Ambient occlusion: soft darkening where leaves, stems and soil meet. Desktop only:
          on phones and tablets the extra buffers can exhaust GPU memory. */}
      {quality.ambientOcclusion && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.16} distanceFalloff={0.6} intensity={1.6} quality="low" color="#1f2a1c" />
        </EffectComposer>
      )}
    </Canvas>
  )
}
