import { useMemo } from 'react'
import { DoubleSide } from 'three'

// The terrarium stands on a wooden potting bench (3DWorkkbench.jpg): a low-poly plank top
// with legs and a lower shelf, and a few terracotta pots and a trowel at the back. Sized to
// the container (`ringRadius` of its camera view), so small and large containers both sit
// nicely on it.

const WOOD = ['#9a7452', '#8f6b4b', '#a47d59', '#937050', '#9d7654']
const TERRACOTTA = '#c4693f'
const TERRACOTTA_DARK = '#a95733'

function Plank({ position, size, color }) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} flatShading />
    </mesh>
  )
}

// Tapered terracotta pot with a thick rim, open at the top.
function Pot({ position, radius, rotation = [0, 0, 0] }) {
  const height = radius * 1.05
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.72, height, 10, 1, true]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.9} flatShading side={DoubleSide} />
      </mesh>
      <mesh position={[0, height - radius * 0.08, 0]} castShadow>
        <cylinderGeometry args={[radius * 1.1, radius * 1.06, radius * 0.22, 10, 1, true]} />
        <meshStandardMaterial color={TERRACOTTA_DARK} roughness={0.9} flatShading side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.72, 10]} />
        <meshStandardMaterial color={TERRACOTTA_DARK} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function Trowel({ position, rotationY, size }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={size}>
      {/* Blade */}
      <mesh position={[0, 0.02, 0.22]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.18]} castShadow>
        <coneGeometry args={[0.12, 0.34, 4]} />
        <meshStandardMaterial color="#9ea3a0" roughness={0.35} metalness={0.8} flatShading />
      </mesh>
      {/* Neck and wooden handle */}
      <mesh position={[0, 0.035, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
        <meshStandardMaterial color="#7d817e" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.035, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.22, 7]} />
        <meshStandardMaterial color="#b0875d" roughness={0.8} flatShading />
      </mesh>
    </group>
  )
}

export default function Workbench({ ringRadius }) {
  const width = ringRadius * 3.8
  const depth = ringRadius * 2.7
  const thickness = Math.max(0.06, ringRadius * 0.07)
  const planks = 7
  const legHeight = ringRadius * 2.2
  const leg = ringRadius * 0.12

  const planksTop = useMemo(
    () =>
      Array.from({ length: planks }, (_, index) => {
        const plankDepth = depth / planks
        return {
          z: -depth / 2 + plankDepth * (index + 0.5),
          depth: plankDepth - ringRadius * 0.012,
          color: WOOD[index % WOOD.length],
          // Tiny height differences between planks, like a well-used bench.
          y: -thickness / 2 - (index % 3) * ringRadius * 0.0015,
        }
      }),
    [depth, ringRadius, thickness],
  )

  const legX = width / 2 - leg * 1.2
  const legZ = depth / 2 - leg * 1.2

  return (
    <group>
      {planksTop.map((plank, index) => (
        <Plank key={index} position={[0, plank.y, plank.z]} size={[width, thickness, plank.depth]} color={plank.color} />
      ))}
      {/* Apron under the top, legs and a lower shelf. */}
      <Plank position={[0, -thickness - leg * 0.6, depth / 2 - leg]} size={[width - leg * 2, leg * 1.2, leg * 0.4]} color="#86634a" />
      <Plank position={[0, -thickness - leg * 0.6, -depth / 2 + leg]} size={[width - leg * 2, leg * 1.2, leg * 0.4]} color="#86634a" />
      {[
        [legX, legZ],
        [-legX, legZ],
        [legX, -legZ],
        [-legX, -legZ],
      ].map(([x, z], index) => (
        <Plank key={`leg-${index}`} position={[x, -thickness - legHeight / 2, z]} size={[leg, legHeight, leg]} color="#7c5b43" />
      ))}
      {Array.from({ length: 4 }, (_, index) => (
        <Plank
          key={`shelf-${index}`}
          position={[0, -thickness - legHeight * 0.78, -depth * 0.3 + index * depth * 0.2]}
          size={[width - leg * 2.6, thickness * 0.8, depth * 0.18]}
          color={WOOD[(index + 2) % WOOD.length]}
        />
      ))}

      {/* Props at the back: a stack of pots, a small pot and a trowel. */}
      <group position={[-width * 0.38, 0, -depth * 0.3]}>
        <Pot position={[0, 0, 0]} radius={ringRadius * 0.14} />
        <Pot position={[0, ringRadius * 0.1, 0]} radius={ringRadius * 0.14} />
        <Pot position={[0, ringRadius * 0.2, 0]} radius={ringRadius * 0.14} />
        <Pot position={[ringRadius * 0.3, 0, ringRadius * 0.12]} radius={ringRadius * 0.09} />
      </group>
      <Trowel position={[width * 0.36, 0, -depth * 0.26]} rotationY={-0.7} size={ringRadius * 0.55} />
    </group>
  )
}
