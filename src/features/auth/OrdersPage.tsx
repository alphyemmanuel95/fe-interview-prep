import { Icon } from '../../components/Icon'
import { fetchOrders } from './api'
import { formatCurrency, formatDate } from './format'
import { LoadError } from './LoadError'
import { PageCard } from './PageCard'
import type { Order, OrderStatus } from './types'
import { useApiResource } from './useApiResource'
import type { ResourceState } from './useApiResource'

const STATUS_CLASS: Readonly<Record<OrderStatus, string>> = {
  processing: 'bg-amber-50 text-amber-800',
  shipped: 'bg-sky-50 text-sky-800',
  delivered: 'bg-emerald-50 text-emerald-800',
}

const SKELETON_ROWS = ['first', 'second', 'third'] as const

type OrdersContentProps = {
  readonly state: ResourceState<readonly Order[]>
  readonly onRetry: () => void
}

function OrdersContent({ state, onRetry }: OrdersContentProps) {
  switch (state.status) {
    case 'loading':
      return (
        <ul aria-hidden="true" className="divide-y divide-slate-100">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className="flex animate-pulse gap-4 px-6 py-4">
              <span className="flex-1 space-y-2">
                <span className="block h-4 w-2/3 rounded bg-slate-200" />
                <span className="block h-3 w-1/3 rounded bg-slate-100" />
              </span>
              <span className="h-4 w-16 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      )
    case 'error':
      return <LoadError title="Couldn’t load your orders." onRetry={onRetry} />
    case 'success':
      if (state.data.length === 0) {
        return (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Icon name="clipboard" className="size-7" />
            </span>
            <h2 className="mt-4 font-medium text-slate-700">No orders yet.</h2>
          </div>
        )
      }
      return (
        <ul aria-label="Orders" className="divide-y divide-slate-100">
          {state.data.map((order) => (
            <li
              key={order.id}
              className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <span className="min-w-0">
                <span className="block font-medium break-words text-slate-800">
                  {order.item}
                </span>
                <span className="block text-sm text-slate-500">
                  {order.id} ·{' '}
                  <time dateTime={order.placedAt}>
                    {formatDate(order.placedAt)}
                  </time>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_CLASS[order.status]}`}
                >
                  {order.status}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )
  }
}

export function OrdersPage() {
  const { state, retry } = useApiResource(fetchOrders)

  return (
    <PageCard
      headingId="orders-heading"
      title="Your orders"
      subtitle="Everything you’ve ordered recently."
    >
      <OrdersContent state={state} onRetry={retry} />
    </PageCard>
  )
}
