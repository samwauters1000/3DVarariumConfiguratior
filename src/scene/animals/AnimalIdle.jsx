import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { seedFromString } from '../plants/variation.js'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'

// Small idle movement that makes an animal feel alive (no simulation): the frog breathes,
// the gecko looks around, the snail sways, isopods wiggle, springtails and spiders hop.
// Every animal starts at its own moment in the cycle. Off when the user prefers reduced
// motion. While animals move, the scene keeps rendering; otherwise it renders on demand.

const MOVES = {
  breathe: (group, t) => {
    const breath = Math.sin(t * 3)
    group.scale.set(1 - breath * 0.02, 1 + breath * 0.05, 1 - breath * 0.02)
  },
  look: (group, t) => {
    group.rotation.y = Math.sin(t * 0.6) * 0.3 + Math.sin(t * 1.7) * 0.05
  },
  sway: (group, t) => {
    group.rotation.z = Math.sin(t * 1.1) * 0.04
    group.position.z = Math.sin(t * 0.4) * 0.006
  },
  wiggle: (group, t) => {
    group.rotation.y = Math.sin(t * 2.2) * 0.12
  },
  hop: (group, t) => {
    // Short hop every few seconds.
    group.position.y = Math.pow(Math.max(0, Math.sin(t * 1.6)), 12) * 0.025
  },
}

export default function AnimalIdle({ type, seed, children }) {
  const groupRef = useRef(null)
  const invalidate = useThree((state) => state.invalidate)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const offset = useMemo(() => (seedFromString(`${seed}:idle`) % 1000) / 100, [seed])
  const move = MOVES[type]
  const isMoving = Boolean(move) && !reducedMotion

  // Start the render loop (the scene otherwise only renders when something changes).
  useEffect(() => {
    if (isMoving) invalidate()
  }, [isMoving, invalidate])

  useFrame(({ clock }) => {
    if (!isMoving || !groupRef.current) return
    move(groupRef.current, clock.elapsedTime + offset)
    invalidate()
  })

  return <group ref={groupRef}>{children}</group>
}
