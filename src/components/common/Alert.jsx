import Icon from './Icon.jsx'

export default function Alert({ tone = 'info', children }) {
  return (
    <p className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name="info" size={18} />
      <span>{children}</span>
    </p>
  )
}
