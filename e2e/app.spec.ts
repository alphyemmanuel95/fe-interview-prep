import { expect, test } from '@playwright/test'

test('loads the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Frontend Interview Prep')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Frontend Interview Prep' }),
  ).toBeVisible()
})

test('shows not-found for an unknown route and links home', async ({
  page,
}) => {
  await page.goto('/does-not-exist')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to all questions' }).click()
  await expect(page).toHaveURL('/')
})
