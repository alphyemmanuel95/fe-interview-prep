import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'
import { DEFAULT_VIEW } from './types'
import type { Column, TableView } from './types'

const DEBOUNCE_MS = 300

type Player = {
  readonly id: number
  readonly name: string
  readonly team: string
  readonly score: number
}

const TEAMS = ['Red', 'Blue', 'Green'] as const

/** 30 players: names "Player 1".."Player 30", score = 100 - id. */
const PLAYERS: readonly Player[] = Array.from({ length: 30 }, (_, index) => {
  const id = index + 1
  return {
    id,
    name: `Player ${String(id)}`,
    team: TEAMS[id % TEAMS.length] ?? 'Red',
    score: 100 - id,
  }
})

const COLUMNS: readonly Column<Player>[] = [
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,
    isSortable: true,
    isSearchable: true,
    filter: { type: 'text' },
  },
  {
    id: 'team',
    header: 'Team',
    getValue: (row) => row.team,
    filter: { type: 'select', options: TEAMS },
  },
  {
    id: 'score',
    header: 'Score',
    getValue: (row) => row.score,
    isSortable: true,
    align: 'right',
  },
]

function ControlledTable({ initialView }: { readonly initialView: TableView }) {
  const [view, setView] = useState(initialView)
  return (
    <DataTable
      rows={PLAYERS}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      view={view}
      onViewChange={setView}
      caption="Players"
    />
  )
}

function renderTable(view: Partial<TableView> = {}) {
  render(<ControlledTable initialView={{ ...DEFAULT_VIEW, ...view }} />)
}

/** The names in the visible body rows, top to bottom. */
function visibleNames(): (string | null)[] {
  const table = screen.getByRole('table', { name: 'Players' })
  const bodyRows = within(table).getAllByRole('row').slice(1)
  return bodyRows.map(
    (row) => within(row).queryAllByRole('cell')[0]?.textContent ?? null,
  )
}

function waitForDebounce() {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS)
  })
}

describe('DataTable', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the first page with a range summary', () => {
    renderTable()

    expect(visibleNames()).toHaveLength(10)
    expect(visibleNames()[0]).toBe('Player 1')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1–10 of 30')
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('cycles a column sort ascending, descending, then none', () => {
    renderTable()
    const header = screen.getByRole('columnheader', { name: 'Score' })
    const button = within(header).getByRole('button', { name: 'Score' })
    expect(header).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(button)
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(visibleNames()[0]).toBe('Player 30')

    fireEvent.click(button)
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(visibleNames()[0]).toBe('Player 1')

    fireEvent.click(button)
    expect(header).toHaveAttribute('aria-sort', 'none')
    expect(visibleNames().slice(0, 2)).toEqual(['Player 1', 'Player 2'])
  })

  it('does not make unsortable columns sortable', () => {
    renderTable()
    const header = screen.getByRole('columnheader', { name: 'Team' })

    expect(header).not.toHaveAttribute('aria-sort')
    expect(within(header).queryByRole('button')).toBeNull()
  })

  it('moves between pages with Previous and Next', () => {
    renderTable()
    const previous = screen.getByRole('button', { name: 'Previous' })
    const next = screen.getByRole('button', { name: 'Next' })
    expect(previous).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(previous)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()

    fireEvent.click(next)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(visibleNames()[0]).toBe('Player 11')

    fireEvent.click(next)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(next).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(next)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()

    fireEvent.click(previous)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('keeps focus on Next when it reaches the last page', () => {
    renderTable({ page: 2 })
    const next = screen.getByRole('button', { name: 'Next' })
    next.focus()

    fireEvent.click(next)

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(next).toHaveFocus()
    expect(next).toHaveAttribute('aria-disabled', 'true')
  })

  it('changes the page size and returns to page 1', () => {
    renderTable({ page: 3 })

    fireEvent.change(screen.getByLabelText('Rows per page'), {
      target: { value: '25' },
    })

    expect(visibleNames()).toHaveLength(25)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1–25 of 30')
  })

  it('returns to page 1 when a filter changes', () => {
    renderTable({ page: 3 })
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filter by Name'), {
      target: { value: 'Player 1' },
    })
    // The filter commits only once typing pauses.
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    waitForDebounce()

    // "Player 1" and "Player 10".."Player 19" match.
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(visibleNames()[0]).toBe('Player 1')
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1–10 of 11')
  })

  it('returns to page 1 when a select filter changes', () => {
    renderTable({ page: 2 })

    fireEvent.change(screen.getByLabelText('Filter by Team'), {
      target: { value: 'Blue' },
    })

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1–10 of 10')
  })

  it('searches across searchable columns and returns to page 1', () => {
    renderTable({ page: 2 })

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'player 2' },
    })
    waitForDebounce()

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1–10 of 11')
  })

  it('shows an empty state whose button clears search and filters', () => {
    renderTable({ search: 'nobody', filters: { team: 'Red' } })

    expect(
      screen.getByText('No rows match your search or filters'),
    ).toBeInTheDocument()
    // It sits beside the table, not in a cell, so it never scrolls sideways.
    const table = screen.getByRole('table', { name: 'Players' })
    expect(
      within(table).queryByText('No rows match your search or filters'),
    ).toBeNull()
    expect(within(table).getAllByRole('row')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Showing 0 of 0')

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(visibleNames()).toHaveLength(10)
    expect(screen.getByLabelText('Search')).toHaveFocus()
    expect(screen.getByLabelText('Search')).toHaveValue('')
    expect(screen.getByLabelText('Filter by Team')).toHaveValue('')
  })
})
