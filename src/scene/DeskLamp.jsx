import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide, Object3D, Quaternion, Vector3 } from 'three'

// Night mode (DarkModeLamp.jpg): a black architect's desk lamp stands on the workbench and
// shines a warm light onto the terrarium, like working on it late in the evening. Placed
// behind-left of the container and sized to it.

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

export default function DeskLamp({ ringRadius, topY, targetY, castShadow }) {
  const size = Math.min(1.1, Math.max(0.45, ringRadius * 0.6))
  const layout = useMemo(() => {
    const base = [-ringRadius * 1.3, 0, -ringRadius * 0.8]
    const shoulder = [base[0], 0.08 * size, base[2]]
    // Head just above and beside the container top, so the whole lamp stays in view.
    const elbow = [base[0] - ringRadius * 0.12, topY * 0.5 + 0.45 * size, base[2] - ringRadius * 0.1]
    const head = [-ringRadius * 0.8, topY + 0.22 * size, -ringRadius * 0.5]
    const target = [0, targetY, 0]
    const direction = new Vector3(target[0] - head[0], target[1] - head[1], target[2] - head[2]).normalize()
    // The shade opens along -y, turned to face the terrarium.
    const shadeRotation = new Quaternion().setFromUnitVectors(DOWN, direction)
    return { base, shoulder, elbow, head, target, shadeRotation }
  }, [ringRadius, topY, targetY, size])

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
          <Rod from={[layout.shoulder[0] + side * offset, layout.shoulder[1], layout.shoulder[2]]} to={[layout.elbow[0] + side * offset, layout.elbow[1], layout.elbow[2]]} radius={0.011 * size} />
          <Rod from={[layout.elbow[0] + side * offset, layout.elbow[1], layout.elbow[2]]} to={[layout.head[0] + side * offset, layout.head[1], layout.head[2]]} radius={0.011 * size} />
        </group>
      ))}
      <Joint position={layout.shoulder} radius={0.03 * size} />
      <Joint position={layout.elbow} radius={0.035 * size} />
      <Joint position={layout.head} radius={0.03 * size} />

      {/* Shade with a warm glowing inside and bulb */}
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
          <meshStandardMaterial color="#fff1d6" emissive={LIGHT_COLOR} emissiveIntensity={1.6} side={DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.2 * size, 0]}>
          <sphereGeometry args={[0.045 * size, 12, 10]} />
          <meshStandardMaterial color="#fff8ea" emissive={LIGHT_COLOR} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        {/* Soft glow at the opening */}
        <mesh position={[0, -0.27 * size, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2 * size, 20]} />
          <meshBasicMaterial color={LIGHT_COLOR} transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <primitive object={lightTarget} position={layout.target} />
      <spotLight
        position={layout.head}
        target={lightTarget}
        color={LIGHT_COLOR}
        intensity={9 * size}
        angle={0.55}
        penumbra={0.7}
        distance={ringRadius * 6}
        decay={1.3}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={6}
      />
    </group>
  )
}
