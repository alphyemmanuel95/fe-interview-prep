import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchPage } from './SearchPage'

const DEBOUNCE_MS = 300

type FixtureProduct = {
  readonly id: number
  readonly title: string
  readonly brand?: string
  readonly category: string
  readonly price: number
  readonly thumbnail: string
}

type PendingRequest = {
  readonly query: string | null
  readonly signal: AbortSignal
  readonly respond: (products: readonly FixtureProduct[]) => void
  readonly fail: (status: number) => void
}

function product(id: number, title: string): FixtureProduct {
  return {
    id,
    title,
    brand: 'Acme',
    category: 'gadgets',
    price: 10,
    thumbnail: `https://example.com/${String(id)}.png`,
  }
}

/**
 * A fetch stand-in whose responses the test releases explicitly. With
 * `ignoreAbort`, it behaves like a response that was already in flight: it
 * still resolves after its request has been aborted.
 */
function createControllableFetch({ ignoreAbort = false } = {}) {
  const requests: PendingRequest[] = []
  const fetchMock = vi.fn(
    (url: string, init: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const signal = init.signal ?? new AbortController().signal
        if (!ignoreAbort) {
          signal.addEventListener('abort', () => {
            reject(new DOMException('The request was aborted.', 'AbortError'))
          })
        }
        requests.push({
          query: new URL(url).searchParams.get('q'),
          signal,
          respond: (products) => {
            resolve(Response.json({ products }))
          },
          fail: (status) => {
            resolve(new Response(null, { status }))
          },
        })
      }),
  )
  return { fetchMock, requests }
}

function getRequest(requests: readonly PendingRequest[], index: number) {
  const request = requests[index]
  if (request === undefined) {
    throw new Error(`Expected request #${String(index)} to have been sent`)
  }
  return request
}

function typeQuery(text: string) {
  const input = screen.getByRole('searchbox', { name: 'Search products' })
  fireEvent.change(input, { target: { value: text } })
}

/** Types one character at a time, pausing less than the debounce delay. */
function typeQuickly(text: string) {
  for (let length = 1; length <= text.length; length++) {
    typeQuery(text.slice(0, length))
    act(() => {
      vi.advanceTimersByTime(50)
    })
  }
}

function waitForDebounce() {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS)
  })
}

describe('SearchPage', () => {
  let fetchMock: ReturnType<typeof createControllableFetch>['fetchMock']
  let requests: PendingRequest[]

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    ;({ fetchMock, requests } = createControllableFetch())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('sends a single request once the user stops typing', async () => {
    render(<SearchPage />)

    typeQuickly('react')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Searching…')

    waitForDebounce()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getRequest(requests, 0).query).toBe('react')

    getRequest(requests, 0).respond([product(1, 'React Phone')])
    const results = await screen.findByRole('list', { name: 'Search results' })
    expect(within(results).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('1 result')
  })

  it('keeps the latest results when an older response arrives late', async () => {
    render(<SearchPage />)

    typeQuery('rea')
    waitForDebounce()
    typeQuery('react')
    waitForDebounce()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const older = getRequest(requests, 0)
    const latest = getRequest(requests, 1)

    latest.respond([product(2, 'React Speaker')])
    await screen.findByText('Speaker', { exact: false })
    older.respond([product(1, 'Rea Old Lamp')])
    // Let the late response's promise chain run to completion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText('Speaker', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('Old Lamp', { exact: false })).toBeNull()
    expect(older.signal.aborted).toBe(true)
  })

  it('ignores a response that resolves after its request was aborted', async () => {
    // Simulates a response already in flight when the query changed, so only
    // the hook's own aborted-request guard can keep it off the screen.
    ;({ fetchMock, requests } = createControllableFetch({ ignoreAbort: true }))
    vi.stubGlobal('fetch', fetchMock)
    render(<SearchPage />)

    typeQuery('rea')
    waitForDebounce()
    typeQuery('react')
    waitForDebounce()
    const older = getRequest(requests, 0)
    const latest = getRequest(requests, 1)

    latest.respond([product(2, 'React Speaker')])
    await screen.findByText('Speaker', { exact: false })
    older.respond([product(1, 'Rea Old Lamp')])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.getByText('Speaker', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('Old Lamp', { exact: false })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('1 result')
  })

  it('shows an error with a retry that searches again', async () => {
    render(<SearchPage />)

    typeQuery('phone')
    waitForDebounce()
    getRequest(requests, 0).fail(500)

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(
      screen.getByRole('heading', { name: 'Couldn’t load results.' }),
    ).toBeInTheDocument()
    fireEvent.click(retry)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    getRequest(requests, 1).respond([product(3, 'Phone Case')])
    expect(
      await screen.findByRole('list', { name: 'Search results' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('shows an empty state naming the query', async () => {
    render(<SearchPage />)

    typeQuery('xyz')
    waitForDebounce()
    getRequest(requests, 0).respond([])

    expect(
      await screen.findByRole('heading', { name: "No results for 'xyz'" }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent("No results for 'xyz'")
  })

  it('does not search for a blank query', () => {
    render(<SearchPage />)

    typeQuery('   ')
    waitForDebounce()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      screen.getByText('Start typing to search products.'),
    ).toBeInTheDocument()
  })

  it('highlights the matched text in each result', async () => {
    render(<SearchPage />)

    typeQuery('phone')
    waitForDebounce()
    getRequest(requests, 0).respond([
      product(4, 'Smartphone Stand'),
      product(5, 'Phone Case'),
    ])

    const marks = await screen.findAllByText(/^phone$/i, { selector: 'mark' })
    expect(marks.map((mark) => mark.textContent)).toEqual(['phone', 'Phone'])
  })

  it('aborts the request in flight when the page unmounts', () => {
    const { unmount } = render(<SearchPage />)

    typeQuery('phone')
    waitForDebounce()
    unmount()

    expect(getRequest(requests, 0).signal.aborted).toBe(true)
  })
})
