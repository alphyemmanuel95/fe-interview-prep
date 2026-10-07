import { Icon } from '../../components/Icon'
import { SearchResultItem } from './SearchResultItem'
import type { SearchState } from './useProductSearch'

type SearchResultsProps = {
  readonly state: SearchState
  readonly query: string
  readonly onRetry: () => void
}

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth'] as const

export function SearchResults({ state, query, onRetry }: SearchResultsProps) {
  switch (state.status) {
    case 'idle':
      return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <Icon name="search" className="size-7" />
          </span>
          <p className="mt-4 font-medium text-slate-700">
            Start typing to search products.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try “phone”, “laptop” or “perfume”.
          </p>
        </div>
      )

    case 'loading':
      return (
        <ul aria-hidden="true" className="divide-y divide-slate-100">
          {SKELETON_ROWS.map((row) => (
            <li
              key={row}
              className="flex animate-pulse items-center gap-3 px-4 py-3 sm:gap-4"
            >
              <span className="size-14 shrink-0 rounded-xl bg-slate-200 sm:size-16" />
              <span className="flex-1 space-y-2">
                <span className="block h-4 w-3/4 rounded bg-slate-200" />
                <span className="block h-3 w-1/2 rounded bg-slate-100" />
              </span>
              <span className="h-4 w-12 shrink-0 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      )

    case 'error':
      return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Icon name="alert" className="size-7" />
          </span>
          <h2 className="mt-4 font-medium text-slate-800">
            Couldn’t load results.
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Retry
          </button>
        </div>
      )

    case 'success':
      if (state.products.length === 0) {
        return (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Icon name="search" className="size-7" />
            </span>
            <h2 className="mt-4 font-medium break-words text-slate-700">
              No results for '{query}'
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Check the spelling or try a broader term.
            </p>
          </div>
        )
      }
      return (
        <ul aria-label="Search results" className="divide-y divide-slate-100">
          {state.products.map((product) => (
            <SearchResultItem
              key={product.id}
              product={product}
              query={query}
            />
          ))}
        </ul>
      )
  }
}
