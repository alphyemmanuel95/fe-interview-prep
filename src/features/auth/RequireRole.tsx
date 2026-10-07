import { Link, Outlet } from 'react-router'
import { Icon } from '../../components/Icon'
import { AUTH_ROUTES } from './routes'
import type { Role } from './types'
import { useAuth } from './useAuth'

type RequireRoleProps = {
  readonly role: Role
}

/** Renders the nested routes only for users with `role`. Use inside RequireAuth. */
export function RequireRole({ role }: RequireRoleProps) {
  const { session } = useAuth()

  if (session.status === 'authenticated' && session.user.role === role) {
    return <Outlet />
  }

  return (
    <section
      aria-labelledby="access-denied-heading"
      className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <Icon name="lock" className="size-7" />
      </span>
      <h1
        id="access-denied-heading"
        className="mt-4 text-xl font-bold text-slate-800"
      >
        Admins only
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This page needs an admin account. Sign in as admin to see it.
      </p>
      <Link
        to={AUTH_ROUTES.home}
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Back to dashboard
      </Link>
    </section>
  )
}
