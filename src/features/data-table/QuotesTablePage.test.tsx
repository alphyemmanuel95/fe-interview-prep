import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Quote } from './api'
import { QuotesTablePage } from './QuotesTablePage'

const TOPICS = ['Code', 'Life', 'Art'] as const

/**
 * 60 quotes. Quote `i` is about TOPICS[i % 3], has i + 3 words, and is by
 * Alan Turing when i is a multiple of 4, otherwise by Grace Hopper.
 */
const QUOTES: readonly Quote[] = Array.from({ length: 60 }, (_, index) => {
  const id = index + 1
  return {
    id,
    quote: `${TOPICS[id % TOPICS.length] ?? 'Code'} lesson ${'and '.repeat(id)}end`,
    author: id % 4 === 0 ? 'Alan Turing' : 'Grace Hopper',
  }
})

function quotesResponse(): Response {
  return Response.json({ quotes: QUOTES, total: QUOTES.length })
}

function CurrentSearch() {
  return <output aria-label="Current search">{useLocation().search}</output>
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <QuotesTablePage />
      <CurrentSearch />
    </MemoryRouter>,
  )
}

/** The IDs in the visible body rows, top to bottom. */
function visibleIds(): (string | null)[] {
  const table = screen.getByRole('table', { name: 'Quotes' })
  const bodyRows = within(table).getAllByRole('row').slice(1)
  return bodyRows.map(
    (row) => within(row).queryAllByRole('cell')[0]?.textContent ?? null,
  )
}

describe('QuotesTablePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restores the exact view from a shared link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotesResponse()))

    renderAt('/q4?q=code&sort=words&dir=desc&f.author=hopper&page=2&size=10')

    await screen.findByRole('table', { name: 'Quotes' })
    expect(screen.getByLabelText('Search')).toHaveValue('code')
    expect(screen.getByLabelText('Filter by Author')).toHaveValue('hopper')
    expect(screen.getByLabelText('Rows per page')).toHaveValue('10')
    expect(screen.getByRole('columnheader', { name: 'Words' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(screen.getByRole('columnheader', { name: 'ID' })).toHaveAttribute(
      'aria-sort',
      'none',
    )
    // Code quotes by Grace Hopper, most words first; page 2 holds the rest.
    expect(visibleIds()).toEqual(['18', '15', '9', '6', '3'])
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('Showing 11–15 of 15')).toBeInTheDocument()
  })

  it('shows the last page when the linked page no longer exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotesResponse()))

    renderAt('/q4?page=99')

    await screen.findByRole('table', { name: 'Quotes' })
    expect(screen.getByText('Page 6 of 6')).toBeInTheDocument()
    expect(visibleIds()[0]).toBe('51')
  })

  it('writes view changes to the URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotesResponse()))
    renderAt('/q4?page=3')
    await screen.findByRole('table', { name: 'Quotes' })
    const currentSearch = screen.getByRole('status', { name: 'Current search' })
    expect(currentSearch).toHaveTextContent('?page=3')

    fireEvent.click(screen.getByRole('button', { name: 'Words' }))
    expect(currentSearch).toHaveTextContent(/^\?sort=words&dir=asc$/)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(currentSearch).toHaveTextContent(/^\?sort=words&dir=asc&page=2$/)
  })

  it('shows the quote count once loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quotesResponse()))

    renderAt('/q4')

    expect(screen.getByText('Loading quotes…')).toBeInTheDocument()
    expect(
      await screen.findByText(
        '60 quotes · sort, search, filter and share the view',
      ),
    ).toBeInTheDocument()
  })

  it('shows an error with a retry that loads the quotes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(quotesResponse())
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/q4')

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(
      screen.getByRole('heading', { name: 'Couldn’t load quotes.' }),
    ).toBeInTheDocument()
    fireEvent.click(retry)

    expect(
      await screen.findByRole('table', { name: 'Quotes' }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})
