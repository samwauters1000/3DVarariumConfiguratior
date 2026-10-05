import { useMemo } from 'react'
import { DoubleSide } from 'three'

// The terrarium stands on a wooden potting bench (3DWorkkbench.jpg): a low-poly plank top
// with legs and a lower shelf, a few terracotta pots and a trowel. It has a fixed real size
// (150 × 90 cm top, 80 cm legs; pots 14 cm across), converted to the container's scene units
// (`cmPerUnit`), so every container stands on it at its real size: a tiny bottle looks tiny
// next to the pots, the 90 cm Panorama Tank takes up most of the bench.

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

export default function Workbench({ cmPerUnit }) {
  const cm = (value) => value / cmPerUnit
  const width = cm(150)
  const depth = cm(90)
  const thickness = cm(4)
  const planks = 7
  const legHeight = cm(80)
  const leg = cm(7)

  const planksTop = useMemo(
    () =>
      Array.from({ length: planks }, (_, index) => {
        const plankDepth = depth / planks
        return {
          z: -depth / 2 + plankDepth * (index + 0.5),
          depth: plankDepth - cm(0.3),
          color: WOOD[index % WOOD.length],
          // Tiny height differences between planks, like a well-used bench.
          y: -thickness / 2 - (index % 3) * cm(0.03),
        }
      }),
    [depth, thickness, cmPerUnit], // eslint-disable-line react-hooks/exhaustive-deps
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

      {/* Props, all outside the biggest container: a stack of pots at the back left and a
          trowel at the front right (the desk lamp stands at the back right). */}
      <group position={[cm(-62), 0, cm(-28)]}>
        <Pot position={[0, 0, 0]} radius={cm(7)} />
        <Pot position={[0, cm(5), 0]} radius={cm(7)} />
        <Pot position={[0, cm(10), 0]} radius={cm(7)} />
        <Pot position={[cm(-2), 0, cm(17)]} radius={cm(4.5)} />
      </group>
      {/* A 28 cm hand trowel. */}
      <Trowel position={[cm(60), 0, cm(16)]} rotationY={-0.9} size={cm(45)} />
    </group>
  )
}
