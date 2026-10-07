import { useSearchParams } from 'react-router'
import type { Column, TableView } from '../../components/DataTable/types'
import { parseView, serializeView } from './viewParams'

/**
 * Keeps a table view in the URL query string, the single source of truth.
 * Each change pushes a history entry, so back/forward step through views and
 * the address bar is always a shareable link to the current view.
 */
export function useTableViewParams<T>(
  columns: readonly Column<T>[],
): readonly [TableView, (view: TableView) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseView(searchParams, columns)

  function setView(next: TableView) {
    const nextParams = serializeView(next)
    // Re-committing the current view must not add a duplicate history entry.
    if (nextParams.toString() === searchParams.toString()) {
      return
    }
    setSearchParams(nextParams)
  }

  return [view, setView]
}
