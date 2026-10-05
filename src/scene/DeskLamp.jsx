import { useMemo } from 'react'
import { DoubleSide, Object3D, Quaternion, Vector3 } from 'three'

// A black architect's desk lamp (DarkModeLamp.jpg) always stands on the workbench, at one
// fixed spot at the back right: it does not move when another container is chosen. Like the
// bench, it has a fixed real size in cm, converted to the container's scene units
// (`cmPerUnit`). By day it is off; in night mode it is on and lights the terrarium you are
// building, while the rest of the room stays dark.

const UP = new Vector3(0, 1, 0)
const DOWN = new Vector3(0, -1, 0)
const BLACK = { color: '#1d201e', roughness: 0.45, metalness: 0.55 }
const LIGHT_COLOR = '#ffd9a6'

// Thin rod between two points.
function Rod({ from, to, radius }) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from)
    const end = new Vector3(...to)
    const direction = end.clone().sub(start)
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
      length: direction.length(),
    }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 6]} />
      <meshStandardMaterial {...BLACK} />
    </mesh>
  )
}

function Joint({ position, radius }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[radius, radius, radius * 1.4, 10]} />
      <meshStandardMaterial {...BLACK} />
    </mesh>
  )
}

export default function DeskLamp({ cmPerUnit, on }) {
  // A compact desk lamp, real sizes in cm: a 17 cm base, two arms of 25 and 30 cm, a 12 cm
  // wide shade, its head about 35 cm up.
  const cm = (value) => value / cmPerUnit
  const size = cm(38)
  const layout = useMemo(() => {
    const point = (x, y, z) => [cm(x), cm(y), cm(z)]
    // Base at the back right of the bench, just behind the biggest container (the 90 × 45 cm
    // Panorama Tank), so it stays in view next to smaller ones too. The head is just above the
    // tallest round container (32 cm) and behind it, aimed at the middle of the soil; behind
    // the big tank it shines in through the back glass.
    const base = point(36, 0, -36)
    const shoulder = point(36, 3, -36)
    const elbow = point(40, 26, -46)
    const head = point(14, 34, -32)
    const target = point(0, 8, 0)
    const direction = new Vector3(target[0] - head[0], target[1] - head[1], target[2] - head[2]).normalize()
    // The shade opens along -y, turned to face the terrarium.
    const shadeRotation = new Quaternion().setFromUnitVectors(DOWN, direction)
    // The light sits at the bulb, inside the shade.
    const bulbVector = direction.clone().multiplyScalar(0.2 * size).add(new Vector3(...head))
    const reach = bulbVector.distanceTo(new Vector3(...target))
    return { base, shoulder, elbow, head, target, shadeRotation, bulb: bulbVector.toArray(), reach }
  }, [cmPerUnit]) // eslint-disable-line react-hooks/exhaustive-deps

  const lightTarget = useMemo(() => new Object3D(), [])
  const offset = 0.02 * size

  return (
    <group>
      {/* Heavy round base */}
      <mesh position={[layout.base[0], 0.025 * size, layout.base[2]]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2 * size, 0.22 * size, 0.05 * size, 20]} />
        <meshStandardMaterial {...BLACK} />
      </mesh>
      {/* Double arms, like a real architect's lamp */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Rod from={[layout.shoulder[0], layout.shoulder[1], layout.shoulder[2] + side * offset]} to={[layout.elbow[0], layout.elbow[1], layout.elbow[2] + side * offset]} radius={0.011 * size} />
          <Rod from={[layout.elbow[0], layout.elbow[1], layout.elbow[2] + side * offset]} to={[layout.head[0], layout.head[1], layout.head[2] + side * offset]} radius={0.011 * size} />
        </group>
      ))}
      <Joint position={layout.shoulder} radius={0.03 * size} />
      <Joint position={layout.elbow} radius={0.035 * size} />
      <Joint position={layout.head} radius={0.03 * size} />

      {/* Shade with a bulb; the inside glows warm when the lamp is on */}
      <group position={layout.head} quaternion={layout.shadeRotation}>
        <mesh position={[0, -0.09 * size, 0]}>
          <cylinderGeometry args={[0.055 * size, 0.06 * size, 0.1 * size, 16]} />
          <meshStandardMaterial {...BLACK} />
        </mesh>
        <mesh position={[0, -0.2 * size, 0]} castShadow>
          <cylinderGeometry args={[0.06 * size, 0.16 * size, 0.14 * size, 20, 1, true]} />
          <meshStandardMaterial {...BLACK} side={DoubleSide} />
        </mesh>
        <mesh position={[0, -0.2 * size, 0]}>
          <cylinderGeometry args={[0.057 * size, 0.155 * size, 0.135 * size, 20, 1, true]} />
          {on ? (
            <meshStandardMaterial color="#fff1d6" emissive={LIGHT_COLOR} emissiveIntensity={1.6} side={DoubleSide} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#d8d4ca" roughness={0.6} side={DoubleSide} />
          )}
        </mesh>
        <mesh position={[0, -0.2 * size, 0]}>
          <sphereGeometry args={[0.045 * size, 12, 10]} />
          {on ? (
            <meshStandardMaterial color="#fff8ea" emissive={LIGHT_COLOR} emissiveIntensity={3} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#f2efe8" roughness={0.2} />
          )}
        </mesh>
      </group>

      {on && (
        <>
          <primitive object={lightTarget} position={layout.target} />
          {/* Wide, very soft edge (penumbra 1), so the light fades out on the bench instead of
              ending in a hard circle. No shadows: they drew hard dark lines across the soil.
              The strength follows the distance in scene units, so every container gets the same
              amount of light. */}
          <spotLight
            position={layout.bulb}
            target={lightTarget}
            color={LIGHT_COLOR}
            intensity={9 * (layout.reach / 2.4) ** 1.3}
            angle={0.75}
            penumbra={1}
            distance={layout.reach * 3}
            decay={1.3}
          />
        </>
      )}
    </group>
  )
}
