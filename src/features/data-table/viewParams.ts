import { DEFAULT_VIEW, PAGE_SIZES } from '../../components/DataTable/types'
import type {
  Column,
  PageSize,
  SortDirection,
  SortState,
  TableView,
} from '../../components/DataTable/types'

/**
 * URL parameter names. Each filter uses its column id as the parameter name,
 * so column ids must not collide with these.
 */
const PARAM = {
  search: 'q',
  sort: 'sort',
  direction: 'dir',
  page: 'page',
  pageSize: 'size',
} as const

const POSITIVE_INTEGER = /^[1-9]\d*$/

function parseDirection(value: string | null): SortDirection | null {
  return value === 'asc' || value === 'desc' ? value : null
}

function parseSort<T>(
  params: URLSearchParams,
  columns: readonly Column<T>[],
): SortState | null {
  const columnId = params.get(PARAM.sort)
  const direction = parseDirection(params.get(PARAM.direction))
  const isKnown = columns.some(
    (column) => column.id === columnId && column.isSortable === true,
  )
  if (columnId === null || direction === null || !isKnown) {
    return null
  }
  return { columnId, direction }
}

function parseFilters<T>(
  params: URLSearchParams,
  columns: readonly Column<T>[],
): Record<string, string> {
  const filters: Record<string, string> = {}
  for (const column of columns) {
    const value = params.get(column.id)
    if (column.filter === undefined || value === null || value === '') {
      continue
    }
    if (
      column.filter.type === 'select' &&
      !column.filter.options.includes(value)
    ) {
      continue
    }
    filters[column.id] = value
  }
  return filters
}

function parsePage(value: string | null): number {
  if (value === null || !POSITIVE_INTEGER.test(value)) {
    return DEFAULT_VIEW.page
  }
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : DEFAULT_VIEW.page
}

function parsePageSize(value: string | null): PageSize {
  return (
    PAGE_SIZES.find((size) => String(size) === value) ?? DEFAULT_VIEW.pageSize
  )
}

/**
 * Reads a table view from URL parameters. Anything missing or invalid falls
 * back to its default, so any link (even a hand-edited one) yields a view.
 */
export function parseView<T>(
  params: URLSearchParams,
  columns: readonly Column<T>[],
): TableView {
  return {
    search: params.get(PARAM.search) ?? DEFAULT_VIEW.search,
    sort: parseSort(params, columns),
    filters: parseFilters(params, columns),
    page: parsePage(params.get(PARAM.page)),
    pageSize: parsePageSize(params.get(PARAM.pageSize)),
  }
}

/** Writes a table view as URL parameters, leaving out default values. */
export function serializeView(view: TableView): URLSearchParams {
  const params = new URLSearchParams()
  if (view.search !== DEFAULT_VIEW.search) {
    params.set(PARAM.search, view.search)
  }
  if (view.sort !== null) {
    params.set(PARAM.sort, view.sort.columnId)
    params.set(PARAM.direction, view.sort.direction)
  }
  for (const [columnId, value] of Object.entries(view.filters)) {
    if (value !== '') {
      params.set(columnId, value)
    }
  }
  if (view.page !== DEFAULT_VIEW.page) {
    params.set(PARAM.page, String(view.page))
  }
  if (view.pageSize !== DEFAULT_VIEW.pageSize) {
    params.set(PARAM.pageSize, String(view.pageSize))
  }
  return params
}
