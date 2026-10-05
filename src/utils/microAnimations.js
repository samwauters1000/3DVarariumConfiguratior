// Micro-animations: small, purposeful motion when a control is used, so the icon "acts out"
// what the button does (Start over spins back, undo / redo nudge, rotate swings, zoom pops).
//
// Add `data-anim="<name>"` to a button; every click (or tap) replays the animation by
// setting the `data-anim-playing` attribute. (An attribute instead of a class: React
// rewrites `className` when a button changes state, e.g. the day / night toggle, which would
// cut the animation short.) The animations themselves are in styles/motion.css and are
// switched off for people who prefer reduced motion.

const PLAYING = 'data-anim-playing'

function play(element) {
  element.removeAttribute(PLAYING)
  // Force a reflow so the same animation can play again on a quick second click.
  void element.offsetWidth
  element.setAttribute(PLAYING, '')
  // Safety net in case `animationend` does not fire (reduced motion, element replaced). It
  // starts on the next frame, so slow work right after the click (like taking a picture)
  // does not cut the animation short.
  clearTimeout(element.animTimer)
  requestAnimationFrame(() => {
    element.animTimer = setTimeout(() => element.removeAttribute(PLAYING), 1200)
  })
}

let installed = false

export function installMicroAnimations() {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-anim]') : null
      if (target) play(target)
    },
    true,
  )
  document.addEventListener('animationend', (event) => {
    const target = event.target instanceof Element ? event.target.closest(`[${PLAYING}]`) : null
    if (target) target.removeAttribute(PLAYING)
  })
}

// A short white flash over the 3D view, like a camera shutter ("Save picture").
export function flashStage() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const stage = document.querySelector('.stage')
  if (!stage) return
  const flash = document.createElement('div')
  flash.className = 'stage__flash'
  stage.appendChild(flash)
  setTimeout(() => flash.remove(), 450)
}
