import { useMemo } from 'react'
import { AdditiveBlending, CanvasTexture, CatmullRomCurve3, DoubleSide, Quaternion, SphereGeometry, Vector3 } from 'three'
import { findLid, getLights } from '../../data/equipment.js'
import { getLightSpots, getPlantingArea } from '../../rules/placementRules.js'
import { getSoilSurfaceY } from '../GroundLayers.jsx'
import { brassMaterialProps, glassMaterialProps, GLASS_RENDER_ORDER } from '../materials.js'

// Lid and lights from "Lid & light", modelled on real vivarium equipment.
// - Lids sit on the rim of open containers (terrarium `top`).
// - Lights sit inside the glass (terrarium `lightMount`): hung from the top of a dome or
//   prism, fixed flush under the ceiling of the tank, or hung from a brass rod across an
//   open bowl. LED bar, LED puck, UVB tube (next to the bar) and a small moonlight LED.
// - On the soil: a glowing mushroom cluster at its fixed spot, and fairy lights draped in
//   loops around the edge.
// Every light adds real light to the scene with a soft glow around the source: subtle by
// day, strong in night mode, where the day light also casts soft shadows (capable devices)
// and shows a faint beam. The moonlight LED is only on at night.

const LID_THICKNESS = 0.028
const UP = new Vector3(0, 1, 0)

const meshMaterialProps = { color: '#4a4c48', roughness: 0.6, metalness: 0.5, transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false }
const lampBodyProps = { color: '#2f3530', roughness: 0.45, metalness: 0.4 }

const glowMaterial = (color, nightMode, day = 1.1, night = 2.6) => ({ color, emissive: color, emissiveIntensity: nightMode ? night : day, toneMapped: false })

// ---------- Lid ----------

function LidShape({ top, inset = 1 }) {
  return top.shape === 'box' ? (
    <boxGeometry args={[top.width * inset, LID_THICKNESS, top.depth * inset]} />
  ) : (
    <cylinderGeometry args={[top.radius * inset, top.radius * inset, LID_THICKNESS, 48]} />
  )
}

// Four thin bars around a rectangular lid.
function BoxFrame({ width, depth }) {
  const bar = 0.035
  const bars = [
    [[0, 0, depth / 2], [width + bar, bar, bar]],
    [[0, 0, -depth / 2], [width + bar, bar, bar]],
    [[width / 2, 0, 0], [bar, bar, depth]],
    [[-width / 2, 0, 0], [bar, bar, depth]],
  ]
  return bars.map(([position, size], index) => (
    <mesh key={index} position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial {...lampBodyProps} flatShading />
    </mesh>
  ))
}

function Lid({ lid, top }) {
  const y = top.y + LID_THICKNESS / 2
  if (lid.ventilated) {
    // Mesh lid: see-through dark mesh with a solid metal frame.
    return (
      <group position={[0, y, 0]}>
        <mesh renderOrder={GLASS_RENDER_ORDER}>
          <LidShape top={top} inset={0.97} />
          <meshStandardMaterial {...meshMaterialProps} />
        </mesh>
        {top.shape === 'box' ? (
          <BoxFrame width={top.width} depth={top.depth} />
        ) : (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[top.radius, 0.022, 8, 48]} />
            <meshStandardMaterial {...lampBodyProps} flatShading />
          </mesh>
        )}
      </group>
    )
  }
  // Glass lid with a small brass knob.
  return (
    <group position={[0, y, 0]}>
      <mesh renderOrder={GLASS_RENDER_ORDER}>
        <LidShape top={top} inset={1.02} />
        <meshPhysicalMaterial {...glassMaterialProps} opacity={0.1} clearcoat={0.1} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, LID_THICKNESS / 2 + 0.03, 0]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial {...brassMaterialProps} flatShading />
      </mesh>
    </group>
  )
}

// ---------- Glow ----------

// Soft round glow texture, shared by every halo.
let haloTexture = null
function getHaloTexture() {
  if (haloTexture || typeof document === 'undefined') return haloTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  haloTexture = new CanvasTexture(canvas)
  return haloTexture
}

