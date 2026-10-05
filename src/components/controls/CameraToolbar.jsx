import Icon from '../common/Icon.jsx'

// Bottom camera controls. They drive the same camera as direct mouse/touch input.
export default function CameraToolbar({ onRotateLeft, onRotateRight, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="camera-toolbar" role="toolbar" aria-label="Camera controls">
      <button type="button" className="camera-toolbar__button" data-anim="swing-left" onClick={onRotateLeft} aria-label="Rotate left" title="Rotate left">
        <Icon name="rotateLeft" />
      </button>
      <button type="button" className="camera-toolbar__button" data-anim="swing-right" onClick={onRotateRight} aria-label="Rotate right" title="Rotate right">
        <Icon name="rotateRight" />
      </button>
      <span className="camera-toolbar__divider" aria-hidden="true" />
      <button type="button" className="camera-toolbar__button" data-anim="pop" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
        <Icon name="minus" />
      </button>
      <button type="button" className="camera-toolbar__button" data-anim="pop" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
        <Icon name="plus" />
      </button>
      <span className="camera-toolbar__divider" aria-hidden="true" />
      <button
        type="button"
        className="camera-toolbar__button camera-toolbar__button--label"
        data-anim="spin"
        onClick={onReset}
        aria-label="Reset view"
        title="Reset view"
      >
        <Icon name="reset" />
        <span>Reset</span>
      </button>
    </div>
  )
}
