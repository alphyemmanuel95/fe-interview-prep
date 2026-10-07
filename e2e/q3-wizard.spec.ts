import { expect, test } from '@playwright/test'

test('keeps the current step and answers after a page refresh', async ({
  page,
}) => {
  await page.goto('/q3')

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByLabel('Full name', { exact: true })).toBeFocused()
  await expect(page.getByText('Enter your name.')).toBeVisible()

  await page.getByLabel('Full name', { exact: true }).fill('Asha Rao')
  await page.getByLabel('Email', { exact: true }).fill('asha@example.com')
  await page.getByLabel('Phone', { exact: true }).fill('+91 98765 43210')
  await page.getByRole('button', { name: 'Next' }).click()

  await expect(
    page.getByRole('heading', { level: 2, name: 'Address' }),
  ).toBeVisible()
  await page.getByLabel('Country', { exact: true }).selectOption('India')
  await page.getByLabel('City', { exact: true }).fill('Kochi')

  await page.reload()

  await expect(
    page.getByRole('heading', { level: 2, name: 'Address' }),
  ).toBeVisible()
  await expect(page.getByText('Step 2 of 4')).toBeVisible()
  await expect(page.getByLabel('Country', { exact: true })).toHaveValue('India')
  await expect(page.getByLabel('City', { exact: true })).toHaveValue('Kochi')

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue(
    'Asha Rao',
  )
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    'asha@example.com',
  )
  await expect(page.getByLabel('Phone', { exact: true })).toHaveValue(
    '+91 98765 43210',
  )
})
