import type { Column, SortState, TableView } from './types'

export type TableResult<T> = {
  readonly pageRows: readonly T[]
  /** Rows left after search and filters, across all pages. */
  readonly totalRows: number
  readonly pageCount: number
  /** The requested page, clamped to the pages that exist. */
  readonly page: number
}

// Building a collator is expensive, and localeCompare with options builds one
// per call, so a single shared collator keeps large string sorts fast.
const COLLATOR = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
})

function normalise(value: string | number): string {
  return String(value).trim().toLocaleLowerCase()
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  return COLLATOR.compare(String(a), String(b))
}

function matchesSearch<T>(
  row: T,
  searchableColumns: readonly Column<T>[],
  needle: string,
): boolean {
  return searchableColumns.some((column) =>
    normalise(column.getValue(row)).includes(needle),
  )
}

function matchesFilters<T>(
  row: T,
  columns: readonly Column<T>[],
  filters: TableView['filters'],
): boolean {
  return columns.every((column) => {
    const wanted = normalise(filters[column.id] ?? '')
    if (column.filter === undefined || wanted === '') {
      return true
    }
    const actual = normalise(column.getValue(row))
    switch (column.filter.type) {
      case 'text':
        return actual.includes(wanted)
      case 'select':
        return actual === wanted
    }
  })
}

function sortRows<T>(
  rows: readonly T[],
  columns: readonly Column<T>[],
  sort: SortState | null,
): readonly T[] {
  const column = columns.find(
    (candidate) =>
      candidate.id === sort?.columnId && candidate.isSortable === true,
  )
  if (sort === null || column === undefined) {
    return rows
  }
  const sign = sort.direction === 'asc' ? 1 : -1
  // Array sorting is stable, so rows with equal values keep their order.
  return rows.toSorted(
    (a, b) => sign * compareValues(column.getValue(a), column.getValue(b)),
  )
}

/**
 * Applies a view to `rows`: global search, then column filters, then sort,
 * then pagination. Pure, so callers derive it during render.
 */
export function applyView<T>(
  rows: readonly T[],
  columns: readonly Column<T>[],
  view: TableView,
): TableResult<T> {
  const needle = normalise(view.search)
  const searchableColumns = columns.filter(
    (column) => column.isSearchable === true,
  )
  const matching = rows.filter(
    (row) =>
      (needle === '' || matchesSearch(row, searchableColumns, needle)) &&
      matchesFilters(row, columns, view.filters),
  )
  const sorted = sortRows(matching, columns, view.sort)
  const pageCount = Math.max(1, Math.ceil(sorted.length / view.pageSize))
  const page = Math.min(Math.max(1, view.page), pageCount)
  const start = (page - 1) * view.pageSize

  return {
    pageRows: sorted.slice(start, start + view.pageSize),
    totalRows: sorted.length,
    pageCount,
    page,
  }
}

/**
 * The sort after clicking `columnId`'s header: ascending, then descending,
 * then unsorted. A different column always starts ascending.
 */
export function nextSort(
  current: SortState | null,
  columnId: string,
): SortState | null {
  if (current?.columnId !== columnId) {
    return { columnId, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { columnId, direction: 'desc' }
  }
  return null
}
