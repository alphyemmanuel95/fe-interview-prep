export const AUTH_ROUTES = {
  home: '/q5',
  login: '/q5/login',
  orders: '/q5/orders',
  admin: '/q5/admin',
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Where to go after signing in: the page the user was sent away from (as
 * recorded by RequireAuth), or the dashboard. Only Q5 pages are accepted, so
 * navigation state can never redirect elsewhere.
 */
export function getRedirectTarget(state: unknown): string {
  if (!isRecord(state) || !isRecord(state.from)) {
    return AUTH_ROUTES.home
  }
  const pathname = readString(state.from, 'pathname')
  const isQ5Page =
    pathname === AUTH_ROUTES.home || pathname.startsWith(`${AUTH_ROUTES.home}/`)
  if (!isQ5Page || pathname === AUTH_ROUTES.login) {
    return AUTH_ROUTES.home
  }
  return `${pathname}${readString(state.from, 'search')}${readString(state.from, 'hash')}`
}
