import { useEffect, useState } from 'react'
import { searchProducts } from './api'
import type { Product } from './api'

type SettledState =
  | { readonly status: 'success'; readonly products: readonly Product[] }
  | { readonly status: 'error'; readonly error: Error }

export type SearchState =
  { readonly status: 'idle' } | { readonly status: 'loading' } | SettledState

type ProductSearch = {
  readonly state: SearchState
  readonly retry: () => void
}

/** The outcome of one request, tagged with what was requested. */
type SettledRequest = {
  readonly query: string
  readonly attempt: number
  readonly state: SettledState
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error('Search failed')
}

/**
 * Searches products for `query` (expected to be debounced and trimmed). A
 * blank query is idle and sends nothing. Only the latest query's response is
 * ever shown: changing the query or unmounting aborts the request in flight.
 */
export function useProductSearch(query: string): ProductSearch {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledRequest | null>(null)

  useEffect(() => {
    if (query === '') {
      return
    }
    const controller = new AbortController()

    function settle(state: SettledState) {
      // An aborted request belongs to an older query (or an unmounted
      // component), so its late result must never reach the screen.
      if (controller.signal.aborted) {
        return
      }
      setSettled({ query, attempt, state })
    }

    searchProducts(query, controller.signal).then(
      (products) => {
        settle({ status: 'success', products })
      },
      (reason: unknown) => {
        settle({ status: 'error', error: toError(reason) })
      },
    )

    return () => {
      controller.abort()
    }
  }, [query, attempt])

  function retry() {
    setAttempt((current) => current + 1)
  }

  // Loading is derived rather than stored: until the request for the current
  // query and attempt settles, whatever is in `settled` is out of date.
  const isCurrent =
    settled !== null && settled.query === query && settled.attempt === attempt
  let state: SearchState = { status: 'loading' }
  if (query === '') {
    state = { status: 'idle' }
  } else if (isCurrent) {
    state = settled.state
  }

  return { state, retry }
}
