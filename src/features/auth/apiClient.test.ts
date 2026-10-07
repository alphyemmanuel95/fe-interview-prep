import { describe, expect, it, vi } from 'vitest'
import { ApiError, SessionExpiredError, createApiClient } from './apiClient'

const REFRESH_PATH = '/api/auth/refresh'
const EXPIRED_TOKEN = 'expired-token'
const FRESH_TOKEN = 'fresh-token'

const ALICE = {
  username: 'alice',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'user',
}

type SentRequest = {
  readonly path: string
  readonly authorization: string | null
}

type HeldRequest = {
  readonly path: string
  readonly release: () => void
}

/**
 * A stand-in for the backend. Only FRESH_TOKEN is accepted, so a client that
 * logged in (and got EXPIRED_TOKEN) behaves as if its token just expired.
 * Refresh responses wait until the test settles them, which keeps the
 * refresh "in flight" for as long as the test needs.
 */
function createFakeBackend() {
  const sent: SentRequest[] = []
  const pendingRefreshes: ((response: Response) => void)[] = []
  const heldPaths = new Set<string>()
  const held: HeldRequest[] = []

  function respond(path: string, authorization: string | null): Response {
    if (path === '/api/forbidden') {
      return Response.json({ error: 'Admins only.' }, { status: 403 })
    }
    if (
      path === '/api/always-401' ||
      authorization !== `Bearer ${FRESH_TOKEN}`
    ) {
      return Response.json({ error: 'Expired' }, { status: 401 })
    }
    if (path === '/api/me') {
      return Response.json({ user: ALICE })
    }
    return Response.json({ path })
  }

  const fetchMock = vi.fn((path: string, init?: RequestInit) => {
    const authorization = new Headers(init?.headers).get('Authorization')
    sent.push({ path, authorization })
    if (path === '/api/auth/login') {
      return Promise.resolve(
        Response.json({ accessToken: EXPIRED_TOKEN, user: ALICE }),
      )
    }
    if (path === REFRESH_PATH) {
      return new Promise<Response>((resolve) => {
        pendingRefreshes.push(resolve)
      })
    }
    // Holding is one-shot, so a retry of the same path answers immediately.
    if (heldPaths.delete(path)) {
      return new Promise<Response>((resolve) => {
        held.push({
          path,
          release: () => {
            resolve(respond(path, authorization))
          },
        })
      })
    }
    return Promise.resolve(respond(path, authorization))
  })

  function settleRefresh(response: Response) {
    const resolve = pendingRefreshes.shift()
    if (resolve === undefined) {
      throw new Error('No refresh request is waiting for a response')
    }
    resolve(response)
  }

  return {
    fetchMock,
    sent,
    holdNextResponseFor: (path: string) => {
      heldPaths.add(path)
    },
    releaseHeld: (path: string) => {
      const request = held.find((candidate) => candidate.path === path)
      if (request === undefined) {
        throw new Error(`No held request for ${path}`)
      }
      request.release()
    },
    refreshCalls: () => sent.filter(({ path }) => path === REFRESH_PATH),
    callsTo: (path: string) => sent.filter((request) => request.path === path),
    grantFreshToken: () => {
      settleRefresh(Response.json({ accessToken: FRESH_TOKEN, expiresIn: 30 }))
    },
    rejectRefresh: () => {
      settleRefresh(Response.json({ error: 'Expired' }, { status: 401 }))
    },
  }
}

async function setUp() {
  const backend = createFakeBackend()
  const client = createApiClient({ fetch: backend.fetchMock })
  const onSessionExpired = vi.fn()
  client.onSessionExpired(onSessionExpired)
  await client.login('alice', 'password123')
  return { backend, client, onSessionExpired }
}

/** Lets every pending promise callback run, so in-flight work reaches its next await. */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

