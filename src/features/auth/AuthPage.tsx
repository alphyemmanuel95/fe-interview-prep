import { Route, Routes } from 'react-router'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { AdminPage } from './AdminPage'
import { AuthProvider } from './AuthProvider'
import { AuthShell } from './AuthShell'
import { DashboardPage } from './DashboardPage'
import { LoginPage } from './LoginPage'
import { OrdersPage } from './OrdersPage'
import { RequireAuth } from './RequireAuth'
import { RequireRole } from './RequireRole'

/** Q5: every page below /q5 shares one session. */
export function AuthPage() {
  return (
    <AuthProvider>
      <div className="mx-auto max-w-2xl">
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AuthShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route element={<RequireRole role="admin" />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
