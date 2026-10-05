import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { reportModelError } from '../../hooks/useModelErrors.js'

// Uses the real .glb model when the file exists, and the simple placeholder otherwise.
//
// Model conventions (for when the final assets are added to public/models/):
// - one object per file, origin at the centre of its base (where it touches the soil)
// - scene units: 1 unit ≈ 14 cm, same scale as the placeholders
// - facing +Z; keep files small (compressed textures, low poly counts for mobile)

// Whether each model file exists. Checked once per URL with a light HEAD request.
const availability = new Map()

function checkModel(url) {
  if (!availability.has(url)) {
    const request = fetch(url, { method: 'HEAD' })
      .then((response) => {
        const type = response.headers.get('content-type') ?? ''
        // Dev servers may answer unknown paths with the HTML page instead of a 404.
        return response.ok && !type.includes('text/html')
      })
      .catch(() => false)
    availability.set(url, request)
  }
  return availability.get(url)
}

function useModelAvailable(url) {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let active = true
    if (url) checkModel(url).then((result) => active && setAvailable(result))
    return () => {
      active = false
    }
  }, [url])
  return available
}

// Falls back to the placeholder if the model file is broken.
class ModelErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    reportModelError(this.props.url, error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function GltfModel({ url }) {
  const { scene } = useGLTF(url)
  // Each placed object needs its own copy of the model.
  const copy = useMemo(() => scene.clone(true), [scene])
  return <primitive object={copy} />
}

// `modelScale` only applies to the real model (placeholders size themselves).
export default function ModelWithFallback({ url, placeholder, modelScale = 1 }) {
  const available = useModelAvailable(url)
  if (!available) return placeholder

  return (
    <ModelErrorBoundary url={url} fallback={placeholder}>
      <Suspense fallback={placeholder}>
        <group scale={modelScale}>
          <GltfModel url={url} />
        </group>
      </Suspense>
    </ModelErrorBoundary>
  )
}
