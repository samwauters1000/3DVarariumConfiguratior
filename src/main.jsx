import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/care.css'
import './styles/glass.css'
import './styles/move.css'
import './styles/motion.css'
import './styles/auth.css'
import { installMicroAnimations } from './utils/microAnimations.js'

installMicroAnimations()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
