import { Link } from 'react-router'
import { OrdersSummary } from './OrdersSummary'
import { PageCard } from './PageCard'
import { RefreshDemo } from './RefreshDemo'
import { AUTH_ROUTES } from './routes'
import { useAuth } from './useAuth'

export function DashboardPage() {
  const { session } = useAuth()
  if (session.status !== 'authenticated') {
    return null
  }
  const { user } = session

  return (
    <div className="space-y-4">
      <PageCard
        headingId="dashboard-heading"
        title="Dashboard"
        subtitle={`Welcome back, ${user.name}.`}
      >
        <div className="space-y-4 p-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase">
                Name
              </dt>
              <dd className="mt-0.5 font-semibold break-words text-slate-800">
                {user.name}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase">
                Email
              </dt>
              <dd className="mt-0.5 font-semibold break-words text-slate-800">
                {user.email}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase">
                Role
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-800 capitalize">
                {user.role}
              </dd>
            </div>
          </dl>
          <OrdersSummary />
          {user.role === 'admin' && (
            <p className="text-slate-700">
              As an admin you can also{' '}
              <Link
                to={AUTH_ROUTES.admin}
                className="rounded font-semibold text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                view admin stats
              </Link>
              .
            </p>
          )}
        </div>
      </PageCard>
      <RefreshDemo />
    </div>
  )
}
