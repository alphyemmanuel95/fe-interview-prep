import { createContext } from 'react'
import type { ApiClient } from './apiClient'
import type { User } from './types'

export type Session =
  | { readonly status: 'restoring' }
  | { readonly status: 'authenticated'; readonly user: User }
  | { readonly status: 'anonymous'; readonly hasExpired: boolean }

export type AuthContextValue = {
  readonly session: Session
  readonly client: ApiClient
  /** Resolves once signed in; rejects (e.g. ApiError 401) otherwise. */
  readonly login: (username: string, password: string) => Promise<void>
  readonly logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
