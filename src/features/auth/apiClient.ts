import { createTokenStore } from './tokenStore'
import { isUser, isUserResponse } from './types'
import type { User } from './types'

const LOGIN_PATH = '/api/auth/login'
const REFRESH_PATH = '/api/auth/refresh'
const LOGOUT_PATH = '/api/auth/logout'
const ME_PATH = '/api/me'
const UNAUTHORIZED = 401
/** What "Expire access token now" swaps in: the server has never issued it. */
const INVALID_DEMO_TOKEN = 'expired-demo-token'

/** A response with a non-success status. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** The refresh token was rejected (or unreachable), so the user must log in. */
export class SessionExpiredError extends Error {
  constructor(options?: ErrorOptions) {
    super('Your session has expired.', options)
    this.name = 'SessionExpiredError'
  }
}

type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>

type ApiClientOptions = {
  readonly fetch?: FetchFunction
}

export type ApiClient = {
  /** `fetch` with the access token attached and silent recovery from a 401. */
  readonly authFetch: (path: string, init?: RequestInit) => Promise<Response>
  /** `authFetch` for JSON, validated with `isExpected`. */
  readonly getJson: <T>(
    path: string,
    isExpected: (value: unknown) => value is T,
    init?: RequestInit,
  ) => Promise<T>
  readonly login: (username: string, password: string) => Promise<User>
  readonly logout: () => Promise<void>
  /** Exchanges the refresh cookie for a session after a reload; null if none. */
  readonly restoreSession: () => Promise<User | null>
  /** Single-flight: concurrent callers share one refresh request. */
  readonly refreshAccessToken: () => Promise<string>
  /** Registers the handler for a failed refresh; returns an unsubscribe. */
  readonly onSessionExpired: (handler: () => void) => () => void
  /** How many refresh requests this client has sent, for the demo panel. */
  readonly getRefreshCount: () => number
  /** Demo only: replaces the access token with one the server will reject. */
  readonly invalidateAccessToken: () => void
}

function isTokenResponse(
  value: unknown,
): value is { readonly accessToken: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string'
  )
}

function isLoginResponse(
  value: unknown,
): value is { readonly accessToken: string; readonly user: User } {
  return isTokenResponse(value) && 'user' in value && isUser(value.user)
}

async function readJson<T>(
  response: Response,
  path: string,
  isExpected: (value: unknown) => value is T,
): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `${path} failed with status ${String(response.status)}`,
    )
  }
  const body: unknown = await response.json()
  if (!isExpected(body)) {
    throw new Error(`${path} returned an unexpected response`)
  }
  return body
}

export function createApiClient({
  fetch: fetchImpl = (input, init) => globalThis.fetch(input, init),
}: ApiClientOptions = {}): ApiClient {
  const tokens = createTokenStore()
  let refreshPromise: Promise<string> | null = null
  let restorePromise: Promise<User | null> | null = null
  let refreshCount = 0
  let sessionExpiredHandler: (() => void) | null = null

  function send(path: string, init: RequestInit, token: string | null) {
    const headers = new Headers(init.headers)
    if (token !== null) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetchImpl(path, { ...init, headers })
  }

  async function requestAccessToken(): Promise<string> {
    // The httpOnly refresh cookie rides along automatically (same origin).
    const response = await fetchImpl(REFRESH_PATH, {
      method: 'POST',
      credentials: 'same-origin',
    })
    const body = await readJson(response, REFRESH_PATH, isTokenResponse)
    return body.accessToken
  }

  async function runRefresh(shouldNotify: boolean): Promise<string> {
    refreshCount += 1
    try {
      const token = await requestAccessToken()
      tokens.set(token)
      return token
    } catch (error: unknown) {
      tokens.clear()
      // Inside the shared promise, so the handler runs once per failed
      // refresh no matter how many requests were waiting on it.
      if (shouldNotify) {
        sessionExpiredHandler?.()
      }
      throw new SessionExpiredError({ cause: error })
    } finally {
      refreshPromise = null
    }
  }

  function startOrJoinRefresh(shouldNotify: boolean): Promise<string> {
    refreshPromise ??= runRefresh(shouldNotify)
    return refreshPromise
  }

  function refreshAccessToken(): Promise<string> {
    return startOrJoinRefresh(true)
  }

  function getFreshToken(staleToken: string | null): Promise<string> {
    const current = tokens.get()
    // A slow request can get its 401 after another request already finished
    // refreshing; it reuses that token instead of refreshing a second time.
    if (current !== null && current !== staleToken) {
      return Promise.resolve(current)
    }
    return refreshAccessToken()
  }

  async function authFetch(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const sentToken = tokens.get()
    const response = await send(path, init, sentToken)
    if (response.status !== UNAUTHORIZED) {
      return response
    }
    const freshToken = await getFreshToken(sentToken)
    // Retried once only: a second 401 goes back to the caller, never a loop.
    return send(path, init, freshToken)
  }

  async function getJson<T>(
    path: string,
    isExpected: (value: unknown) => value is T,
    init: RequestInit = {},
  ): Promise<T> {
    return readJson(await authFetch(path, init), path, isExpected)
  }

  async function login(username: string, password: string): Promise<User> {
    const response = await fetchImpl(LOGIN_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const body = await readJson(response, LOGIN_PATH, isLoginResponse)
    tokens.set(body.accessToken)
    return body.user
  }

  async function logout(): Promise<void> {
    tokens.clear()
    try {
      await fetchImpl(LOGOUT_PATH, {
        method: 'POST',
        credentials: 'same-origin',
      })
    } catch (error: unknown) {
      // The user is logged out locally either way; the server-side refresh
      // token simply runs out on its own.
      console.warn('Could not reach the server to end the session.', error)
    }
  }

  async function runRestore(): Promise<User | null> {
    let token: string
    try {
      // Silent: having no session on load is normal, not an expiry.
      token = await startOrJoinRefresh(false)
    } catch (error: unknown) {
      if (error instanceof SessionExpiredError) {
        return null
      }
      throw error
    }
    const response = await send(ME_PATH, {}, token)
    if (response.status === UNAUTHORIZED) {
      tokens.clear()
      return null
    }
    const body = await readJson(response, ME_PATH, isUserResponse)
    return body.user
  }

  function restoreSession(): Promise<User | null> {
    // Shared so StrictMode's double-mount sends one restore, not two.
    restorePromise ??= runRestore().finally(() => {
      restorePromise = null
    })
    return restorePromise
  }

  function onSessionExpired(handler: () => void): () => void {
    sessionExpiredHandler = handler
    return () => {
      if (sessionExpiredHandler === handler) {
        sessionExpiredHandler = null
      }
    }
  }

  return {
    authFetch,
    getJson,
    login,
    logout,
    restoreSession,
    refreshAccessToken,
    onSessionExpired,
    getRefreshCount: () => refreshCount,
    invalidateAccessToken: () => {
      tokens.set(INVALID_DEMO_TOKEN)
    },
  }
}

/** The app-wide client. Tests create their own with a stubbed `fetch`. */
export const apiClient = createApiClient()
