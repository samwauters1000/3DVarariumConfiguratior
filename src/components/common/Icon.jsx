// Simple stroke icons on a 24×24 grid.
const paths = {
  terrarium: (
    <>
      <path d="M6 18V11a6 6 0 0 1 12 0v7" />
      <path d="M4 18h16v2H4z" />
      <path d="M12 5V3" />
    </>
  ),
  ground: (
    <>
      <path d="M3 9l9-4 9 4-9 4-9-4z" />
      <path d="M3 13l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </>
  ),
  plant: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 7z" />
      <path d="M12 15c0-3-2.5-5.5-7-5.5 0 4 2.5 6 7 5.5z" />
    </>
  ),
  decoration: (
    <>
      <path d="M4 17c0-4 3-8 7-8 5 0 9 3 9 7 0 2-1 3-3 3H6c-1.2 0-2-.8-2-2z" />
      <path d="M9 13c1-1 2.5-1.5 4-1" />
    </>
  ),
  animal: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="12" cy="6.5" r="1.8" />
      <circle cx="17" cy="9" r="1.8" />
      <path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 1.7-1.3 2.5-2.5 2L12 18.5 10.5 19C9.3 19.5 8 18.7 8 17z" />
    </>
  ),
  rotateLeft: (
    <>
      <path d="M4 4v5h5" />
      <path d="M4.5 9A8 8 0 1 1 6 17" />
    </>
  ),
  rotateRight: (
    <>
      <path d="M20 4v5h-5" />
      <path d="M19.5 9A8 8 0 1 0 18 17" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  reset: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  redo: (
    <>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h7V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7 10.5l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  move: (
    <>
      <path d="M12 3v18M3 12h18" />
      <path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  lamp: (
    <>
      <path d="M12 3v4" />
      <path d="M6 13a6 6 0 0 1 12 0z" />
      <path d="M10 16.5a2 2 0 0 0 4 0" />
      <path d="M5 20l1.5-1.5M19 20l-1.5-1.5M12 21v-1" />
    </>
  ),
  lid: (
    <>
      <path d="M3 9h18v3H3z" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 6h4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      <circle cx="12" cy="12" r="6.6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5" />
      <path d="M7 9.5l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  signOut: (
    <>
      <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
}

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