// Glow around a light source, like a real bulb seen through slightly misty glass.
// Strong at night, faint by day.
function Halo({ position, size, color, nightMode, day = 0.18, night = 0.85 }) {
  return (
    <sprite position={position} scale={[size, size, size]} renderOrder={GLASS_RENDER_ORDER + 1}>
      <spriteMaterial map={getHaloTexture()} color={color} opacity={nightMode ? night : day} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </sprite>
  )
}

// Faint beam of light under a lamp, only visible in the dark (humid air in a terrarium
// scatters a little light).
function LightBeam({ y, height, topRadius, bottomRadius, color, nightMode }) {
  if (!nightMode) return null
  return (
    <mesh position={[0, y - height / 2, 0]} renderOrder={GLASS_RENDER_ORDER + 1}>
      <cylinderGeometry args={[topRadius, bottomRadius, height, 24, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.05} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

// Spot light shining down, optionally with soft shadows (night mode on capable devices).
function DownLight({ position, color, intensity, angle, distance, castShadow }) {
  return (
    <spotLight
      position={position}
      color={color}
      intensity={intensity}
      angle={angle}
      penumbra={0.85}
      distance={distance}
      decay={1.4}
      castShadow={castShadow}
      shadow-mapSize={[512, 512]}
      shadow-bias={-0.0006}
      shadow-normalBias={0.02}
      shadow-radius={5}
    />
  )
}

// ---------- Fixtures ----------

// Thin cable (or rod) between two points.
function Cable({ from, to, radius = 0.006, material = { color: '#2f3530', roughness: 0.8 } }) {
  const [fx, fy, fz] = from
  const [tx, ty, tz] = to
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(fx, fy, fz)
    const end = new Vector3(tx, ty, tz)
    const direction = end.clone().sub(start)
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    }
  }, [fx, fy, fz, tx, ty, tz])
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 5]} />
      <meshStandardMaterial {...material} />
    </mesh>
  )
}

// Hangers for a bar: short brackets up to a flat ceiling or a rod across an open rim, or two
// cables meeting at the top of a dome or prism.
function BarHangers({ half, y, z = 0, mount }) {
  return mount.flush || mount.rod ? (
    <>
      <Cable from={[-half, y, z]} to={[-half, mount.ceilingY, z]} radius={0.008} />
      <Cable from={[half, y, z]} to={[half, mount.ceilingY, z]} radius={0.008} />
    </>
  ) : (
    <>
      <Cable from={[-half, y, z]} to={[0, mount.ceilingY, 0]} />
      <Cable from={[half, y, z]} to={[0, mount.ceilingY, 0]} />
    </>
  )
}

// Full-spectrum LED bar at its real length: slim aluminium profile (1.2 × 2.4 cm) with a row of
// LEDs behind a diffuser.
function BarLamp({ light, mount, cm, nightMode, intensity, castShadow }) {
  const { barY } = mount
  const length = cm(light.sizeCm)
  const ledCount = Math.max(4, Math.round(light.sizeCm / 3))
  return (
    <group>
      <group position={[0, barY, 0]}>
        <mesh>
          <boxGeometry args={[length, cm(1.2), cm(2.4)]} />
          <meshStandardMaterial color="#b9bdb9" roughness={0.35} metalness={0.8} flatShading />
        </mesh>
        <mesh position={[0, -cm(0.65), 0]}>
          <boxGeometry args={[length * 0.95, cm(0.15), cm(1.6)]} />
          <meshStandardMaterial {...glowMaterial(light.color, nightMode, 1.4, 3)} />
        </mesh>
        {Array.from({ length: ledCount }, (_, index) => (
          <Halo
            key={index}
            position={[(index / (ledCount - 1) - 0.5) * length * 0.9, -cm(0.9), 0]}
            size={cm(3)}
            color={light.color}
            nightMode={nightMode}
            day={0.12}
            night={0.55}
          />
        ))}
      </group>
      <BarHangers half={length * 0.4} y={barY} mount={mount} />
      <LightBeam y={barY - cm(1.2)} height={barY * 0.8} topRadius={length * 0.35} bottomRadius={length * 0.6} color={light.color} nightMode={nightMode} />
      <DownLight position={[0, barY - cm(1.6), 0]} color={light.color} intensity={intensity} angle={1.1} distance={barY + 1} castShadow={castShadow} />
    </group>
  )
}

