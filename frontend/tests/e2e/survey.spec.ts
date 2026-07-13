import { test, expect } from '@playwright/test'
import { mockAuthenticatedApi, seedAuthenticated, seedLoggedOut } from './helpers'

test.describe('Survey flow tests', () => {
  test('survey landing page: shows completion/thanks and clears any survey tokens', async ({ page }) => {
    await seedLoggedOut(page)

    // Pre-seed localStorage with survey tokens to test auto-clearing
    await page.addInitScript(() => {
      localStorage.setItem('survey_token', 'pre-existing-token')
      localStorage.setItem('survey_completed', 'true')
      localStorage.setItem('survey_completed_checkpoints', JSON.stringify(['login_oauth']))
    })

    // Visit survey page with token query parameter (to verify it doesn't get saved)
    await page.goto('/survey?token=ignored-url-token')

    // Verify title and completion page content
    await expect(page).toHaveTitle('Uživatelský průzkum dokončen - Sitzy')
    await expect(page.getByRole('heading', { name: 'Děkujeme za vaši účast!' })).toBeVisible()
    await expect(page.getByText('Uživatelský průzkum a testování aplikace Sitzy byly úspěšně ukončeny.')).toBeVisible()

    // Verify buttons are visible
    const homeBtn = page.getByRole('button', { name: 'Hlavní stránka' })
    const enterBtn = page.getByRole('button', { name: 'Vstoupit do aplikace' })
    await expect(homeBtn).toBeVisible()
    await expect(enterBtn).toBeVisible()

    // Wait briefly for localStorage side-effects to run on page mount
    await page.waitForTimeout(100)

    // Verify survey tokens were cleared from localStorage
    const storageState = await page.context().storageState()
    const localOrigin = storageState.origins.find(o => o.origin.includes('127.0.0.1') || o.origin.includes('localhost'))
    const storedToken = localOrigin?.localStorage.find(i => i.name === 'survey_token')?.value
    const storedCompleted = localOrigin?.localStorage.find(i => i.name === 'survey_completed')?.value
    expect(storedToken).toBeUndefined()
    expect(storedCompleted).toBeUndefined()

    // Click "Hlavní stránka" and expect redirect to landing page
    await homeBtn.click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('survey mode unlinking: prevents unlinking active provider but allows other', async ({ page }) => {
    await seedAuthenticated(page)
    await mockAuthenticatedApi(page, {
      socialDashboard: {
        accounts: [
          {
            provider: 'facebook',
            social_id: 'fb-jan-001',
            linked_at: '2026-01-01T10:00:00.000Z',
            provider_email: 'jan@example.com',
            has_real_email: true,
            active_sessions: 1,
            last_login_at: '2026-04-12T10:00:00.000Z',
          },
          {
            provider: 'twitter',
            social_id: 'mock-twitter-id',
            linked_at: '2026-01-01T10:00:00.000Z',
            provider_email: 'jan@example.com',
            has_real_email: true,
            active_sessions: 1,
            last_login_at: '2026-04-12T10:00:00.000Z',
          }
        ],
        sessions: [
          {
            id: 'session-1',
            provider: 'facebook',
            created_at: '2026-04-12T09:00:00.000Z',
            expires_at: '2026-04-19T09:00:00.000Z',
            revoked_at: null,
            user_agent: 'Playwright',
            is_current: true,
          }
        ],
        events: []
      }
    })

    // Set survey token so survey injection and mode is active
    await page.addInitScript(() => {
      localStorage.setItem('survey_token', 'test-survey-token-unlink')
    })

    await page.goto('/settings')

    // Navigate to "Propojení" tab
    await page.getByRole('button', { name: 'Propojení' }).click()

    // Helper to find a specific social provider's account card
    const accountCard = (provider: string) =>
      page.locator('div.rounded-xl').filter({
        has: page.locator('p', { hasText: new RegExp(`^${provider}$`, 'i') })
      })

    // Active provider button (Facebook) should show "Přihlášen" and be disabled
    const fbBtn = accountCard('facebook').getByRole('button')
    await expect(fbBtn).toBeDisabled()
    await expect(fbBtn).toHaveText('Přihlášen')

    // Non-active provider button (Twitter) should show "Odpojit" and be enabled
    const twitterBtn = accountCard('twitter').getByRole('button')
    await expect(twitterBtn).toBeEnabled()
    await expect(twitterBtn).toHaveText('Odpojit')

    // Click Odpojit on Twitter and check it succeeds
    await twitterBtn.click()
    await expect(page.getByText('Poskytovatel twitter byl odpojen.')).toBeVisible()

    // The unlinked provider audit event should be visible in the audit trail
    await expect(page.getByText(/twitter · social_provider_unlinked/i)).toBeVisible()
  })

  test('survey mode invitation and seat selection flow: shows mock invite, accepts, and confirms seat selection', async ({ page }) => {
    await seedAuthenticated(page)
    await mockAuthenticatedApi(page, { invites: [] })

    // Set survey token
    await page.addInitScript(() => {
      localStorage.setItem('survey_token', 'test-survey-token-invite')
    })

    await page.goto('/')

    // Expect bell icon to have 1 unread notification
    const bellBtn = page.getByRole('button', { name: 'Otevřít notifikace' }).first()
    await expect(bellBtn).toBeVisible()
    await expect(bellBtn.locator('.unread-count-badge')).toHaveText('1')

    // Click bell icon to open notifications dropdown
    await bellBtn.click()
    await expect(page.getByText('Pozvánka na jízdu')).toBeVisible()

    // Setup intercept for api checkpoint report
    let checkpointReported = false
    await page.route('**/api/checkpoint', async (route) => {
      const postData = route.request().postDataJSON()
      if (postData.checkpointName === 'accept_invite' && postData.token === 'test-survey-token-invite') {
        checkpointReported = true
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    // Click "Přijmout" in notifications
    await page.getByRole('button', { name: 'Přijmout' }).click()

    // Should navigate to /rides/survey-mock-ride?invite=survey-mock-invite-token
    await expect(page).toHaveURL(/\/rides\/survey-mock-ride\?invite=survey-mock-invite-token$/)

    // Verify Skoda Octavia ride details are visible
    await expect(page.getByText('Škoda Octavia IV').first()).toBeVisible()
    await expect(page.getByText('Praha (Hlavní nádraží)').first()).toBeVisible()

    // Seat selector should be visible. We choose the front passenger seat (seat 2, which is empty)
    const seatButton = page.locator('button').filter({ hasText: '2' }).first()
    await seatButton.click()
    await expect(page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' })).toBeEnabled()
    await page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' }).click()

    // Check it succeeds
    await expect(page).toHaveURL(/\/rides\/survey-mock-ride$/)
    await expect(page.getByText('Pozvánka přijata a sedadlo potvrzeno.')).toBeVisible()
    expect(checkpointReported).toBe(true)

    // Check that we are displayed as passenger in the list of passengers
    await expect(page.getByText('Můj profil (Pasažér)')).toBeVisible()
  })
})
