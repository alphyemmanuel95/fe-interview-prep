import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import type { Session } from './AuthContext'
import { apiClient } from './apiClient'
import type { ApiClient } from './apiClient'

type AuthProviderProps = {
  readonly children: ReactNode
  readonly client?: ApiClient
}

const SIGNED_OUT: Session = { status: 'anonymous', hasExpired: false }
const EXPIRED: Session = { status: 'anonymous', hasExpired: true }

export function AuthProvider({
  children,
  client = apiClient,
}: AuthProviderProps) {
  // Starts as 'restoring' so a reload shows a splash, never the login form,
  // until the refresh cookie has been tried.
  const [session, setSession] = useState<Session>({ status: 'restoring' })

  useEffect(
    () =>
      client.onSessionExpired(() => {
        setSession(EXPIRED)
      }),
    [client],
  )

  useEffect(() => {
    // StrictMode mounts twice; the client shares one restore between both,
    // and only the mount that is still current applies the result.
    let isCurrent = true
    client.restoreSession().then(
      (user) => {
        if (isCurrent) {
          setSession(
            user === null ? SIGNED_OUT : { status: 'authenticated', user },
          )
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          console.error('Could not restore the session.', error)
          setSession(SIGNED_OUT)
        }
      },
    )
    return () => {
      isCurrent = false
    }
  }, [client])

  async function login(username: string, password: string) {
    const user = await client.login(username, password)
    setSession({ status: 'authenticated', user })
  }

  async function logout() {
    // Signed out immediately; the server call only revokes the refresh token.
    setSession(SIGNED_OUT)
    await client.logout()
  }

  return (
    <AuthContext value={{ session, client, login, logout }}>
      {children}
    </AuthContext>
  )
}
