import { test, expect } from '@playwright/test'
import { mockAuthenticatedApi, seedAuthenticated, seedLoggedOut } from './helpers'

test.describe('Survey flow tests', () => {
  test('anonymous user: token initialization and start redirect to login', async ({ page }) => {
    await seedLoggedOut(page)

    // Visit survey landing page with token
    await page.goto('/survey?token=test-survey-token-123')

    // Expect URL query param to be removed but local state to contain it
    await expect(page).toHaveURL(/\/survey$/)
    const token = await page.evaluate(() => localStorage.getItem('survey_token'))
    expect(token).toBe('test-survey-token-123')

    // Verify introduction screen tasks and tips are visible
    await expect(page.getByRole('heading', { name: 'Integrace webových služeb do sociálních sítí' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Během testování vás prosíme o vyzkoušení těchto úkolů:' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Začít průzkum' })).toBeVisible()

    // Start survey redirects to login
    await page.getByRole('button', { name: 'Začít průzkum' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('anonymous user: starts survey from landing page without token generates a random token', async ({ page }) => {
    await seedLoggedOut(page)

    // Visit survey landing page WITHOUT token
    await page.goto('/survey')

    // Verify localStorage does not have token initially
    let token = await page.evaluate(() => localStorage.getItem('survey_token'))
    expect(token).toBeNull()

    // Click "Začít průzkum"
    await page.getByRole('button', { name: 'Začít průzkum' }).click()
    await expect(page).toHaveURL(/\/login/)

    // Verify a random token was generated and saved
    token = await page.evaluate(() => localStorage.getItem('survey_token'))
    expect(token).not.toBeNull()
    expect(token).toMatch(/^pruz-/)
  })

  test('authenticated user: shows continue button on landing page and checklist on dashboard', async ({ page }) => {
    await seedAuthenticated(page)
    await mockAuthenticatedApi(page)

    // Visit survey page with token while already logged in
    await page.goto('/survey?token=test-survey-token-auth')

    // Should NOT show completion screen because they haven't finished tasks
    await expect(page.getByRole('heading', { name: 'Skvělá práce!' })).not.toBeVisible()

    // Should show introduction with "Pokračovat v průzkumu"
    const continueBtn = page.getByRole('button', { name: 'Pokračovat v průzkumu' })
    await expect(continueBtn).toBeVisible()

    // Click continue to go to dashboard
    await continueBtn.click()
    await expect(page).toHaveURL(/\/$/)

    // Checklist widget should be visible on dashboard
    const checklistToggle = page.getByRole('button', { name: /Úkoly \(\d\/\d\)/ })
    await expect(checklistToggle).toBeVisible()

    // Open checklist and verify tasks are listed
    await checklistToggle.click()
    await expect(page.getByText('Úkoly průzkumu')).toBeVisible()
    await expect(page.getByText('Přihlášení (Facebook/X)')).toBeVisible()
    await expect(page.getByText('Vytvoření jízdy')).toBeVisible()
  })

  test('completed survey: shows completion page, clears states on tally redirect', async ({ page }) => {
    await seedLoggedOut(page)

    // Intercept api checkpoint report
    let checkpointReported = false
    await page.route('**/api/checkpoint', async (route) => {
      const postData = route.request().postDataJSON()
      if (postData.checkpointName === 'survey_redirected' && postData.token === 'test-survey-token-completed') {
        checkpointReported = true
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    // Setup completed survey state (only on localhost/127.0.0.1 to avoid interfering with tally.so redirect)
    await page.addInitScript(() => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        localStorage.setItem('survey_token', 'test-survey-token-completed')
        localStorage.setItem('survey_completed', 'true')
        localStorage.setItem('survey_completed_checkpoints', JSON.stringify(['login_oauth', 'create_ride']))
      }
    })

    // Prevent real redirect navigation to tally.so during testing
    await page.route('https://tally.so/**', async (route) => {
      await route.fulfill({ status: 200, body: 'Mock Tally Page' })
    })

    await page.goto('/survey')

    // Should show completion screen
    await expect(page.getByRole('heading', { name: 'Skvělá práce!' })).toBeVisible()
    const tallyBtn = page.getByRole('button', { name: 'Přejít k závěrečnému dotazníku' })
    await expect(tallyBtn).toBeVisible()

    // Setup checkpoint promise
    const checkpointPromise = page.waitForResponse(response =>
      response.url().includes('/api/checkpoint') && response.status() === 200
    )

    // Click tally redirect
    await tallyBtn.click()

    // Wait for checkpoint to resolve
    await checkpointPromise

    // Wait briefly for synchronous localStorage removals to execute before navigation
    await page.waitForTimeout(100)

    expect(checkpointReported).toBe(true)

    // Local survey states should be cleared
    const storedToken = await page.evaluate(() => localStorage.getItem('survey_token'))
    const storedCompleted = await page.evaluate(() => localStorage.getItem('survey_completed'))
    expect(storedToken).toBeNull()
    expect(storedCompleted).toBeNull()
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
})
