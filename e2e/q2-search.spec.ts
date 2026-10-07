import { expect, test } from '@playwright/test'

const PRODUCTS_FIXTURE = {
  products: [
    {
      id: 1,
      title: 'React Wireless Speaker',
      brand: 'Acme',
      category: 'electronics',
      price: 49.99,
      thumbnail: 'https://example.com/speaker.png',
    },
    {
      id: 2,
      title: 'Reactive Running Shoes',
      category: 'sports',
      price: 89,
      thumbnail: 'https://example.com/shoes.png',
    },
  ],
}

test('searches once after typing stops and highlights matches', async ({
  page,
}) => {
  const searchedQueries: (string | null)[] = []
  await page.route('**/products/search**', async (route) => {
    searchedQueries.push(new URL(route.request().url()).searchParams.get('q'))
    await route.fulfill({ json: PRODUCTS_FIXTURE })
  })
  // Keep the test offline: thumbnails are not under test.
  await page.route('https://example.com/**', (route) => route.abort())

  await page.goto('/q2')
  await page
    .getByRole('searchbox', { name: 'Search products' })
    .pressSequentially('react', { delay: 30 })

  const results = page.getByRole('list', { name: 'Search results' })
  await expect(results.getByRole('listitem')).toHaveCount(2)
  await expect(
    results.locator('mark').filter({ hasText: /^React$/ }),
  ).toHaveCount(2)
  await expect(page.getByText('Acme · electronics')).toBeVisible()
  expect(searchedQueries).toEqual(['react'])
})

test('shows an empty state for a query with no results', async ({ page }) => {
  await page.route('**/products/search**', (route) =>
    route.fulfill({ json: { products: [] } }),
  )

  await page.goto('/q2')
  await page.getByRole('searchbox', { name: 'Search products' }).fill('xyz')

  await expect(
    page.getByRole('heading', { name: "No results for 'xyz'", exact: true }),
  ).toBeVisible()
})
