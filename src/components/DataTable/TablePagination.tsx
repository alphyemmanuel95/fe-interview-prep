import { Icon } from '../Icon'
import { PAGE_SIZES } from './types'
import type { PageSize, SortDirection } from './types'

/** The column the rows are sorted by, as the user sees it. */
export type SortSummary = {
  readonly header: string
  readonly direction: SortDirection
}

type TablePaginationProps = {
  readonly idPrefix: string
  readonly page: number
  readonly pageCount: number
  readonly pageSize: PageSize
  readonly totalRows: number
  readonly sortedBy: SortSummary | null
  readonly onPageChange: (page: number) => void
  readonly onPageSizeChange: (pageSize: PageSize) => void
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const PAGE_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-white'

function describeRange(
  page: number,
  pageSize: number,
  totalRows: number,
): string {
  if (totalRows === 0) {
    return 'Showing 0 of 0'
  }
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalRows)
  return `Showing ${NUMBER_FORMAT.format(first)}–${NUMBER_FORMAT.format(last)} of ${NUMBER_FORMAT.format(totalRows)}`
}

const DIRECTION_LABELS = { asc: 'ascending', desc: 'descending' } as const

function describeSort(sortedBy: SortSummary | null): string {
  if (sortedBy === null) {
    return ''
  }
  return `, sorted by ${sortedBy.header}, ${DIRECTION_LABELS[sortedBy.direction]}`
}

function toPageSize(value: string): PageSize {
  return PAGE_SIZES.find((size) => String(size) === value) ?? PAGE_SIZES[0]
}

/**
 * Page buttons at either end use aria-disabled instead of disabled: a
 * disabled button drops keyboard focus to the page body, which happened
 * whenever Next reached the last page (or Previous the first).
 */
export function TablePagination({
  idPrefix,
  page,
  pageCount,
  pageSize,
  totalRows,
  sortedBy,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const pageSizeId = `${idPrefix}-page-size`
  const isFirstPage = page <= 1
  const isLastPage = page >= pageCount

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      {/* The sort is shown by the column headers, so it is only spelled out
          for screen readers, which announce this status on every change. */}
      <p role="status">
        <span>{describeRange(page, pageSize, totalRows)}</span>
        <span className="sr-only">{describeSort(sortedBy)}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={pageSizeId}>Rows per page</label>
          <select
            id={pageSizeId}
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(toPageSize(event.target.value))
            }}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <nav aria-label="Pagination" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isFirstPage) {
                onPageChange(page - 1)
              }
            }}
            aria-disabled={isFirstPage}
            className={PAGE_BUTTON_CLASS}
          >
            <Icon name="chevronLeft" className="size-4" />
            Previous
          </button>
          <span className="whitespace-nowrap">
            {`Page ${NUMBER_FORMAT.format(page)} of ${NUMBER_FORMAT.format(pageCount)}`}
          </span>
          <button
            type="button"
            onClick={() => {
              if (!isLastPage) {
                onPageChange(page + 1)
              }
            }}
            aria-disabled={isLastPage}
            className={PAGE_BUTTON_CLASS}
          >
            Next
            <Icon name="chevronRight" className="size-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
