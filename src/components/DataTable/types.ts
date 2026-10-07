import type { ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export type ColumnFilter =
  | { readonly type: 'text' }
  | { readonly type: 'select'; readonly options: readonly string[] }

/** Describes one column; the table is configured entirely by these. */
export type Column<T> = {
  /** Stable key, also used as the column's filter parameter name. */
  readonly id: string
  readonly header: string
  /** The value used for searching, filtering and sorting. */
  readonly getValue: (row: T) => string | number
  /** Custom cell content; defaults to `getValue`. */
  readonly renderCell?: (row: T) => ReactNode
  readonly isSortable?: boolean
  readonly isSearchable?: boolean
  readonly filter?: ColumnFilter
  readonly align?: 'left' | 'right'
}

export type SortState = {
  readonly columnId: string
  readonly direction: SortDirection
}

export const PAGE_SIZES = [10, 25, 50] as const

export type PageSize = (typeof PAGE_SIZES)[number]

/** Everything that determines what the table shows. */
export type TableView = {
  readonly search: string
  readonly sort: SortState | null
  /** Filter text per column id; empty or missing means no filter. */
  readonly filters: Readonly<Record<string, string>>
  readonly page: number
  readonly pageSize: PageSize
}

export const DEFAULT_VIEW: TableView = {
  search: '',
  sort: null,
  filters: {},
  page: 1,
  pageSize: PAGE_SIZES[0],
}
