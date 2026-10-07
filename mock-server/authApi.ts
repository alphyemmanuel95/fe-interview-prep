import { randomUUID } from 'node:crypto'

/**
 * A framework-agnostic mock auth backend for Q5. It keeps all state in memory
 * and takes an injectable clock so tests can jump past token expiry instead
 * of waiting for it.
 */

export const ACCESS_TOKEN_TTL_MS = 30_000
export const REFRESH_TOKEN_TTL_MS = 600_000
const REFRESH_COOKIE_NAME = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'
const MS_PER_SECOND = 1000

type Role = 'user' | 'admin'

type User = {
  readonly username: string
  readonly name: string
  readonly email: string
  readonly role: Role
}

type Account = {
  readonly user: User
  readonly password: string
}

type OrderStatus = 'processing' | 'shipped' | 'delivered'

type Order = {
  readonly id: string
  readonly item: string
  readonly total: number
  readonly status: OrderStatus
  readonly placedAt: string
}

/** A server-side record behind an opaque token. */
type TokenRecord = {
  readonly username: string
  readonly expiresAt: number
}

type AccessTokenRecord = TokenRecord & {
  /** The refresh token this access token was issued under, for logout. */
  readonly refreshToken: string
}

export type ApiRequest = {
  readonly method: string
  readonly path: string
  readonly authorization?: string
  readonly cookie?: string
  readonly body?: unknown
}

export type ApiResponse = {
  readonly status: number
  readonly json?: unknown
  readonly setCookie?: string
}

export type AuthApi = {
  readonly handle: (request: ApiRequest) => ApiResponse
}

type AuthApiOptions = {
  readonly now?: () => number
}

const ACCOUNTS: readonly Account[] = [
  {
    user: {
      username: 'alice',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'user',
    },
    password: 'password123',
  },
  {
    user: {
      username: 'admin',
      name: 'Ada Admin',
      email: 'admin@example.com',
      role: 'admin',
    },
    password: 'admin123',
  },
]

const ORDERS: Readonly<Record<string, readonly Order[]>> = {
  alice: [
    {
      id: 'ORD-1001',
      item: 'Noise-cancelling headphones',
      total: 199.99,
      status: 'delivered',
      placedAt: '2026-09-02',
    },
    {
      id: 'ORD-1002',
      item: 'Mechanical keyboard',
      total: 129.5,
      status: 'shipped',
      placedAt: '2026-09-21',
    },
    {
      id: 'ORD-1003',
      item: 'USB-C hub',
      total: 39,
      status: 'processing',
      placedAt: '2026-10-05',
    },
  ],
  admin: [
    {
      id: 'ORD-2001',
      item: 'Standing desk',
      total: 499,
      status: 'delivered',
      placedAt: '2026-08-14',
    },
    {
      id: 'ORD-2002',
      item: 'Ergonomic chair',
      total: 349.99,
      status: 'processing',
      placedAt: '2026-10-01',
    },
  ],
}

function json(status: number, body: unknown): ApiResponse {
  return { status, json: body }
}

function error(status: number, message: string): ApiResponse {
  return json(status, { error: message })
}

function refreshCookie(token: string, maxAgeSeconds: number): string {
  // Production would add `Secure`; it is left out so plain http://localhost works.
  return `${REFRESH_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=${REFRESH_COOKIE_PATH}; Max-Age=${String(maxAgeSeconds)}`
}

const CLEARED_REFRESH_COOKIE = refreshCookie('', 0)

/** Reads one cookie from a `Cookie` request header. */
function readCookie(header: string | undefined, name: string): string | null {
  if (header === undefined) {
    return null
  }
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=')
    if (separator !== -1 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim()
    }
  }
  return null
}

function readBearerToken(header: string | undefined): string | null {
  const prefix = 'Bearer '
  if (header?.startsWith(prefix) !== true) {
    return null
  }
  return header.slice(prefix.length)
}

function isCredentials(
  value: unknown,
): value is { readonly username: string; readonly password: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'username' in value &&
    typeof value.username === 'string' &&
    'password' in value &&
    typeof value.password === 'string'
  )
}

function findAccount(username: string): Account | undefined {
  return ACCOUNTS.find((account) => account.user.username === username)
}

