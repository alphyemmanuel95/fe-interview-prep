import { DebouncedTextInput } from './DebouncedTextInput'
import type { Column, TableView } from './types'

type TableToolbarProps<T> = {
  readonly idPrefix: string
  readonly columns: readonly Column<T>[]
  readonly search: string
  readonly filters: TableView['filters']
  readonly onSearchChange: (search: string) => void
  readonly onFilterChange: (columnId: string, value: string) => void
}

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus-visible:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500'

/** The global search box plus one control per filterable column. */
export function TableToolbar<T>({
  idPrefix,
  columns,
  search,
  filters,
  onSearchChange,
  onFilterChange,
}: TableToolbarProps<T>) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <DebouncedTextInput
        id={`${idPrefix}-search`}
        label="Search"
        type="search"
        value={search}
        onCommit={onSearchChange}
        placeholder="Search all columns"
      />
      {columns.map((column) => {
        if (column.filter === undefined) {
          return null
        }
        const id = `${idPrefix}-filter-${column.id}`
        const label = `Filter by ${column.header}`
        const value = filters[column.id] ?? ''
        switch (column.filter.type) {
          case 'text':
            return (
              <DebouncedTextInput
                key={column.id}
                id={id}
                label={label}
                type="text"
                value={value}
                onCommit={(text) => {
                  onFilterChange(column.id, text)
                }}
              />
            )
          case 'select':
            return (
              <div key={column.id} className="flex flex-col gap-1">
                <label
                  htmlFor={id}
                  className="text-sm font-medium text-slate-700"
                >
                  {label}
                </label>
                <select
                  id={id}
                  value={value}
                  onChange={(event) => {
                    onFilterChange(column.id, event.target.value)
                  }}
                  className={SELECT_CLASS}
                >
                  <option value="">All</option>
                  {column.filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )
        }
      })}
    </div>
  )
}
