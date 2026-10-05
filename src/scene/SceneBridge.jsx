import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useSceneApi } from '../hooks/useSceneApi.jsx'
import { getCameraTarget, getDefaultCameraPosition, getCaptureView } from './cameraSettings.js'

// Registers a snapshot function so the summary and PDF can show the finished terrarium.
// The snapshot uses a tight framing of the terrarium (getCaptureView), or the current view
// with keepView (for "Save picture"), and hides editing helpers.
export default function SceneBridge({ terrarium }) {
  const { gl, scene, camera } = useThree()
  const { captureRef } = useSceneApi()

  useEffect(() => {
    const view = getCaptureView(terrarium)
    captureRef.current = ({ keepView = false } = {}) => {
      const hidden = []
      scene.traverse((object) => {
        if (object.userData.hideInCapture && object.visible) {
          object.visible = false
          hidden.push(object)
        }
      })

      const savedPosition = camera.position.clone()
      const savedQuaternion = camera.quaternion.clone()
      if (!keepView) {
        camera.position.set(...getDefaultCameraPosition(camera.aspect, view))
        camera.lookAt(...getCameraTarget(view))
      }

      gl.render(scene, camera)
      const image = gl.domElement.toDataURL('image/png')

      camera.position.copy(savedPosition)
      camera.quaternion.copy(savedQuaternion)
      hidden.forEach((object) => {
        object.visible = true
      })
      gl.render(scene, camera)

      return { src: image, width: gl.domElement.width, height: gl.domElement.height }
    }
    return () => {
      captureRef.current = null
    }
  }, [gl, scene, camera, captureRef, terrarium])

  return null
}
