import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchProducts } from './api'

const PHONE = {
  id: 1,
  title: 'Phone',
  category: 'smartphones',
  price: 199,
  thumbnail: 'https://example.com/phone.png',
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('searchProducts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('encodes the query and returns valid products', async () => {
    const fetchMock = stubFetch(Response.json({ products: [PHONE] }))

    const products = await searchProducts('a&b c', new AbortController().signal)

    expect(products).toEqual([PHONE])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('q=a%26b%20c'),
      expect.anything(),
    )
  })

  it('accepts products without a brand', async () => {
    stubFetch(Response.json({ products: [{ ...PHONE, brand: 'Acme' }, PHONE] }))
    await expect(
      searchProducts('phone', new AbortController().signal),
    ).resolves.toHaveLength(2)
  })

  it('rejects when the server responds with an error status', async () => {
    stubFetch(new Response(null, { status: 500 }))
    await expect(
      searchProducts('phone', new AbortController().signal),
    ).rejects.toThrow('Search failed with status 500')
  })

  it('rejects a response that does not match the expected shape', async () => {
    stubFetch(Response.json({ products: [{ id: 'one' }] }))
    await expect(
      searchProducts('phone', new AbortController().signal),
    ).rejects.toThrow('Search returned an unexpected response')
  })
})
