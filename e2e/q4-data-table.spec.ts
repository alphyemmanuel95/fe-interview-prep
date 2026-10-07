import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type Quote = {
  readonly id: number
  readonly quote: string
  readonly author: string
}

const AUTHORS = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Linus Torvalds',
  'Margaret Hamilton',
] as const
const TOPICS = ['Code', 'Life', 'Art', 'Time'] as const

/** 520 deterministic quotes; quote `i` has (i % 17) + 4 words. */
const QUOTES: readonly Quote[] = Array.from({ length: 520 }, (_, index) => {
  const id = index + 1
  return {
    id,
    quote: `${TOPICS[id % TOPICS.length] ?? 'Code'} quote ${'word '.repeat(id % 17)}number ${String(id)}`,
    author: AUTHORS[id % AUTHORS.length] ?? 'Ada Lovelace',
  }
})

function wordCount(quote: Quote): number {
  return quote.quote.split(/\s+/).length
}

async function openTable(page: Page, query = '') {
  await page.route('**/quotes**', (route) =>
    route.fulfill({ json: { quotes: QUOTES, total: QUOTES.length } }),
  )
  await page.goto(`/q4${query}`)
  await expect(page.getByRole('table', { name: 'Quotes' })).toBeVisible()
}

/** The ID cell of each visible body row. */
async function visibleIds(page: Page): Promise<string[]> {
  const rows = page.getByRole('table', { name: 'Quotes' }).locator('tbody tr')
  return rows.locator('td:first-child').allTextContents()
}

test('opening a shared link restores the exact view', async ({ page }) => {
  await openTable(
    page,
    '?q=code&sort=words&dir=desc&f.author=grace&page=2&size=10',
  )

  const expected = QUOTES.filter(
    (quote) =>
      quote.quote.toLowerCase().includes('code') &&
      quote.author === 'Grace Hopper',
  )
    .toSorted((a, b) => wordCount(b) - wordCount(a))
    .slice(10, 20)
    .map((quote) => String(quote.id))

  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(
    'code',
  )
  await expect(
    page.getByRole('textbox', { name: 'Filter by Author' }),
  ).toHaveValue('grace')
  await expect(
    page.getByRole('combobox', { name: 'Rows per page' }),
  ).toHaveValue('10')
  await expect(
    page.getByRole('columnheader', { name: 'Words', exact: true }),
  ).toHaveAttribute('aria-sort', 'descending')
  await expect(page.getByText('Page 2 of 3', { exact: true })).toBeVisible()
  expect(await visibleIds(page)).toEqual(expected)
})

test('changing a filter returns to page 1', async ({ page }) => {
  await openTable(page, '?page=4')
  await expect(page.getByText('Page 4 of 52', { exact: true })).toBeVisible()

  await page.getByRole('textbox', { name: 'Filter by Author' }).fill('turing')

  await expect(page).toHaveURL(/\/q4\?f\.author=turing$/)
  await expect(page.getByText('Page 1 of 11', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Showing 1–10 of 104', { exact: true }),
  ).toBeVisible()
})

test('back and forward step through previous views', async ({ page }) => {
  await openTable(page)
  const next = page.getByRole('button', { name: 'Next' })

  await next.click()
  await next.click()
  await expect(page).toHaveURL(/\/q4\?page=3$/)
  const pageThreeIds = await visibleIds(page)

  await page.getByRole('button', { name: 'Words', exact: true }).click()
  await expect(page).toHaveURL(/\/q4\?sort=words&dir=asc$/)
  await expect(
    page.getByRole('columnheader', { name: 'Words', exact: true }),
  ).toHaveAttribute('aria-sort', 'ascending')

  await page.goBack()
  await expect(page).toHaveURL(/\/q4\?page=3$/)
  await expect(
    page.getByRole('columnheader', { name: 'Words', exact: true }),
  ).toHaveAttribute('aria-sort', 'none')
  await expect(page.getByText('Page 3 of 52', { exact: true })).toBeVisible()
  expect(await visibleIds(page)).toEqual(pageThreeIds)

  await page.goBack()
  await expect(page.getByText('Page 2 of 52', { exact: true })).toBeVisible()

  await page.goForward()
  await expect(page.getByText('Page 3 of 52', { exact: true })).toBeVisible()
})

test.describe('on a small screen', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('fits the table and its empty state without scrolling sideways', async ({
    page,
  }) => {
    await openTable(page)
    const table = page.getByRole('table', { name: 'Quotes' })
    const tableBox = await table.boundingBox()
    expect(tableBox).not.toBeNull()
    expect((tableBox?.x ?? 0) + (tableBox?.width ?? 0)).toBeLessThanOrEqual(375)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0)

    await page.getByLabel('Search').fill('no such quote')
    const clear = page.getByRole('button', { name: 'Clear filters' })
    await expect(clear).toBeInViewport({ ratio: 1 })
  })
})
