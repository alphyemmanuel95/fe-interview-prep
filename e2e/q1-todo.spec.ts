import { expect, test } from '@playwright/test'

test('keeps todos and the selected filter after a page refresh', async ({
  page,
}) => {
  await page.goto('/q1')

  const newTodo = page.getByLabel('New todo')
  for (const title of ['Buy milk', 'Walk dog']) {
    await newTodo.fill(title)
    await newTodo.press('Enter')
  }
  await page.getByRole('checkbox', { name: 'Buy milk', exact: true }).check()
  await page.getByRole('button', { name: 'Active' }).click()

  await page.reload()

  await expect(page.getByRole('button', { name: 'Active' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(
    page.getByRole('checkbox', { name: 'Walk dog', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: 'Buy milk', exact: true }),
  ).toBeHidden()
  await expect(page.getByText('1 item left')).toBeVisible()

  await page.getByRole('button', { name: 'All' }).click()
  await expect(
    page.getByRole('checkbox', { name: 'Buy milk', exact: true }),
  ).toBeChecked()
})
