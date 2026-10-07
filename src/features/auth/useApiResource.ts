import { useEffect, useState } from 'react'
import type { ApiClient } from './apiClient'
import { useAuth } from './useAuth'

type SettledState<T> =
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: Error }

export type ResourceState<T> = { readonly status: 'loading' } | SettledState<T>

type Resource<T> = {
  readonly state: ResourceState<T>
  readonly retry: () => void
}

type SettledAttempt<T> = {
  readonly attempt: number
  readonly state: SettledState<T>
}

const LOADING = { status: 'loading' } as const

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error('Request failed')
}

/**
 * Loads data through the signed-in API client. `load` must be a stable
 * (module-level) function; unmounting or retrying aborts the request.
 */
export function useApiResource<T>(
  load: (client: ApiClient, signal: AbortSignal) => Promise<T>,
): Resource<T> {
  const { client } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledAttempt<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    function settle(state: SettledState<T>) {
      if (!controller.signal.aborted) {
        setSettled({ attempt, state })
      }
    }

    load(client, controller.signal).then(
      (data) => {
        settle({ status: 'success', data })
      },
      (reason: unknown) => {
        settle({ status: 'error', error: toError(reason) })
      },
    )

    return () => {
      controller.abort()
    }
  }, [client, load, attempt])

  function retry() {
    setAttempt((current) => current + 1)
  }

  // Derived: a result from an earlier attempt means this one is still loading.
  const state =
    settled !== null && settled.attempt === attempt ? settled.state : LOADING

  return { state, retry }
}
