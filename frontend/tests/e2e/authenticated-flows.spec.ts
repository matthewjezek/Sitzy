import { expect, test } from '@playwright/test'

import {
  mockAuthenticatedApi,
  seedAuthenticated,
  seedLoggedOut,
} from './helpers'

test('rides page shows upcoming ride and opens detail', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/rides')

  await expect(page.getByRole('heading', { name: 'Jízdy' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Zobrazit jízdu: Brno/ })).toBeVisible()

  await page.getByRole('button', { name: /Zobrazit jízdu: Brno/ }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1$/)
  await expect(page.getByRole('heading', { name: 'Brno' })).toBeVisible()
  await expect(page.getByText('Rodinný vůz (Minivan)')).toBeVisible()
  await expect(page.getByText('Jan Novák')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pozvánky' })).toBeVisible()
})

test('cars page shows car and opens detail', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/cars')

  await expect(page.getByRole('heading', { name: 'Moje auta' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Zobrazit auto Rodinný vůz, typ Minivan/ })).toBeVisible()

  await page.getByRole('button', { name: /Zobrazit auto Rodinný vůz, typ Minivan/ }).click()

  await expect(page).toHaveURL(/\/cars\/car-1$/)
  await expect(page.getByRole('heading', { name: 'Rodinný vůz' })).toBeVisible()
  await expect(page.getByText('Majitel: Jan Novák')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nová jízda s tímto autem' })).toBeVisible()
})

test('settings theme persists and logout returns to login', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/settings')

  await expect(page.getByText('Jan Novák')).toBeVisible()
  await page.getByRole('button', { name: 'Tmavý' }).click()

  await expect(page.locator('html')).toHaveClass(/dark/)
  const storedTheme = await page.evaluate(() => localStorage.getItem('theme'))
  expect(storedTheme).toBe('dark')

  await page.getByRole('button', { name: 'Odhlásit se' }).click()

  await expect(page).toHaveURL(/\/login\?logged_out=1$/)
  const accessToken = await page.evaluate(() => localStorage.getItem('access_token'))
  expect(accessToken).toBeNull()
})

test('logged out users stay on login when opening protected pages', async ({ page }) => {
  await seedLoggedOut(page)

  await page.goto('/rides')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()
})

test('ride detail supports inviting and accepting passengers', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/rides/ride-1')

  await page.getByLabel('E-mail pro pozvánku').fill('novy.host@example.com')
  await page.getByRole('button', { name: 'Pozvat' }).click()

  await expect(page.getByText('novy.host@example.com', { exact: true })).toBeVisible()

  const existingInviteRow = page.locator('div.list-item-bg').filter({ hasText: 'friend@example.com' })
  await existingInviteRow.getByRole('button', { name: 'Přijmout' }).click()

  await expect(page.getByText('friend@example.com', { exact: true })).toHaveCount(0)
  await expect(page.getByText('novy.host@example.com', { exact: true })).toBeVisible()
})