describe('createApiClient', () => {
  it('makes exactly one refresh call when three requests fail at once', async () => {
    const { backend, client } = await setUp()

    const responses = Promise.all([
      client.authFetch('/api/me'),
      client.authFetch('/api/orders'),
      client.authFetch('/api/admin/stats'),
    ])
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    backend.grantFreshToken()

    const results = await responses
    expect(results.map((response) => response.status)).toEqual([200, 200, 200])
    expect(backend.refreshCalls()).toHaveLength(1)
    expect(client.getRefreshCount()).toBe(1)
    for (const path of ['/api/me', '/api/orders', '/api/admin/stats']) {
      expect(backend.callsTo(path).map((call) => call.authorization)).toEqual([
        `Bearer ${EXPIRED_TOKEN}`,
        `Bearer ${FRESH_TOKEN}`,
      ])
    }
  })

  it('lets a request that fails mid-refresh join the refresh in flight', async () => {
    const { backend, client } = await setUp()

    const first = Promise.all([
      client.authFetch('/api/me'),
      client.authFetch('/api/orders'),
      client.authFetch('/api/admin/stats'),
    ])
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    const late = client.authFetch('/api/orders?page=2')
    await flushPromises()
    backend.grantFreshToken()

    const results = await Promise.all([first, late])
    expect(results.flat().every((response) => response.ok)).toBe(true)
    expect(backend.refreshCalls()).toHaveLength(1)
  })

  it('reuses a token refreshed while a slow request was still in flight', async () => {
    const { backend, client } = await setUp()
    backend.holdNextResponseFor('/api/slow')

    const slow = client.authFetch('/api/slow')
    const fast = client.authFetch('/api/me')
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    backend.grantFreshToken()
    await fast
    backend.releaseHeld('/api/slow')

    expect((await slow).status).toBe(200)
    expect(backend.refreshCalls()).toHaveLength(1)
  })

  it('logs out once and rejects every waiting request when the refresh fails', async () => {
    const { backend, client, onSessionExpired } = await setUp()

    const results = Promise.allSettled([
      client.authFetch('/api/me'),
      client.authFetch('/api/orders'),
      client.authFetch('/api/admin/stats'),
    ])
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    backend.rejectRefresh()

    const settled = await results
    for (const result of settled) {
      expect(result.status).toBe('rejected')
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(SessionExpiredError)
      }
    }
    expect(onSessionExpired).toHaveBeenCalledTimes(1)

    // The token is gone, so the next request goes out without one.
    void client.authFetch('/api/me').catch(() => undefined)
    await vi.waitFor(() => {
      expect(backend.callsTo('/api/me').at(-1)?.authorization).toBeNull()
    })
  })

  it('does not retry or refresh on a 403', async () => {
    const { backend, client } = await setUp()

    const response = await client.authFetch('/api/forbidden')

    expect(response.status).toBe(403)
    expect(backend.callsTo('/api/forbidden')).toHaveLength(1)
    expect(backend.refreshCalls()).toHaveLength(0)
  })

  it('retries only once when the retried request is also rejected', async () => {
    const { backend, client } = await setUp()

    const pending = client.getJson('/api/always-401', (value) => value !== null)
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    backend.grantFreshToken()

    await expect(pending).rejects.toBeInstanceOf(ApiError)
    expect(backend.callsTo('/api/always-401')).toHaveLength(2)
    expect(backend.refreshCalls()).toHaveLength(1)
  })

  it('restores a session from the refresh cookie without reporting expiry', async () => {
    const backend = createFakeBackend()
    const client = createApiClient({ fetch: backend.fetchMock })
    const onSessionExpired = vi.fn()
    client.onSessionExpired(onSessionExpired)

    const missing = client.restoreSession()
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(1)
    })
    backend.rejectRefresh()
    expect(await missing).toBeNull()
    expect(onSessionExpired).not.toHaveBeenCalled()

    // StrictMode mounts twice; both restores share one refresh.
    const restored = Promise.all([
      client.restoreSession(),
      client.restoreSession(),
    ])
    await vi.waitFor(() => {
      expect(backend.refreshCalls()).toHaveLength(2)
    })
    backend.grantFreshToken()
    expect(await restored).toEqual([ALICE, ALICE])
    expect(backend.refreshCalls()).toHaveLength(2)
  })
})
