import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { fetchAdminStats, fetchCurrentUser, fetchOrders } from './api'
import { ApiError } from './apiClient'
import type { ApiClient } from './apiClient'
import type { Role } from './types'
import { useAuth } from './useAuth'

type DemoRequest = {
  readonly id: string
  readonly label: string
  /** Sends the request and describes the data that came back. */
  readonly run: (client: ApiClient) => Promise<string>
}

type DemoResult = {
  readonly id: string
  readonly label: string
  readonly isOk: boolean
  readonly detail: string
}

type DemoState =
  | { readonly status: 'idle' }
  | { readonly status: 'running' }
  | {
      readonly status: 'done'
      readonly results: readonly DemoResult[]
      readonly refreshCalls: number
    }

const CURRENT_USER_REQUEST: DemoRequest = {
  id: 'me',
  label: 'GET /api/me',
  run: async (client) => {
    const user = await fetchCurrentUser(client)
    return `Signed in as ${user.name}`
  },
}

const ORDERS_REQUEST: DemoRequest = {
  id: 'orders',
  label: 'GET /api/orders',
  run: async (client) => {
    const orders = await fetchOrders(client)
    return `${String(orders.length)} orders`
  },
}

const STATS_REQUEST: DemoRequest = {
  id: 'stats',
  label: 'GET /api/admin/stats',
  run: async (client) => {
    const stats = await fetchAdminStats(client)
    return `${String(stats.activeSessions)} active sessions`
  },
}

const SECOND_ORDERS_REQUEST: DemoRequest = {
  ...ORDERS_REQUEST,
  id: 'orders-again',
}

/** Admin stats would be a 403 for regular users, so they fetch orders twice. */
function requestsFor(role: Role): readonly DemoRequest[] {
  const third = role === 'admin' ? STATS_REQUEST : SECOND_ORDERS_REQUEST
  return [CURRENT_USER_REQUEST, ORDERS_REQUEST, third]
}

function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    return `Failed with status ${String(error.status)}`
  }
  return error instanceof Error ? error.message : 'Request failed'
}

async function runRequest(
  request: DemoRequest,
  client: ApiClient,
): Promise<DemoResult> {
  const { id, label } = request
  try {
    return { id, label, isOk: true, detail: await request.run(client) }
  } catch (error: unknown) {
    return { id, label, isOk: false, detail: describeFailure(error) }
  }
}

const BUTTON_CLASS =
  'flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60'

export function RefreshDemo() {
  const { session, client } = useAuth()
  const [isTokenInvalid, setIsTokenInvalid] = useState(false)
  const [demo, setDemo] = useState<DemoState>({ status: 'idle' })

  if (session.status !== 'authenticated') {
    return null
  }
  const requests = requestsFor(session.user.role)

  function handleExpire() {
    client.invalidateAccessToken()
    setIsTokenInvalid(true)
  }

  async function fireRequests() {
    const refreshCountBefore = client.getRefreshCount()
    setDemo({ status: 'running' })
    const results = await Promise.all(
      requests.map((request) => runRequest(request, client)),
    )
    setIsTokenInvalid(false)
    setDemo({
      status: 'done',
      results,
      refreshCalls: client.getRefreshCount() - refreshCountBefore,
    })
  }

  return (
    <section
      aria-labelledby="refresh-demo-heading"
      className="rounded-2xl bg-white p-6 shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5"
    >
      <h2
        id="refresh-demo-heading"
        className="flex items-center gap-2 text-lg font-bold text-slate-800"
      >
        <Icon name="bolt" className="size-5 text-violet-600" />
        Token refresh demo
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Open DevTools → Network and filter by <code>/api</code>. Expire the
        token, then fire the requests: all three get a 401, the app sends{' '}
        <strong>exactly one</strong> <code>POST /api/auth/refresh</code>, and
        all three are retried with the new token.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleExpire}
          className={`${BUTTON_CLASS} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50`}
        >
          Expire access token now
        </button>
        <button
          type="button"
          onClick={() => {
            void fireRequests()
          }}
          disabled={demo.status === 'running'}
          className={`${BUTTON_CLASS} bg-indigo-600 text-white hover:bg-indigo-700`}
        >
          {demo.status === 'running'
            ? 'Sending requests…'
            : 'Fire 3 parallel requests'}
        </button>
      </div>

      <div role="status" className="mt-4 text-sm text-slate-700">
        {isTokenInvalid && (
          <p>The access token was replaced with one the server will reject.</p>
        )}
        {demo.status === 'done' && (
          <p>
            Refresh calls in this batch:{' '}
            <strong className="text-slate-900">{demo.refreshCalls}</strong>
            {' · '}
            Total this session: {client.getRefreshCount()}
          </p>
        )}
      </div>

      {demo.status === 'done' && (
        <ul
          aria-label="Request results"
          className="mt-3 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200"
        >
          {demo.results.map((result) => (
            <li
              key={result.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <code className="text-sm font-medium text-slate-800">
                  {result.label}
                </code>
                <span className="block text-sm text-slate-500">
                  {result.detail}
                </span>
              </span>
              <span
                className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold sm:self-auto ${result.isOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
              >
                {result.isOk ? 'OK' : 'Failed'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
