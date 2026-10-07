import { useEffect, useState } from 'react'
import { fetchQuotes } from './api'
import type { Quote } from './api'

type SettledState =
  | { readonly status: 'success'; readonly quotes: readonly Quote[] }
  | { readonly status: 'error'; readonly error: Error }

export type QuotesState = { readonly status: 'loading' } | SettledState

type QuotesResult = {
  readonly state: QuotesState
  readonly retry: () => void
}

/** The outcome of one request, tagged with the attempt that made it. */
type SettledRequest = {
  readonly attempt: number
  readonly state: SettledState
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error('Loading quotes failed')
}

/**
 * Loads every quote once on mount. `retry` starts a fresh attempt; unmounting
 * or retrying aborts the request in flight.
 */
export function useQuotes(): QuotesResult {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledRequest | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    function settle(state: SettledState) {
      // An aborted request belongs to an earlier attempt or an unmounted
      // page, so its late result must never reach the screen.
      if (controller.signal.aborted) {
        return
      }
      setSettled({ attempt, state })
    }

    fetchQuotes(controller.signal).then(
      (quotes) => {
        settle({ status: 'success', quotes })
      },
      (reason: unknown) => {
        settle({ status: 'error', error: toError(reason) })
      },
    )

    return () => {
      controller.abort()
    }
  }, [attempt])

  function retry() {
    setAttempt((current) => current + 1)
  }

  // Loading is derived: until the current attempt settles, it is in flight.
  const state: QuotesState =
    settled?.attempt === attempt ? settled.state : { status: 'loading' }

  return { state, retry }
}
