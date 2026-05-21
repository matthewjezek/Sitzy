import { test, expect } from '@playwright/test'

const RIDE_ID = '11111111-1111-1111-1111-111111111111'
const INVITE_TOKEN = 'valid-token'
const RESOLVE_GLOB = `**/invitations/${INVITE_TOKEN}/resolve`

test.describe('Invite ingress route /i/:inviteToken', () => {
  test('unauthenticated user: pre-validate and redirect to /login saving post_login_redirect', async ({ page }) => {
    await page.route(RESOLVE_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ride_id: RIDE_ID,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          destination: 'Testtown',
          departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        }),
      })
    })

    await page.goto(`/i/${INVITE_TOKEN}`)

    await expect(page).toHaveURL(/\/login/)

    const redirect = await page.evaluate(() => localStorage.getItem('post_login_redirect'))
    expect(redirect).toBe(`/rides/${RIDE_ID}?invite=${encodeURIComponent(INVITE_TOKEN)}`)
  })

  test('authenticated user: pre-validate and navigate directly to ride detail', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-jwt-token')
    })

    await page.route(RESOLVE_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ride_id: RIDE_ID,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          destination: 'Testtown',
          departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        }),
      })
    })

    await page.goto(`/i/${INVITE_TOKEN}`)

    await expect(page).toHaveURL(`/rides/${RIDE_ID}?invite=${INVITE_TOKEN}`)
  })
})
