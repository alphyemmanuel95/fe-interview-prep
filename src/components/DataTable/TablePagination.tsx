import { Icon } from '../Icon'
import { PAGE_SIZES } from './types'
import type { PageSize } from './types'

type TablePaginationProps = {
  readonly idPrefix: string
  readonly page: number
  readonly pageCount: number
  readonly pageSize: PageSize
  readonly totalRows: number
  readonly onPageChange: (page: number) => void
  readonly onPageSizeChange: (pageSize: PageSize) => void
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const PAGE_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white'

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

function toPageSize(value: string): PageSize {
  return PAGE_SIZES.find((size) => String(size) === value) ?? PAGE_SIZES[0]
}

export function TablePagination({
  idPrefix,
  page,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const pageSizeId = `${idPrefix}-page-size`

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p role="status">{describeRange(page, pageSize, totalRows)}</p>

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
              onPageChange(page - 1)
            }}
            disabled={page <= 1}
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
              onPageChange(page + 1)
            }}
            disabled={page >= pageCount}
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