export function createAuthApi({
  now = Date.now,
}: AuthApiOptions = {}): AuthApi {
  const accessTokens = new Map<string, AccessTokenRecord>()
  const refreshTokens = new Map<string, TokenRecord>()

  /** Looks a token up, forgetting it if it has expired. */
  function lookUp<T extends TokenRecord>(
    tokens: Map<string, T>,
    token: string | null,
  ): T | null {
    if (token === null) {
      return null
    }
    const record = tokens.get(token)
    if (record === undefined) {
      return null
    }
    if (now() >= record.expiresAt) {
      tokens.delete(token)
      return null
    }
    return record
  }

  function issueAccessToken(username: string, refreshToken: string) {
    const accessToken = randomUUID()
    accessTokens.set(accessToken, {
      username,
      refreshToken,
      expiresAt: now() + ACCESS_TOKEN_TTL_MS,
    })
    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_MS / MS_PER_SECOND,
    }
  }

  function countActiveSessions(): number {
    return [...refreshTokens.keys()].filter(
      (token) => lookUp(refreshTokens, token) !== null,
    ).length
  }

  function login(body: unknown): ApiResponse {
    if (!isCredentials(body)) {
      return error(400, 'Username and password are required.')
    }
    const account = findAccount(body.username)
    if (account?.password !== body.password) {
      return error(401, 'Incorrect username or password.')
    }
    const refreshToken = randomUUID()
    refreshTokens.set(refreshToken, {
      username: account.user.username,
      expiresAt: now() + REFRESH_TOKEN_TTL_MS,
    })
    return {
      status: 200,
      json: {
        ...issueAccessToken(account.user.username, refreshToken),
        user: account.user,
      },
      setCookie: refreshCookie(
        refreshToken,
        REFRESH_TOKEN_TTL_MS / MS_PER_SECOND,
      ),
    }
  }

  function refresh(cookie: string | undefined): ApiResponse {
    const refreshToken = readCookie(cookie, REFRESH_COOKIE_NAME)
    const record = lookUp(refreshTokens, refreshToken)
    if (refreshToken === null || record === null) {
      return {
        ...error(401, 'Your session has expired.'),
        setCookie: CLEARED_REFRESH_COOKIE,
      }
    }
    // Not rotated, to keep the mock small. Production would issue a new refresh
    // token on every use and revoke the old one to detect token theft.
    return json(200, issueAccessToken(record.username, refreshToken))
  }

  function logout(cookie: string | undefined): ApiResponse {
    const refreshToken = readCookie(cookie, REFRESH_COOKIE_NAME)
    if (refreshToken !== null) {
      refreshTokens.delete(refreshToken)
      for (const [accessToken, record] of accessTokens) {
        if (record.refreshToken === refreshToken) {
          accessTokens.delete(accessToken)
        }
      }
    }
    return { status: 204, setCookie: CLEARED_REFRESH_COOKIE }
  }

  function authenticate(authorization: string | undefined): User | null {
    const record = lookUp(accessTokens, readBearerToken(authorization))
    if (record === null) {
      return null
    }
    return findAccount(record.username)?.user ?? null
  }

  function adminStats(): ApiResponse {
    const orders = Object.values(ORDERS).flat()
    const revenue = orders.reduce((sum, order) => sum + order.total, 0)
    return json(200, {
      stats: {
        totalUsers: ACCOUNTS.length,
        totalOrders: orders.length,
        revenue: Math.round(revenue * 100) / 100,
        activeSessions: countActiveSessions(),
      },
    })
  }

  function handleProtected(request: ApiRequest, route: string): ApiResponse {
    const user = authenticate(request.authorization)
    if (user === null) {
      return error(401, 'Access token is missing or has expired.')
    }
    switch (route) {
      case 'GET /api/me':
        return json(200, { user })
      case 'GET /api/orders':
        return json(200, { orders: ORDERS[user.username] ?? [] })
      case 'GET /api/admin/stats':
        if (user.role !== 'admin') {
          return error(403, 'Admins only.')
        }
        return adminStats()
      default:
        return error(404, 'Not found.')
    }
  }

  function handle(request: ApiRequest): ApiResponse {
    const route = `${request.method.toUpperCase()} ${request.path}`
    switch (route) {
      case 'POST /api/auth/login':
        return login(request.body)
      case 'POST /api/auth/refresh':
        return refresh(request.cookie)
      case 'POST /api/auth/logout':
        return logout(request.cookie)
      case 'GET /api/me':
      case 'GET /api/orders':
      case 'GET /api/admin/stats':
        return handleProtected(request, route)
      default:
        return error(404, 'Not found.')
    }
  }

  return { handle }
}
