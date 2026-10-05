// Flattens a transparent PNG snapshot of the 3D view onto a background colour and
// returns a compact JPEG, optionally scaled down. Used for the PDF and saved designs.
export function flattenToJpeg({ src, width, height }, { maxWidth = 1200, background = '#f3f4ec', quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxWidth / width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const context = canvas.getContext('2d')
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve({ src: canvas.toDataURL('image/jpeg', quality), width: canvas.width, height: canvas.height })
    }
    image.onerror = reject
    image.src = src
  })
}
