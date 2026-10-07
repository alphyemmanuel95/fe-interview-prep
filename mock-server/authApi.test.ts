import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  createAuthApi,
} from './authApi.ts'
import type { ApiResponse, AuthApi } from './authApi.ts'

const ONE_SECOND_MS = 1000

function readAccessToken(response: ApiResponse): string {
  const body = response.json
  if (
    typeof body !== 'object' ||
    body === null ||
    !('accessToken' in body) ||
    typeof body.accessToken !== 'string'
  ) {
    throw new Error('Expected an access token in the response')
  }
  return body.accessToken
}

/** Turns a `Set-Cookie` header into the `Cookie` header a browser would send. */
function toCookieHeader(response: ApiResponse): string {
  const pair = response.setCookie?.split(';')[0]
  if (pair === undefined) {
    throw new Error('Expected the response to set a cookie')
  }
  return pair
}

describe('createAuthApi', () => {
  let clock: number
  let api: AuthApi

  beforeEach(() => {
    clock = 0
    api = createAuthApi({ now: () => clock })
  })

  function logIn(username: string, password: string): ApiResponse {
    return api.handle({
      method: 'POST',
      path: '/api/auth/login',
      body: { username, password },
    })
  }

  function get(path: string, accessToken: string): ApiResponse {
    return api.handle({
      method: 'GET',
      path,
      authorization: `Bearer ${accessToken}`,
    })
  }

  function refresh(cookie: string): ApiResponse {
    return api.handle({ method: 'POST', path: '/api/auth/refresh', cookie })
  }

  it('logs in with valid credentials and returns the user', () => {
    const response = logIn('alice', 'password123')

    expect(response.status).toBe(200)
    expect(response.json).toMatchObject({
      expiresIn: 30,
      user: { username: 'alice', role: 'user' },
    })
  })

  it('sets the refresh token as an HttpOnly, SameSite=Strict cookie scoped to /api/auth', () => {
    const cookie = logIn('alice', 'password123').setCookie ?? ''

    expect(cookie).toMatch(/^refresh_token=[\w-]+;/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/api/auth')
    expect(cookie).toContain('Max-Age=600')
  })

  it('rejects wrong credentials and malformed bodies', () => {
    expect(logIn('alice', 'wrong').status).toBe(401)
    expect(logIn('nobody', 'password123').status).toBe(401)
    expect(
      api.handle({ method: 'POST', path: '/api/auth/login', body: 'nope' })
        .status,
    ).toBe(400)
  })

  it('accepts an access token for 30 seconds only', () => {
    const accessToken = readAccessToken(logIn('alice', 'password123'))

    clock = ACCESS_TOKEN_TTL_MS - ONE_SECOND_MS
    expect(get('/api/me', accessToken).status).toBe(200)

    clock = ACCESS_TOKEN_TTL_MS + ONE_SECOND_MS
    expect(get('/api/me', accessToken).status).toBe(401)
  })

  it('rejects requests without a valid bearer token', () => {
    expect(api.handle({ method: 'GET', path: '/api/orders' }).status).toBe(401)
    expect(get('/api/orders', 'made-up-token').status).toBe(401)
  })

  it('issues new access tokens until the refresh token expires after 10 minutes', () => {
    const cookie = toCookieHeader(logIn('alice', 'password123'))

    clock = REFRESH_TOKEN_TTL_MS - ONE_SECOND_MS
    const refreshed = refresh(cookie)
    expect(refreshed.status).toBe(200)
    expect(get('/api/me', readAccessToken(refreshed)).status).toBe(200)

    clock = REFRESH_TOKEN_TTL_MS + ONE_SECOND_MS
    const expired = refresh(cookie)
    expect(expired.status).toBe(401)
    expect(expired.setCookie).toContain('Max-Age=0')
  })

  it('rejects a refresh without a cookie', () => {
    expect(
      api.handle({ method: 'POST', path: '/api/auth/refresh' }).status,
    ).toBe(401)
  })

  it('invalidates the session on logout', () => {
    const login = logIn('alice', 'password123')
    const cookie = toCookieHeader(login)

    const logout = api.handle({
      method: 'POST',
      path: '/api/auth/logout',
      cookie,
    })

    expect(logout.status).toBe(204)
    expect(logout.setCookie).toContain('Max-Age=0')
    expect(refresh(cookie).status).toBe(401)
    expect(get('/api/me', readAccessToken(login)).status).toBe(401)
  })

  it('returns orders for the signed-in user', () => {
    const accessToken = readAccessToken(logIn('alice', 'password123'))

    const response = get('/api/orders', accessToken)

    expect(response.status).toBe(200)
    expect(response.json).toMatchObject({
      orders: [{ id: 'ORD-1001' }, { id: 'ORD-1002' }, { id: 'ORD-1003' }],
    })
  })

  it('serves admin stats to admins only', () => {
    const aliceToken = readAccessToken(logIn('alice', 'password123'))
    const adminToken = readAccessToken(logIn('admin', 'admin123'))

    expect(get('/api/admin/stats', aliceToken).status).toBe(403)
    const response = get('/api/admin/stats', adminToken)
    expect(response.status).toBe(200)
    expect(response.json).toMatchObject({
      stats: { totalUsers: 2, activeSessions: 2 },
    })
  })

  it('returns 404 for unknown routes', () => {
    expect(api.handle({ method: 'GET', path: '/api/nope' }).status).toBe(404)
  })
})
