import { test, expect } from '@playwright/test'
import { mockAuthenticatedApi, seedAuthenticated, seedLoggedOut } from './helpers'

const RIDE_ID = '11111111-1111-1111-1111-111111111111'
const INVITE_TOKEN = 'valid-token'
const RESOLVE_GLOB = `**/invitations/${INVITE_TOKEN}/resolve`

test.describe('Invite ingress route /i/:inviteToken', () => {
  test('unauthenticated user: pre-validate and redirect to /login saving post_login_redirect', async ({ page }) => {
    await seedLoggedOut(page)
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

    // Verify InviteLandingPage details are visible
    await expect(page.getByRole('heading', { name: 'Pojeď taky!' })).toBeVisible()
    await expect(page.getByText('Testtown')).toBeVisible()

    // Accept invitation and proceed to login
    await page.getByRole('button', { name: 'Přijmout a vybrat sedadlo' }).click()

    await expect(page).toHaveURL(/\/login/)

    // Verify the invitation banner is visible on the login page
    await expect(page.getByText('Přihlášení k pozvánce')).toBeVisible()

    const redirect = await page.evaluate(() => localStorage.getItem('post_login_redirect'))
    expect(redirect).toBe(`/rides/${RIDE_ID}?invite=${encodeURIComponent(INVITE_TOKEN)}`)
  })

  test('authenticated user: pre-validate, navigate to ride detail and accept invitation successfully', async ({ page }) => {
    await seedAuthenticated(page)
    await mockAuthenticatedApi(page, {
      ride: {
        id: RIDE_ID,
        car: {
          id: 'car-1',
          owner_id: 'owner-2',
          name: 'Rodinný vůz',
          layout: 'Minivan',
        },
        car_id: 'car-1',
        car_driver_id: 'driver-2',
        driver_user_id: 'driver-2',
        departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        destination: 'Testtown',
        created_at: new Date().toISOString(),
        passengers: [],
      },
      invites: [
        {
          invited_email: 'friend@example.com',
          status: 'Pending',
          created_at: new Date().toISOString(),
          token: INVITE_TOKEN,
          ride_id: RIDE_ID,
        }
      ]
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
    await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()

    await page.getByRole('button', { name: 'Nechat systém vybrat' }).click()

    await expect(page.getByText('Pozvánka přijata a sedadlo potvrzeno.')).toBeVisible()
    await expect(page).toHaveURL(`/rides/${RIDE_ID}`)
  })

  test('authenticated user: pre-validate, navigate to ride detail and fail accepting due to email mismatch', async ({ page }) => {
    await seedAuthenticated(page)
    await mockAuthenticatedApi(page, {
      acceptInvitationStatus: 403,
      acceptInvitationDetail: 'This is not your invitation.',
      ride: {
        id: RIDE_ID,
        car: {
          id: 'car-1',
          owner_id: 'owner-2',
          name: 'Rodinný vůz',
          layout: 'Minivan',
        },
        car_id: 'car-1',
        car_driver_id: 'driver-2',
        driver_user_id: 'driver-2',
        departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        destination: 'Testtown',
        created_at: new Date().toISOString(),
        passengers: [],
      },
      invites: [
        {
          invited_email: 'different-email@example.com',
          status: 'Pending',
          created_at: new Date().toISOString(),
          token: INVITE_TOKEN,
          ride_id: RIDE_ID,
        }
      ]
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
    await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()

    await page.getByRole('button', { name: 'Nechat systém vybrat' }).click()

    await expect(page.getByText('Nepodařilo se dokončit výběr sedadla. Pozvánka zůstává čekající.')).toBeVisible()
    await expect(page).toHaveURL(`/rides/${RIDE_ID}?invite=${INVITE_TOKEN}`)
  })
})

