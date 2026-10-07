import { expect, test } from '@playwright/test'

test('loads the app shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Devaswom')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Devaswom' }),
  ).toBeVisible()
})
