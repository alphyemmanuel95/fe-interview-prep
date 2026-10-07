import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from './apiClient'
import { AuthPage } from './AuthPage'

type Username = 'alice' | 'admin'

const ACCOUNTS = {
  alice: {
    password: 'password123',
    user: {
      username: 'alice',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'user',
    },
  },
  admin: {
    password: 'admin123',
    user: {
      username: 'admin',
      name: 'Ada Admin',
      email: 'admin@example.com',
      role: 'admin',
    },
  },
} as const

const ORDERS = [
  {
    id: 'ORD-1',
    item: 'Mechanical keyboard',
    total: 129.5,
    status: 'shipped',
    placedAt: '2026-09-21',
  },
]

const STATS = {
  totalUsers: 2,
  totalOrders: 5,
  revenue: 1217.48,
  activeSessions: 1,
}

function isUsername(value: unknown): value is Username {
  return value === 'alice' || value === 'admin'
}

/**
 * A small stand-in for the mock server. `sessionUser` is who the refresh
 * cookie belongs to (null: no cookie). Access tokens are `token-<username>`.
 */
function createBackend(initialSessionUser: Username | null) {
  let sessionUser = initialSessionUser
  let areAccessTokensValid = true
  let holdRefresh: Promise<void> | null = null

  function userFor(authorization: string | null): Username | null {
    const username = authorization?.replace('Bearer token-', '')
    return areAccessTokensValid && isUsername(username) ? username : null
  }

  async function refresh(): Promise<Response> {
    if (holdRefresh !== null) {
      await holdRefresh
    }
    if (sessionUser === null) {
      return Response.json({ error: 'Expired' }, { status: 401 })
    }
    areAccessTokensValid = true
    return Response.json({ accessToken: `token-${sessionUser}`, expiresIn: 30 })
  }

  function login(body: unknown): Response {
    const credentials: unknown =
      typeof body === 'string' ? JSON.parse(body) : null
    if (
      typeof credentials === 'object' &&
      credentials !== null &&
      'username' in credentials &&
      isUsername(credentials.username) &&
      'password' in credentials &&
      ACCOUNTS[credentials.username].password === credentials.password
    ) {
      sessionUser = credentials.username
      return Response.json({
        accessToken: `token-${credentials.username}`,
        expiresIn: 30,
        user: ACCOUNTS[credentials.username].user,
      })
    }
    return Response.json({ error: 'Incorrect' }, { status: 401 })
  }

  function protectedRoute(path: string, username: Username | null): Response {
    if (username === null) {
      return Response.json({ error: 'Expired' }, { status: 401 })
    }
    switch (path) {
      case '/api/me':
        return Response.json({ user: ACCOUNTS[username].user })
      case '/api/orders':
        return Response.json({ orders: ORDERS })
      case '/api/admin/stats':
        return username === 'admin'
          ? Response.json({ stats: STATS })
          : Response.json({ error: 'Admins only.' }, { status: 403 })
      default:
        return Response.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    switch (path) {
      case '/api/auth/refresh':
        return refresh()
      case '/api/auth/login':
        return login(init?.body)
      case '/api/auth/logout':
        sessionUser = null
        return new Response(null, { status: 204 })
      default:
        return protectedRoute(
          path,
          userFor(new Headers(init?.headers).get('Authorization')),
        )
    }
  })

  return {
    fetchMock,
    /** Keeps the restore refresh pending until the returned function runs. */
    holdRefresh: () => {
      let release = () => undefined
      holdRefresh = new Promise<void>((resolve) => {
        release = () => {
          holdRefresh = null
          resolve()
        }
      })
      return release
    },
    endSession: () => {
      sessionUser = null
      areAccessTokensValid = false
    },
  }
}

function renderAt(path: string, backend: ReturnType<typeof createBackend>) {
  const client = createApiClient({ fetch: backend.fetchMock })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/q5/*" element={<AuthPage client={client} />} />
      </Routes>
    </MemoryRouter>,
  )
}

function signIn(username: string, password: string) {
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: username },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

const loginHeading = () =>
  screen.queryByRole('heading', { level: 1, name: 'Sign in' })

describe('AuthPage', () => {
  it('sends a logged-out visitor to login, then back to the page they wanted', async () => {
    renderAt('/q5/orders', createBackend(null))

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()

    signIn('alice', 'password123')

    expect(
      await screen.findByRole('heading', { name: 'Your orders' }),
    ).toBeVisible()
    const orders = await screen.findByRole('list', { name: 'Orders' })
    expect(within(orders).getByText('Mechanical keyboard')).toBeVisible()
  })

  it('shows a splash, never the login form, while the session is restored', async () => {
    const backend = createBackend('alice')
    const release = backend.holdRefresh()
    renderAt('/q5', backend)

    expect(screen.getByRole('status')).toHaveTextContent('Restoring session…')
    expect(loginHeading()).not.toBeInTheDocument()

    release()

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible()
    expect(loginHeading()).not.toBeInTheDocument()
    expect(screen.getByText('Welcome back, Alice Johnson.')).toBeVisible()
  })

  it('validates the form and reports wrong credentials', async () => {
    renderAt('/q5/login', createBackend(null))
    await screen.findByRole('heading', { name: 'Sign in' })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(
      'Enter your username.',
    )
    expect(screen.getByLabelText('Username')).toHaveFocus()

    signIn('alice', 'wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect username or password.',
    )
  })

  it('keeps the admin page from regular users', async () => {
    renderAt('/q5/admin', createBackend('alice'))

    expect(
      await screen.findByRole('heading', { name: 'Admins only' }),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Back to dashboard' }),
    ).toHaveAttribute('href', '/q5')
    expect(
      screen.queryByRole('link', { name: 'Admin' }),
    ).not.toBeInTheDocument()
  })

  it('shows the admin page to admins', async () => {
    renderAt('/q5/admin', createBackend('admin'))

    expect(
      await screen.findByRole('heading', { name: 'Admin stats' }),
    ).toBeVisible()
    expect(await screen.findByText('$1,217.48')).toBeVisible()
  })

  it('returns to the login page on logout', async () => {
    const backend = createBackend('alice')
    renderAt('/q5', backend)
    await screen.findByRole('heading', { name: 'Dashboard' })

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()
    expect(backend.fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.anything(),
    )
  })

  it('logs the user out when the session cannot be refreshed', async () => {
    const backend = createBackend('alice')
    renderAt('/q5', backend)
    await screen.findByRole('heading', { name: 'Dashboard' })

    backend.endSession()
    fireEvent.click(screen.getByRole('link', { name: 'Orders' }))

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session expired. Please sign in again.',
    )

    signIn('alice', 'password123')

    expect(
      await screen.findByRole('heading', { name: 'Your orders' }),
    ).toBeVisible()
  })
})
