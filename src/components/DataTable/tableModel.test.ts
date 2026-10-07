import { describe, expect, it } from 'vitest'
import { applyView, nextSort } from './tableModel'
import { DEFAULT_VIEW } from './types'
import type { Column, TableView } from './types'

type Player = {
  readonly id: number
  readonly name: string
  readonly team: string
  readonly score: number
}

const PLAYERS: readonly Player[] = [
  { id: 1, name: 'Asha', team: 'Red', score: 9 },
  { id: 2, name: 'bram', team: 'Blue', score: 10 },
  { id: 3, name: 'Chen', team: 'Red', score: 100 },
  { id: 4, name: 'Dara', team: 'Blue', score: 10 },
  { id: 5, name: 'Elif', team: 'Green', score: 2 },
]

const COLUMNS: readonly Column<Player>[] = [
  { id: 'id', header: 'ID', getValue: (row) => row.id, isSortable: true },
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
    isSearchable: true,
    filter: { type: 'select', options: ['Red', 'Blue', 'Green'] },
  },
  {
    id: 'score',
    header: 'Score',
    getValue: (row) => row.score,
    isSortable: true,
  },
  {
    id: 'label',
    header: 'Label',
    getValue: (row) => `item ${String(row.score)}`,
    isSortable: true,
  },
]

function ids(view: Partial<TableView>): number[] {
  const result = applyView(PLAYERS, COLUMNS, {
    ...DEFAULT_VIEW,
    ...view,
  })
  return result.pageRows.map((row) => row.id)
}

describe('applyView', () => {
  it('returns every row in original order for the default view', () => {
    const result = applyView(PLAYERS, COLUMNS, DEFAULT_VIEW)
    expect(result.pageRows).toEqual(PLAYERS)
    expect(result).toMatchObject({ totalRows: 5, pageCount: 1, page: 1 })
  })

  it('searches searchable columns case-insensitively', () => {
    expect(ids({ search: 'BRAM' })).toEqual([2])
    expect(ids({ search: '  red ' })).toEqual([1, 3])
  })

  it('does not search columns that are not searchable', () => {
    expect(ids({ search: '100' })).toEqual([])
  })

  it('filters text columns by contains and select columns by equality', () => {
    expect(ids({ filters: { name: 'A' } })).toEqual([1, 2, 4])
    expect(ids({ filters: { team: 'blue' } })).toEqual([2, 4])
    expect(ids({ filters: { team: 'Blu' } })).toEqual([])
  })

  it('ignores empty filters and filters for unknown columns', () => {
    expect(ids({ filters: { name: '  ', unknown: 'x' } })).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('combines search and filters', () => {
    expect(ids({ search: 'red', filters: { name: 'chen' } })).toEqual([3])
  })

  it('sorts numbers numerically in either direction', () => {
    expect(ids({ sort: { columnId: 'score', direction: 'asc' } })).toEqual([
      5, 1, 2, 4, 3,
    ])
    expect(ids({ sort: { columnId: 'score', direction: 'desc' } })).toEqual([
      3, 2, 4, 1, 5,
    ])
  })

  it('sorts strings ignoring case and comparing embedded numbers', () => {
    expect(ids({ sort: { columnId: 'name', direction: 'asc' } })).toEqual([
      1, 2, 3, 4, 5,
    ])
    expect(ids({ sort: { columnId: 'label', direction: 'asc' } })).toEqual([
      5, 1, 2, 4, 3,
    ])
  })

  it('keeps the original order of equal values (stable sort)', () => {
    expect(ids({ sort: { columnId: 'score', direction: 'desc' } })).toEqual([
      3, 2, 4, 1, 5,
    ])
    expect(
      ids({
        sort: { columnId: 'score', direction: 'asc' },
        filters: { team: 'blue' },
      }),
    ).toEqual([2, 4])
  })

  it('ignores a sort on an unknown or unsortable column', () => {
    expect(ids({ sort: { columnId: 'team', direction: 'desc' } })).toEqual([
      1, 2, 3, 4, 5,
    ])
    expect(ids({ sort: { columnId: 'nope', direction: 'asc' } })).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('paginates the processed rows', () => {
    const result = applyView(PLAYERS, COLUMNS, {
      ...DEFAULT_VIEW,
      sort: { columnId: 'score', direction: 'asc' },
      pageSize: 10,
      page: 1,
    })
    expect(result.pageCount).toBe(1)

    const many = Array.from({ length: 23 }, (_, index) => ({
      id: index + 1,
      name: `Player ${String(index + 1)}`,
      team: 'Red',
      score: index,
    }))
    const second = applyView(many, COLUMNS, { ...DEFAULT_VIEW, page: 2 })
    expect(second.pageRows.map((row) => row.id)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
    expect(second).toMatchObject({ totalRows: 23, pageCount: 3, page: 2 })

    const last = applyView(many, COLUMNS, { ...DEFAULT_VIEW, page: 3 })
    expect(last.pageRows.map((row) => row.id)).toEqual([21, 22, 23])
  })

  it('clamps a page beyond the last page', () => {
    const result = applyView(PLAYERS, COLUMNS, { ...DEFAULT_VIEW, page: 9 })
    expect(result.page).toBe(1)
    expect(result.pageRows).toHaveLength(5)
  })

  it('reports one empty page when nothing matches', () => {
    const result = applyView(PLAYERS, COLUMNS, {
      ...DEFAULT_VIEW,
      search: 'zzz',
      page: 4,
    })
    expect(result).toEqual({
      pageRows: [],
      totalRows: 0,
      pageCount: 1,
      page: 1,
    })
  })
})

describe('nextSort', () => {
  it('cycles ascending, descending, then none', () => {
    const ascending = nextSort(null, 'name')
    expect(ascending).toEqual({ columnId: 'name', direction: 'asc' })
    const descending = nextSort(ascending, 'name')
    expect(descending).toEqual({ columnId: 'name', direction: 'desc' })
    expect(nextSort(descending, 'name')).toBeNull()
  })

  it('starts a different column ascending', () => {
    expect(nextSort({ columnId: 'name', direction: 'desc' }, 'score')).toEqual({
      columnId: 'score',
      direction: 'asc',
    })
  })
})
