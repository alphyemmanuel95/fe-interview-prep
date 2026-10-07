import { DataTable } from '../../components/DataTable/DataTable'
import type { Column } from '../../components/DataTable/types'
import { Icon } from '../../components/Icon'
import type { Quote } from './api'
import { useQuotes } from './useQuotes'
import type { QuotesState } from './useQuotes'
import { useTableViewParams } from './useTableViewParams'

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth', 'fifth'] as const

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word !== '').length
}

const QUOTE_COLUMNS: readonly Column<Quote>[] = [
  {
    id: 'id',
    header: 'ID',
    getValue: (row) => row.id,
    isSortable: true,
    align: 'right',
  },
  {
    id: 'quote',
    header: 'Quote',
    getValue: (row) => row.quote,
    isSortable: true,
    isSearchable: true,
  },
  {
    id: 'author',
    header: 'Author',
    getValue: (row) => row.author,
    isSortable: true,
    isSearchable: true,
    filter: { type: 'text' },
  },
  {
    id: 'words',
    header: 'Words',
    getValue: (row) => countWords(row.quote),
    isSortable: true,
    align: 'right',
  },
]

function describeQuotes(state: QuotesState): string {
  if (state.status !== 'success') {
    return 'Sort, search, filter and share the view.'
  }
  return `${NUMBER_FORMAT.format(state.quotes.length)} quotes · sort, search, filter and share the view`
}

export function QuotesTablePage() {
  const { state, retry } = useQuotes()
  const [view, setView] = useTableViewParams(QUOTE_COLUMNS)

  let content
  switch (state.status) {
    case 'loading':
      content = (
        <>
          <p role="status" className="sr-only">
            Loading quotes…
          </p>
          <ul aria-hidden="true" className="divide-y divide-slate-100 p-4">
            {SKELETON_ROWS.map((row) => (
              <li key={row} className="flex animate-pulse gap-4 py-4">
                <span className="h-4 w-8 shrink-0 rounded bg-slate-200" />
                <span className="flex-1 space-y-2">
                  <span className="block h-4 w-full rounded bg-slate-200" />
                  <span className="block h-4 w-2/3 rounded bg-slate-100" />
                </span>
                <span className="h-4 w-24 shrink-0 rounded bg-slate-200" />
              </li>
            ))}
          </ul>
        </>
      )
      break
    case 'error':
      content = (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Icon name="alert" className="size-7" />
          </span>
          <h2 className="mt-4 font-medium text-slate-800">
            Couldn’t load quotes.
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Retry
          </button>
        </div>
      )
      break
    case 'success':
      content = (
        <DataTable
          rows={state.quotes}
          columns={QUOTE_COLUMNS}
          getRowId={(row) => row.id}
          view={view}
          onViewChange={setView}
          caption="Quotes"
        />
      )
      break
  }

  return (
    <section aria-labelledby="data-table-heading">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-indigo-900/10 ring-slate-900/5">
        <header className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 pt-6 pb-5 text-white">
          <h1
            id="data-table-heading"
            className="text-2xl font-bold sm:text-3xl"
          >
            Data Table
          </h1>
          <p className="mt-1 text-sm text-indigo-100">
            {describeQuotes(state)}
          </p>
        </header>
        {content}
      </div>
    </section>
  )
}
