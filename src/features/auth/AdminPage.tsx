import { fetchAdminStats } from './api'
import { formatCurrency } from './format'
import { LoadError } from './LoadError'
import { PageCard } from './PageCard'
import type { AdminStats } from './types'
import { useApiResource } from './useApiResource'

type StatCard = {
  readonly label: string
  readonly format: (stats: AdminStats) => string
}

const STAT_CARDS: readonly StatCard[] = [
  { label: 'Users', format: (stats) => String(stats.totalUsers) },
  { label: 'Orders', format: (stats) => String(stats.totalOrders) },
  { label: 'Revenue', format: (stats) => formatCurrency(stats.revenue) },
  {
    label: 'Active sessions',
    format: (stats) => String(stats.activeSessions),
  },
]

export function AdminPage() {
  const { state, retry } = useApiResource(fetchAdminStats)

  return (
    <PageCard
      headingId="admin-heading"
      title="Admin stats"
      subtitle="Only admins can see this page."
    >
      {state.status === 'error' ? (
        <LoadError title="Couldn’t load the stats." onRetry={retry} />
      ) : (
        <dl
          aria-busy={state.status === 'loading'}
          className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4"
        >
          {STAT_CARDS.map(({ label, format }) => (
            <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-xl font-bold text-slate-800 tabular-nums">
                {state.status === 'success' ? format(state.data) : '…'}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </PageCard>
  )
}
