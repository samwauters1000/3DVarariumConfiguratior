import { Component } from 'react'

// Keeps the rest of the configurator usable if WebGL or a model fails to load.
export default class SceneErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('3D preview failed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="stage__message" role="alert">
          <p className="stage__message-title">The 3D preview could not be loaded</p>
          <p className="stage__message-text">You can still configure your terrarium using the options panel.</p>
        </div>
      )
    }
    return this.props.children
  }
}
