import Icon from '../common/Icon.jsx'

// Rotate / scale / delete for the selected object. Used in the 3D scene toolbar
// ("compact") and in the options panel ("panel") so the scene is not the only way in.
// Actions and permissions come in as props because the scene toolbar renders outside
// the app's context. `canGrow` is false at the size limit or when there is no room.
export default function ObjectControls({ item, canGrow, canShrink, onRotate, onScale, onRemove, onPickSpot, variant = 'panel' }) {
  const isCompact = variant === 'compact'
  const buttonClass = isCompact ? 'scene-toolbar__button' : 'object-controls__button'

  const actions = [
    // In the 3D toolbar: "Move" starts "Pick a new spot" (the panel has its own Move section).
    ...(isCompact && onPickSpot ? [{ icon: 'move', label: 'Move', onClick: onPickSpot, anim: 'pop' }, { divider: true }] : []),
    { icon: 'rotateLeft', label: 'Rotate left', onClick: () => onRotate(1), anim: 'swing-left' },
    { icon: 'rotateRight', label: 'Rotate right', onClick: () => onRotate(-1), anim: 'swing-right' },
    { divider: true },
    { icon: 'minus', label: 'Smaller', onClick: () => onScale(-1), disabled: !canShrink, anim: 'pop' },
    { icon: 'plus', label: 'Larger', onClick: () => onScale(1), disabled: !canGrow, anim: 'pop' },
    { divider: true },
    { icon: 'trash', label: 'Delete', onClick: onRemove, danger: true },
  ]

  return (
    <div className={isCompact ? 'scene-toolbar__actions' : 'object-controls'} role="group" aria-label={`${item.name} controls`}>
      {actions.map((action, index) =>
        action.divider ? (
          <span key={index} className={isCompact ? 'scene-toolbar__divider' : 'object-controls__divider'} aria-hidden="true" />
        ) : (
          <button
            key={action.label}
            type="button"
            className={`${buttonClass}${action.danger ? ` ${buttonClass}--danger` : ''}`}
            data-anim={action.anim}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={`${action.label} ${item.name}`}
            title={action.label}
          >
            <Icon name={action.icon} size={isCompact ? 16 : 18} />
            {!isCompact && <span>{action.label}</span>}
          </button>
        ),
      )}
    </div>
  )
}
