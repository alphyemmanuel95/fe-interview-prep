import { FILTERS } from './todos'
import type { Filter } from './todos'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

type TodoFiltersProps = {
  readonly value: Filter
  readonly onChange: (filter: Filter) => void
}

export function TodoFilters({ value, onChange }: TodoFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filter todos"
      className="inline-flex rounded-xl bg-slate-100 p-1"
    >
      {FILTERS.map((filter) => {
        const isSelected = filter === value
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              onChange(filter)
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              isSelected
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {FILTER_LABELS[filter]}
          </button>
        )
      })}
    </div>
  )
}
