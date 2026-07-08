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

test('oauth callback redirects to dashboard upon successful login', async ({ page }) => {
  await seedLoggedOut(page)


  const mockAccessToken = 'mock-access-token-123'

  // Route backend callback endpoint
  await page.route(/\/auth\/oauth\/callback/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: mockAccessToken, token_type: 'bearer' })
    })
  })

  // Mock /auth/me for the user session initialization
  await page.route(/\/auth\/me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        full_name: 'Jan Novák',
        email: 'jan@example.com',
        avatar_url: null,
        social_accounts: []
      })
    })
  })

  // Mock rides and invitations to avoid E2E failures on dashboard redirect
  await page.route(/\/invitations\/received/, async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route(/\/rides/, async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })

  // Navigate to callback page
  await page.goto('/auth/callback?code=code123&state=state123')

  // Expect navigation to complete and redirect to dashboard (with generous 10s timeout)
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 })

  // Verify access_token is set in localStorage
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  expect(token).toBe(mockAccessToken)
})

test('axios interceptor refreshes access token and retries request on 401', async ({ page }) => {
  await seedLoggedOut(page)


  // Seed localStorage with an expired token
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'expired-token-123')
  })

  let refreshCalled = false
  let meCalledAfterRefresh = false

  // Intercept the API requests
  await page.route(/\/auth\/me/, async (route) => {
    const authHeader = route.request().headers()['authorization']
    
    if (authHeader === 'Bearer expired-token-123') {
      // First call fails with 401 Unauthorized
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Token expired' })
      })
    } else if (authHeader === 'Bearer refreshed-token-456') {
      // Second call after refresh succeeds!
      meCalledAfterRefresh = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          full_name: 'Jan Novák',
          email: 'jan@example.com',
          avatar_url: null,
          social_accounts: []
        })
      })
    } else {
      await route.fulfill({ status: 401 })
    }
  })

  // Intercept the refresh token endpoint
  await page.route(/\/auth\/refresh/, async (route) => {
    refreshCalled = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'refreshed-token-456' })
    })
  })

  // Mock rides and invitations to avoid E2E dashboard errors
  await page.route(/\/invitations\/received/, async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route(/\/rides/, async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })

  // Navigate directly to dashboard (triggers GET /auth/me)
  await page.goto('/dashboard')

  // Wait for refresh to be hit (giving Vite time to build and run the app)
  await expect.poll(() => refreshCalled, { timeout: 10000 }).toBe(true)

  // Verify that /auth/me was called with the new token
  await expect.poll(() => meCalledAfterRefresh, { timeout: 10000 }).toBe(true)

  // Verify the new token is saved in localStorage
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  expect(token).toBe('refreshed-token-456')
})