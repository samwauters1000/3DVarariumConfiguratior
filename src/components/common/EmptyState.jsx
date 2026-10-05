import Icon from './Icon.jsx'

export default function EmptyState({ icon, title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <p className="empty-state__title">{title}</p>
      {children && <p className="empty-state__text">{children}</p>}
    </div>
  )
}
