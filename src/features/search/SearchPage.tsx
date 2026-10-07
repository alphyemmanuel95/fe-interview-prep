import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Icon } from '../../components/Icon'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { SearchResults } from './SearchResults'
import { useProductSearch } from './useProductSearch'
import type { SearchState } from './useProductSearch'

const DEBOUNCE_MS = 300

/**
 * What to show for the text in the box right now. While the user is still
 * typing, the last response belongs to an older query, so it counts as loading.
 */
function selectVisibleState(
  query: string,
  debouncedQuery: string,
  searchState: SearchState,
): SearchState {
  if (query === '') {
    return { status: 'idle' }
  }
  if (query !== debouncedQuery) {
    return { status: 'loading' }
  }
  return searchState
}

function describeState(state: SearchState, query: string): string {
  switch (state.status) {
    case 'idle':
      return ''
    case 'loading':
      return 'Searching…'
    case 'error':
      return 'Search failed.'
    case 'success': {
      const count = state.products.length
      if (count === 0) {
        return `No results for '${query}'`
      }
      return `${String(count)} ${count === 1 ? 'result' : 'results'}`
    }
  }
}

export function SearchPage() {
  const [draft, setDraft] = useState('')
  const query = draft.trim()
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)
  const search = useProductSearch(debouncedQuery)
  const state = selectVisibleState(query, debouncedQuery, search.state)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Results already follow the input, so Enter must not reload the page.
    event.preventDefault()
  }

  function handleRetry() {
    // The Retry button disappears while loading; keep keyboard focus nearby.
    inputRef.current?.focus()
    search.retry()
  }

  return (
    <section aria-labelledby="search-heading" className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5">
        <header className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 pt-6 pb-5 text-white">
          <h1 id="search-heading" className="text-2xl font-bold sm:text-3xl">
            Live Search
          </h1>
          <p className="mt-1 text-sm text-indigo-100">
            Results update as you type.
          </p>

          <form role="search" onSubmit={handleSubmit} className="relative mt-5">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400 sm:left-4"
            />
            <input
              ref={inputRef}
              id="product-search"
              type="search"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
              }}
              placeholder="Search products"
              autoComplete="off"
              className="w-full rounded-xl bg-white py-3 pr-3 pl-10 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:pr-4 sm:pl-12"
            />
          </form>
        </header>

        <p role="status" className="sr-only">
          {describeState(state, query)}
        </p>

        <SearchResults state={state} query={query} onRetry={handleRetry} />
      </div>
    </section>
  )
}
