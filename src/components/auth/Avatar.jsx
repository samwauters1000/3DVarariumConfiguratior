import { useState } from 'react'
import { getAvatarImage, getInitials } from '../../hooks/useAuth.jsx'

// Round avatar for an avatar setting: a picture (a 3D plant, an uploaded photo or the
// Google picture) or the initials on the primary colour.
export default function Avatar({ name, avatar, googlePicture, size = 'medium' }) {
  const image = getAvatarImage(avatar, googlePicture)
  const [brokenImage, setBrokenImage] = useState(null)
  const showImage = image && brokenImage !== image
  return (
    <span className={`avatar avatar--${size}${avatar?.kind === 'plant' ? ' avatar--plant' : ''}`} aria-hidden="true">
      {showImage ? <img src={image} alt="" referrerPolicy="no-referrer" onError={() => setBrokenImage(image)} /> : <span>{getInitials(name)}</span>}
    </span>
  )
}
