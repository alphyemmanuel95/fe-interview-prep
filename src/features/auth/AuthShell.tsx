import { Outlet } from 'react-router'
import { AuthNav } from './AuthNav'

/** Layout for signed-in pages: account navigation above the page. */
export function AuthShell() {
  return (
    <div className="space-y-4">
      <AuthNav />
      <Outlet />
    </div>
  )
}
