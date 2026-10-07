export type Quote = {
  readonly id: number
  readonly quote: string
  readonly author: string
}

type QuotesResponse = {
  readonly quotes: readonly Quote[]
}

/** `limit=0` asks DummyJSON for every quote in one response. */
const QUOTES_URL = 'https://dummyjson.com/quotes?limit=0'

function isQuote(value: unknown): value is Quote {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'quote' in value &&
    typeof value.quote === 'string' &&
    'author' in value &&
    typeof value.author === 'string'
  )
}

function isQuotesResponse(value: unknown): value is QuotesResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'quotes' in value &&
    Array.isArray(value.quotes) &&
    value.quotes.every(isQuote)
  )
}

/** Fetches every quote; rejects on HTTP errors or bad data. */
export async function fetchQuotes(
  signal: AbortSignal,
): Promise<readonly Quote[]> {
  const response = await fetch(QUOTES_URL, { signal })
  if (!response.ok) {
    throw new Error(
      `Loading quotes failed with status ${String(response.status)}`,
    )
  }
  const body: unknown = await response.json()
  if (!isQuotesResponse(body)) {
    throw new Error('Quotes returned an unexpected response')
  }
  return body.quotes
}
