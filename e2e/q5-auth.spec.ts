import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const REFRESH_URL = '**/api/auth/refresh'

function loginHeading(page: Page) {
  return page.getByRole('heading', { level: 1, name: 'Sign in', exact: true })
}

function dashboardHeading(page: Page) {
  return page.getByRole('heading', { level: 1, name: 'Dashboard', exact: true })
}

async function signIn(page: Page, username: string, password: string) {
  await expect(loginHeading(page)).toBeVisible()
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

/** Counts refresh calls the browser sends from now on. */
function countRefreshCalls(page: Page): () => number {
  let count = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/refresh') {
      count += 1
    }
  })
  return () => count
}

test('three parallel requests after expiry make exactly one refresh call', async ({
  page,
}) => {
  await page.goto('/q5/login')
  await signIn(page, 'admin', 'admin123')
  await expect(dashboardHeading(page)).toBeVisible()

  const refreshCalls = countRefreshCalls(page)
  await page
    .getByRole('button', { name: 'Expire access token now', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Fire 3 parallel requests', exact: true })
    .click()

  const results = page.getByRole('list', { name: 'Request results' })
  await expect(results.getByRole('listitem')).toHaveCount(3)
  await expect(results.getByText('OK', { exact: true })).toHaveCount(3)
  await expect(page.getByText('Refresh calls in this batch: 1')).toBeVisible()
  expect(refreshCalls()).toBe(1)
})

test('restores the session after a reload without showing the login form', async ({
  page,
}) => {
  await page.goto('/q5/login')
  await signIn(page, 'alice', 'password123')
  await expect(dashboardHeading(page)).toBeVisible()

  // Runs on the reload: flags the document if the login form ever renders,
  // even for a single frame.
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.getElementById('login-heading') !== null) {
        document.documentElement.dataset.sawLoginForm = 'true'
      }
    }).observe(document, { childList: true, subtree: true })
  })
  await page.reload()

  await expect(dashboardHeading(page)).toBeVisible()
  await expect(page.getByText('Welcome back, Alice Johnson.')).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-saw-login-form',
    'true',
  )
})

test('sends a logged-out visitor to login and back to the page they wanted', async ({
  page,
}) => {
  await page.goto('/q5/orders')

  await expect(page).toHaveURL('/q5/login')
  await signIn(page, 'alice', 'password123')

  await expect(page).toHaveURL('/q5/orders')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Your orders', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Orders' }).getByRole('listitem'),
  ).toHaveCount(3)
})

test('logs the user out when the refresh fails', async ({ page }) => {
  await page.goto('/q5/login')
  await signIn(page, 'alice', 'password123')
  await expect(dashboardHeading(page)).toBeVisible()

  await page.route(REFRESH_URL, (route) =>
    route.fulfill({
      status: 401,
      json: { error: 'Your session has expired.' },
    }),
  )
  await page
    .getByRole('button', { name: 'Expire access token now', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Fire 3 parallel requests', exact: true })
    .click()

  await expect(loginHeading(page)).toBeVisible()
  await expect(page).toHaveURL('/q5/login')
  await expect(
    page.getByText('Your session expired. Please sign in again.'),
  ).toBeVisible()
})

test('keeps the admin page from regular users', async ({ page }) => {
  await page.goto('/q5/admin')
  await signIn(page, 'alice', 'password123')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Admins only', exact: true }),
  ).toBeVisible()
})
