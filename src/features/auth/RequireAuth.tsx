import { Navigate, Outlet, useLocation } from 'react-router'
import { AUTH_ROUTES } from './routes'
import { SessionSplash } from './SessionSplash'
import { useAuth } from './useAuth'

/** Renders the nested routes for signed-in users; others go to login. */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  switch (session.status) {
    case 'restoring':
      return <SessionSplash />
    case 'anonymous':
      // Remember the page so login can send the user straight back to it.
      return (
        <Navigate to={AUTH_ROUTES.login} replace state={{ from: location }} />
      )
    case 'authenticated':
      return <Outlet />
  }
}