// UVB T5 tube (Ø 1.6 cm) at its real length, in a reflector, 6 cm beside the LED bar.
function UvbLamp({ light, mount, cm, nightMode, intensity }) {
  const { barY } = mount
  const length = cm(light.sizeCm)
  const z = cm(6)
  return (
    <group>
      <group position={[0, barY, z]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, cm(0.5), 0]}>
          <cylinderGeometry args={[cm(1.8), cm(1.8), length, 12, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#d9dcd9" roughness={0.2} metalness={0.95} side={DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[cm(0.8), cm(0.8), length * 0.96, 10]} />
          <meshStandardMaterial {...glowMaterial(light.color, nightMode, 1.3, 2.6)} />
        </mesh>
        <Halo position={[0, -cm(0.4), 0]} size={length * 0.5} color="#b8a8ff" nightMode={nightMode} day={0.08} night={0.35} />
      </group>
      <BarHangers half={length * 0.4} y={barY} z={z} mount={mount} />
      <DownLight position={[0, barY - cm(1.2), z]} color={light.color} intensity={intensity} angle={0.9} distance={barY + 0.8} />
    </group>
  )
}

// Rod across the rim of an open bowl, to hang lights from.
function Rod({ mount }) {
  return <Cable from={[-mount.rod / 2, mount.ceilingY, 0]} to={[mount.rod / 2, mount.ceilingY, 0]} radius={0.014} material={brassMaterialProps} />
}

// Round, flat LED puck at its real size (Ø 7 cm, 1.2 cm thick), fixed under the top.
function PuckLamp({ light, mount, cm, nightMode, intensity, castShadow }) {
  const { puckY, ceilingY } = mount
  const radius = cm(light.sizeCm / 2)
  return (
    <group>
      <group position={[0, puckY, 0]}>
        <mesh>
          <cylinderGeometry args={[radius * 0.92, radius, cm(1.2), 20]} />
          <meshStandardMaterial color="#e8e9e4" roughness={0.4} metalness={0.3} flatShading />
        </mesh>
        <mesh position={[0, -cm(0.62), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.8, 20]} />
          <meshStandardMaterial {...glowMaterial(light.color, nightMode, 1.4, 3)} side={DoubleSide} />
        </mesh>
        <Halo position={[0, -cm(1), 0]} size={radius * 2.4} color={light.color} nightMode={nightMode} day={0.14} night={0.6} />
      </group>
      <Cable from={[0, puckY + cm(0.6), 0]} to={[0, ceilingY, 0]} radius={0.008} />
      <LightBeam y={puckY - cm(1)} height={puckY * 0.75} topRadius={radius * 0.8} bottomRadius={radius * 4.5} color={light.color} nightMode={nightMode} />
      <DownLight position={[0, puckY - cm(1.4), 0]} color={light.color} intensity={intensity} angle={1.15} distance={puckY + 1} castShadow={castShadow} />
    </group>
  )
}

// Tiny Ø 2 cm blue moonlight LED, beside the day light (or centred in a narrow neck).
// Off during the day, on in night mode.
function MoonLamp({ light, mount, cm, room, nightMode, intensity }) {
  const { puckY, ceilingY, rod } = mount
  const radius = cm(light.sizeCm / 2)
  // Beside a puck when there is room for both; centred in narrow spaces like a bottle neck.
  const x = rod ? cm(9) : room >= 11 ? cm(6) : 0
  const y = rod ? ceilingY - cm(3) : puckY - cm(0.6)
  return (
    <group>
      <group position={[x, y, 0]}>
        <mesh>
          <cylinderGeometry args={[radius, radius * 1.1, cm(0.8), 12]} />
          <meshStandardMaterial color="#2f3530" roughness={0.5} />
        </mesh>
        <mesh position={[0, -cm(0.42), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.75, 12]} />
          {nightMode ? <meshStandardMaterial {...glowMaterial(light.color, true, 0, 3)} side={DoubleSide} /> : <meshStandardMaterial color="#c9d2e8" roughness={0.3} side={DoubleSide} />}
        </mesh>
        {nightMode && <Halo position={[0, -cm(0.6), 0]} size={radius * 7} color={light.color} nightMode />}
      </group>
      <Cable from={[x, y + cm(0.4), 0]} to={[rod ? x : 0, ceilingY, 0]} radius={0.004} />
      {nightMode && <pointLight position={[x, y - cm(1.5), 0]} color={light.color} intensity={intensity} distance={(puckY ?? ceilingY) + 0.6} decay={1.5} />}
    </group>
  )
}

// Cork LED: one tiny LED bulb (about 5 mm) under a bottle's cork; the Ø 2.5 cm housing is
// hidden inside the cork itself.
function CorkLamp({ light, mount, cm, nightMode, intensity }) {
  const y = mount.ceilingY - cm(0.2)
  return (
    <group position={[0, y, 0]}>
      <mesh scale={[1, 0.8, 1]}>
        <sphereGeometry args={[cm(0.25), 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial {...glowMaterial(light.color, nightMode, 1.6, 3.4)} side={DoubleSide} />
      </mesh>
      <Halo position={[0, -cm(0.3), 0]} size={cm(2.2)} color={light.color} nightMode={nightMode} day={0.12} night={0.55} />
      <DownLight position={[0, -cm(0.6), 0]} color={light.color} intensity={intensity} angle={0.9} distance={mount.ceilingY + 0.5} />
    </group>
  )
}

// ---------- Special lights ----------

// Mushroom cluster, about 0.2 units wide at scale 1 (scaled to its real 6 cm).
const MUSHROOM_CLUSTER_WIDTH = 0.2
const MUSHROOMS = [
  // [x, z, height, cap radius]
  [0, 0, 0.16, 0.065],
  [0.07, 0.04, 0.1, 0.045],
  [-0.05, 0.06, 0.07, 0.035],
  [0.02, -0.07, 0.12, 0.05],
]

function MushroomLamp({ light, world, surfaceY, cm, nightMode, intensity }) {
  const scale = cm(light.sizeCm) / MUSHROOM_CLUSTER_WIDTH
  return (
    <group position={[world.x, surfaceY, world.z]} scale={scale}>
      {MUSHROOMS.map(([x, z, height, cap], index) => (
        <group key={index} position={[x, 0, z]} rotation={[(index % 2 ? 1 : -1) * 0.12, index, (index % 3 ? -1 : 1) * 0.1]}>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[cap * 0.28, cap * 0.38, height, 7]} />
            <meshStandardMaterial color="#f1efe2" roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0, height, 0]} scale={[1, 0.62, 1]}>
            <sphereGeometry args={[cap, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial {...glowMaterial(light.color, nightMode, 0.7, 2.2)} flatShading />
          </mesh>
          <Halo position={[0, height + cap * 0.3, 0]} size={cap * 5} color={light.color} nightMode={nightMode} day={0.1} night={0.6} />
        </group>
      ))}
      <pointLight position={[0, 0.2, 0]} color={light.color} intensity={intensity} distance={1.2 * scale} decay={1.6} />
    </group>
  )
}

// Loop around the planting area, draped in scallops between higher "hooks" (1–3.5 cm above
// the soil).
function getFairyPath(area, surfaceY, cm) {
  const points = []
  const scallops = area.shape === 'rect' ? 12 : 8
  const steps = 160
  for (let index = 0; index < steps; index++) {
    const t = (index / steps) * Math.PI * 2
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    // Rounded rectangle (superellipse) or circle, just inside the edge of the soil.
    const shape = area.shape === 'rect' ? (value) => Math.sign(value) * Math.abs(value) ** 0.2 : (value) => value
    const x = shape(cos) * area.halfX * 0.88
    const z = shape(sin) * area.halfZ * 0.86
    const y = surfaceY + cm(3.5) - cm(2.5) * Math.abs(Math.sin((t * scallops) / 2))
    points.push(new Vector3(x, y, z))
  }
  return new CatmullRomCurve3(points, true)
}

const BULB_GEOMETRY = new SphereGeometry(1, 8, 6)

// Real micro-LED fairy lights: 2.5 mm bulbs about every 4 cm on a thin copper wire.
function FairyLights({ light, area, surfaceY, cm, nightMode, intensity }) {
  const curve = useMemo(() => getFairyPath(area, surfaceY, cm), [area, surfaceY, cm])
  const bulbCount = Math.min(60, Math.max(12, Math.round(curve.getLength() / cm(4))))
  const bulbs = useMemo(() => Array.from({ length: bulbCount }, (_, index) => curve.getPointAt(index / bulbCount)), [curve, bulbCount])
  const glowSpots = useMemo(() => [0, 0.33, 0.66].map((at) => curve.getPointAt(at)), [curve])
  const bulbSize = cm(0.125)
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 320, cm(0.04), 4, true]} />
        <meshStandardMaterial color="#3a4a2e" roughness={0.7} />
      </mesh>
      {bulbs.map((point, index) => (
        <group key={index} position={point}>
          <mesh geometry={BULB_GEOMETRY} scale={bulbSize}>
            <meshStandardMaterial {...glowMaterial(light.color, nightMode, 1.4, 3.2)} />
          </mesh>
          <Halo position={[0, 0, 0]} size={cm(1.6)} color={light.color} nightMode={nightMode} day={0.12} night={0.6} />
        </group>
      ))}
      {glowSpots.map((point, index) => (
        <pointLight key={index} position={[point.x * 0.9, point.y + cm(1.5), point.z * 0.9]} color={light.color} intensity={intensity} distance={cm(30)} decay={1.8} />
      ))}
    </group>
  )
}

