import { Icon } from '../Icon'
import type { SortDirection } from './types'

type SortableHeaderProps = {
  readonly label: string
  readonly direction: SortDirection | null
  readonly align: 'left' | 'right'
  readonly onSort: () => void
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

/** A column header whose button cycles the sort for that column. */
export function SortableHeader({
  label,
  direction,
  align,
  onSort,
}: SortableHeaderProps) {
  let icon = (
    <Icon name="chevronUpDown" className="size-4 shrink-0 text-slate-400" />
  )
  if (direction !== null) {
    icon = (
      <Icon
        name={direction === 'asc' ? 'chevronUp' : 'chevronDown'}
        className="size-4 shrink-0 text-indigo-600"
      />
    )
  }

  return (
    <th
      scope="col"
      aria-sort={direction === null ? 'none' : ARIA_SORT[direction]}
      className={`p-0 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {/* The padding lives on the button so the whole cell is the target. */}
      <button
        type="button"
        onClick={onSort}
        className={`flex w-full items-center gap-1 px-3 py-3 font-semibold text-slate-700 hover:text-indigo-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:px-4 ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}
      >
        {label}
        {icon}
      </button>
    </th>
  )
}
