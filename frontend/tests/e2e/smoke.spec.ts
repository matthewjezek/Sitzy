import { test, expect } from '@playwright/test'
import { seedLoggedOut } from './helpers'

test('login page renders provider actions', async ({ page }) => {
  await seedLoggedOut(page)

  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Přihlásit se přes X' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Přihlásit se přes Facebook' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ochrana osobních údajů' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Podmínky použití' })).toBeVisible()
})

test('protected rides route redirects to login without auth token', async ({ page }) => {
  await seedLoggedOut(page)

  await page.goto('/rides')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Přihlášení' })).toBeVisible()
})