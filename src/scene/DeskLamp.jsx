import { useMemo } from 'react'
import { DoubleSide, Object3D, Quaternion, Vector3 } from 'three'

// A black architect's desk lamp (DarkModeLamp.jpg) always stands on the workbench, at one
// fixed spot at the back right: it does not move when another container is chosen. Like the
// bench, it is sized to the camera view (`ringRadius`), so it looks the same next to every
// container. By day it is off; in night mode it is on and lights the terrarium you are
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

export default function DeskLamp({ ringRadius: r, on }) {
  const size = r * 0.45
  const layout = useMemo(() => {
    // Base in the back-right corner of the bench, arms up and back, head just outside the
    // 360° ring (so it never touches a container) and aimed at the middle of the terrarium.
    const base = [r * 1.25, 0, -r * 1.1]
    const shoulder = [base[0], 0.08 * size, base[2]]
    const elbow = [r * 1.35, r * 0.8, -r * 1.3]
    const head = [r * 0.85, r * 1.05, -r * 0.85]
    const target = [0, r * 0.25, 0]
    const direction = new Vector3(target[0] - head[0], target[1] - head[1], target[2] - head[2]).normalize()
    // The shade opens along -y, turned to face the terrarium.
    const shadeRotation = new Quaternion().setFromUnitVectors(DOWN, direction)
    // The light sits at the bulb, inside the shade.
    const bulb = direction.clone().multiplyScalar(0.2 * size).add(new Vector3(...head)).toArray()
    return { base, shoulder, elbow, head, target, shadeRotation, bulb }
  }, [r, size])

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
              Stronger for bigger views, so every container gets the same amount of light. */}
          <spotLight
            position={layout.bulb}
            target={lightTarget}
            color={LIGHT_COLOR}
            intensity={9 * (r / 1.5) ** 1.3}
            angle={0.62}
            penumbra={1}
            distance={r * 5}
            decay={1.3}
          />
        </>
      )}
    </group>
  )
}
