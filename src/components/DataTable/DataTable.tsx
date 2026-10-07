import { useId } from 'react'
import { SortableHeader } from './SortableHeader'
import { TablePagination } from './TablePagination'
import { TableToolbar } from './TableToolbar'
import { applyView, nextSort } from './tableModel'
import type { Column, TableView } from './types'

type DataTableProps<T> = {
  readonly rows: readonly T[]
  readonly columns: readonly Column<T>[]
  readonly getRowId: (row: T) => string | number
  /** The view is controlled: the table never stores it, only requests changes. */
  readonly view: TableView
  readonly onViewChange: (view: TableView) => void
  /** Names the table for assistive technology. */
  readonly caption: string
}

function hasActiveFilters(view: TableView): boolean {
  return (
    view.search.trim() !== '' ||
    Object.values(view.filters).some((value) => value.trim() !== '')
  )
}

function alignClass(align: Column<unknown>['align']): string {
  return align === 'right' ? 'text-right tabular-nums' : 'text-left'
}

/**
 * A generic table configured by its columns, with sorting, global search,
 * column filters and pagination.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  view,
  onViewChange,
  caption,
}: DataTableProps<T>) {
  const idPrefix = useId()
  const result = applyView(rows, columns, view)
  const isFiltered = hasActiveFilters(view)

  // Every change that alters which rows exist, or how many fit on a page,
  // starts again from page 1 so the user never lands on an empty page.
  function handleSearchChange(search: string) {
    onViewChange({ ...view, search, page: 1 })
  }

  function handleFilterChange(columnId: string, value: string) {
    onViewChange({
      ...view,
      filters: { ...view.filters, [columnId]: value },
      page: 1,
    })
  }

  function handleClearFilters() {
    onViewChange({ ...view, search: '', filters: {}, page: 1 })
  }

  return (
    <div>
      <TableToolbar
        idPrefix={idPrefix}
        columns={columns}
        search={view.search}
        filters={view.filters}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
      />

      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full min-w-2xl text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => {
                const align = column.align ?? 'left'
                if (column.isSortable !== true) {
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={`px-4 py-3 font-semibold text-slate-700 ${alignClass(align)}`}
                    >
                      {column.header}
                    </th>
                  )
                }
                return (
                  <SortableHeader
                    key={column.id}
                    label={column.header}
                    align={align}
                    direction={
                      view.sort?.columnId === column.id
                        ? view.sort.direction
                        : null
                    }
                    onSort={() => {
                      onViewChange({
                        ...view,
                        sort: nextSort(view.sort, column.id),
                        page: 1,
                      })
                    }}
                  />
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.pageRows.map((row) => (
              <tr key={getRowId(row)} className="hover:bg-indigo-50/40">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-4 py-3 align-top text-slate-700 ${alignClass(column.align)}`}
                  >
                    {column.renderCell === undefined
                      ? column.getValue(row)
                      : column.renderCell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {result.pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <div className="flex flex-col items-center text-center">
                    <p className="font-medium text-slate-700">
                      {isFiltered
                        ? 'No rows match your search or filters'
                        : 'No rows to show'}
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        idPrefix={idPrefix}
        page={result.page}
        pageCount={result.pageCount}
        pageSize={view.pageSize}
        totalRows={result.totalRows}
        onPageChange={(page) => {
          onViewChange({ ...view, page })
        }}
        onPageSizeChange={(pageSize) => {
          onViewChange({ ...view, pageSize, page: 1 })
        }}
      />
    </div>
  )
}
