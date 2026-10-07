import { NavLink } from 'react-router'
import { Icon } from '../../components/Icon'
import { AUTH_ROUTES } from './routes'
import { useAuth } from './useAuth'

const LINK_CLASS =
  'rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

function linkClass({ isActive }: { readonly isActive: boolean }): string {
  return `${LINK_CLASS} ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`
}

export function AuthNav() {
  const { session, logout } = useAuth()
  if (session.status !== 'authenticated') {
    return null
  }
  const { user } = session

  return (
    <nav
      aria-label="Account"
      className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-900/5 sm:flex-row sm:items-center"
    >
      <ul className="flex flex-wrap gap-1">
        <li>
          <NavLink to={AUTH_ROUTES.home} end className={linkClass}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to={AUTH_ROUTES.orders} className={linkClass}>
            Orders
          </NavLink>
        </li>
        {user.role === 'admin' && (
          <li>
            <NavLink to={AUTH_ROUTES.admin} className={linkClass}>
              Admin
            </NavLink>
          </li>
        )}
      </ul>
      <div className="flex items-center justify-between gap-3 sm:ml-auto">
        <p className="min-w-0 truncate text-sm text-slate-600">
          Signed in as{' '}
          <span className="font-semibold text-slate-800">{user.name}</span>{' '}
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {user.role}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            void logout()
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Icon name="logout" className="size-4" />
          Log out
        </button>
      </div>
    </nav>
  )
}
