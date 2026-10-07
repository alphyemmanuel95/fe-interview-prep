import { Link } from 'react-router'
import { fetchOrders } from './api'
import { AUTH_ROUTES } from './routes'
import { useApiResource } from './useApiResource'

const LINK_CLASS =
  'rounded font-semibold text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

function describeCount(count: number): string {
  if (count === 0) {
    return 'You have no orders yet.'
  }
  return `You have ${String(count)} ${count === 1 ? 'order' : 'orders'}.`
}

export function OrdersSummary() {
  const { state, retry } = useApiResource(fetchOrders)

  switch (state.status) {
    case 'loading':
      return <p className="text-slate-500">Loading your orders…</p>
    case 'error':
      return (
        <p className="text-slate-600">
          Couldn’t load your orders.{' '}
          <button type="button" onClick={retry} className={LINK_CLASS}>
            Retry
          </button>
        </p>
      )
    case 'success':
      return (
        <p className="text-slate-700">
          {describeCount(state.data.length)}{' '}
          <Link to={AUTH_ROUTES.orders} className={LINK_CLASS}>
            View orders
          </Link>
        </p>
      )
  }
}
