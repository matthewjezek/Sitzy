import { expect, test } from '@playwright/test'

import {
  mockCar,
  mockAuthenticatedApi,
  mockRide,
  mockUser,
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

test('ride detail supports inviting and canceling pending invites', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/rides/ride-1')

  await page.getByLabel('E-mail pro pozvánku').fill('novy.host@example.com')
  await page.getByRole('button', { name: 'Pozvat' }).click()

  await expect(page.getByText('novy.host@example.com', { exact: true })).toBeVisible()

  const existingInviteRow = page.locator('div.list-item-bg').filter({ hasText: 'friend@example.com' })
  page.once('dialog', dialog => dialog.accept())
  await existingInviteRow.getByRole('button', { name: 'Zrušit' }).click()

  await expect(page.getByText('friend@example.com', { exact: true })).toHaveCount(0)
  await expect(page.getByText('novy.host@example.com', { exact: true })).toBeVisible()
})

test('ride detail prevents duplicate invitation for same email', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/rides/ride-1')

  await page.getByLabel('E-mail pro pozvánku').fill('friend@example.com')
  await page.getByRole('button', { name: 'Pozvat' }).click()

  await expect(page.getByText('friend@example.com', { exact: true })).toHaveCount(1)
  await expect(page.getByText('novy.host@example.com', { exact: true })).toHaveCount(0)
})

test('ride detail keeps invite when cancel confirmation is dismissed', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/rides/ride-1')

  const existingInviteRow = page.locator('div.list-item-bg').filter({ hasText: 'friend@example.com' })
  page.once('dialog', dialog => dialog.dismiss())
  await existingInviteRow.getByRole('button', { name: 'Zrušit' }).click()

  await expect(page.getByText('friend@example.com', { exact: true })).toBeVisible()
})

test('ride detail hides invite management for non-owner passenger', async ({ page }) => {
  await seedAuthenticated(page)

  const passengerRide = {
    ...mockRide,
    driver_user_id: 'driver-2',
    car: {
      ...mockCar,
      owner_id: 'owner-2',
      owner_name: 'Alena Majitelová',
    },
    passengers: [
      {
        user_id: mockUser.id,
        seat_position: 2,
        full_name: mockUser.full_name,
        avatar_url: null,
      },
    ],
  }

  await mockAuthenticatedApi(page, { ride: passengerRide, rides: [passengerRide] })

  await page.goto('/rides/ride-1')

  await expect(page.getByRole('button', { name: 'Opustit jízdu' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pozvánky' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Smazat jízdu' })).toHaveCount(0)
})