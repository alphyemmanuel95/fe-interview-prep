const ICON_PATHS = {
  plus: 'M12 5v14M5 12h14',
  pencil:
    'M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.5 18.79l-4 1 1-4 11.362-11.303Z',
  trash:
    'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  check: 'm5 12 5 5L20 7',
  clipboard:
    'M9 5h6M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 0h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1m0 7 2 2 4-4',
} as const

type IconProps = {
  readonly name: keyof typeof ICON_PATHS
  readonly className?: string
}

/** Decorative stroke icon; always hidden from assistive technology. */
export function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
