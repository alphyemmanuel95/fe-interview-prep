import { describe, expect, it } from 'vitest'
import { DEFAULT_VIEW } from '../../components/DataTable/types'
import type { Column, TableView } from '../../components/DataTable/types'
import { parseView, serializeView } from './viewParams'

type Book = {
  readonly id: number
  readonly title: string
  readonly genre: string
}

const COLUMNS: readonly Column<Book>[] = [
  { id: 'id', header: 'ID', getValue: (row) => row.id, isSortable: true },
  {
    id: 'title',
    header: 'Title',
    getValue: (row) => row.title,
    isSortable: true,
    filter: { type: 'text' },
  },
  {
    id: 'genre',
    header: 'Genre',
    getValue: (row) => row.genre,
    filter: { type: 'select', options: ['Fiction', 'History'] },
  },
]

function parse(query: string): TableView {
  return parseView(new URLSearchParams(query), COLUMNS)
}

describe('parseView', () => {
  it('returns the default view for an empty query', () => {
    expect(parse('')).toEqual(DEFAULT_VIEW)
  })

  it('reads every part of the view', () => {
    expect(
      parse(
        'q=war&sort=title&dir=desc&title=peace&genre=History&page=3&size=50',
      ),
    ).toEqual({
      search: 'war',
      sort: { columnId: 'title', direction: 'desc' },
      filters: { title: 'peace', genre: 'History' },
      page: 3,
      pageSize: 50,
    })
  })

  it('drops a sort on an unknown or unsortable column', () => {
    expect(parse('sort=author&dir=asc').sort).toBeNull()
    expect(parse('sort=genre&dir=asc').sort).toBeNull()
  })

  it('drops a sort without a valid direction', () => {
    expect(parse('sort=title').sort).toBeNull()
    expect(parse('sort=title&dir=up').sort).toBeNull()
  })

  it.each(['0', '-2', '1.5', 'abc', '', '99999999999999999999'])(
    'falls back to page 1 for page=%s',
    (page) => {
      expect(parse(`page=${page}`).page).toBe(1)
    },
  )

  it.each(['5', '100', 'ten', ''])(
    'falls back to 10 rows for size=%s',
    (size) => {
      expect(parse(`size=${size}`).pageSize).toBe(10)
    },
  )

  it('ignores empty, unknown and invalid filters', () => {
    expect(parse('title=&author=tolstoy&genre=Poetry').filters).toEqual({})
  })
})

describe('serializeView', () => {
  it('leaves out default values', () => {
    expect(serializeView(DEFAULT_VIEW).toString()).toBe('')
    expect(
      serializeView({ ...DEFAULT_VIEW, filters: { title: '' } }).toString(),
    ).toBe('')
  })

  it('writes non-default values', () => {
    const params = serializeView({
      search: 'war and peace',
      sort: { columnId: 'id', direction: 'asc' },
      filters: { title: 'peace' },
      page: 2,
      pageSize: 25,
    })
    expect(params.toString()).toBe(
      'q=war+and+peace&sort=id&dir=asc&title=peace&page=2&size=25',
    )
  })

  it('round-trips through parseView', () => {
    const view: TableView = {
      search: 'a&b=c ?',
      sort: { columnId: 'title', direction: 'desc' },
      filters: { title: 'x y', genre: 'Fiction' },
      page: 7,
      pageSize: 50,
    }
    expect(parseView(serializeView(view), COLUMNS)).toEqual(view)
    expect(parseView(serializeView(DEFAULT_VIEW), COLUMNS)).toEqual(
      DEFAULT_VIEW,
    )
  })
})