// ---------- All equipment ----------

export default function Equipment({ terrarium, configuration, nightMode, shadows = false }) {
  const lid = terrarium.lidable ? findLid(configuration.lid) : null
  const lights = getLights(configuration.lights)
  const area = useMemo(() => getPlantingArea(terrarium), [terrarium])
  const surfaceY = getSoilSurfaceY(terrarium)
  const plantScale = terrarium.plantScale ?? 1
  const spots = getLightSpots(configuration, terrarium)
  // Real sizes: centimetres to scene units for this container.
  const cmPerUnit = terrarium.cmPerUnit ?? 13
  const cm = useMemo(() => (value) => value / cmPerUnit, [cmPerUnit])
  // Small containers get weaker special lights, so their glass does not flood with light.
  const strength = (light) => light.intensity * (nightMode ? 2.2 : 0.6) * (light.kind === 'special' ? plantScale ** 2 : 1)

  const mount = terrarium.lightMount
  const needsRod = mount?.rod && lights.some((light) => ['bar', 'uvb', 'puck', 'moon'].includes(light.style))

  return (
    <group>
      {lid && terrarium.top && <Lid lid={lid} top={terrarium.top} />}
      {needsRod && <Rod mount={mount} />}
      {lights.map((light) => {
        const props = { light, cm, nightMode, intensity: strength(light) }
        // Only the day light casts shadows, and only at night (one extra shadow map).
        const castShadow = shadows && nightMode
        if (!mount) return null
        if (light.style === 'bar' && mount.barY) return <BarLamp key={light.id} {...props} mount={mount} castShadow={castShadow} />
        if (light.style === 'uvb' && mount.barY) return <UvbLamp key={light.id} {...props} mount={mount} />
        if (light.style === 'puck' && mount.puckY) return <PuckLamp key={light.id} {...props} mount={mount} castShadow={castShadow} />
        if (light.style === 'moon' && mount.puckY) return <MoonLamp key={light.id} {...props} mount={mount} room={terrarium.lightSpace?.puck ?? 0} />
        if (light.style === 'cork') return <CorkLamp key={light.id} {...props} mount={mount} />
        if (light.style === 'mushroom') {
          const spot = spots.find((entry) => entry.light.id === light.id)
          return spot ? <MushroomLamp key={light.id} {...props} world={spot.world} surfaceY={surfaceY} /> : null
        }
        if (light.style === 'fairy') return <FairyLights key={light.id} {...props} area={area} surfaceY={surfaceY} />
        return null
      })}
    </group>
  )
}
