export type Product = {
  readonly id: number
  readonly title: string
  readonly brand?: string
  readonly category: string
  readonly price: number
  readonly thumbnail: string
}

type SearchResponse = {
  readonly products: readonly Product[]
}

const SEARCH_URL = 'https://dummyjson.com/products/search'
const RESULT_LIMIT = 20
const PRODUCT_FIELDS = 'title,brand,category,price,thumbnail'

function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'title' in value &&
    typeof value.title === 'string' &&
    (!('brand' in value) || typeof value.brand === 'string') &&
    'category' in value &&
    typeof value.category === 'string' &&
    'price' in value &&
    typeof value.price === 'number' &&
    'thumbnail' in value &&
    typeof value.thumbnail === 'string'
  )
}

function isSearchResponse(value: unknown): value is SearchResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'products' in value &&
    Array.isArray(value.products) &&
    value.products.every(isProduct)
  )
}

/** Fetches products matching `query`; rejects on HTTP errors or bad data. */
export async function searchProducts(
  query: string,
  signal: AbortSignal,
): Promise<readonly Product[]> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${String(RESULT_LIMIT)}&select=${PRODUCT_FIELDS}`
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Search failed with status ${String(response.status)}`)
  }
  const body: unknown = await response.json()
  if (!isSearchResponse(body)) {
    throw new Error('Search returned an unexpected response')
  }
  return body.products
}
