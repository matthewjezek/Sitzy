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

test('accept-then-seat flow finalizes invitation only after seat confirmation', async ({ page }) => {
  await seedAuthenticated(page)

  const pendingInviteToken = 'invite-seat-flow'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1\?invite=invite-seat-flow$/)
  await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' })).toBeDisabled()

  await page.getByRole('button', { name: 'Nechat systém vybrat' }).click()

  await expect(page.getByText('Pozvánka přijata a sedadlo potvrzeno.')).toBeVisible()
  await expect(page).toHaveURL(/\/rides\/ride-1$/)
  await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toHaveCount(0)
})

test('accept-then-seat flow allows manual seat confirmation with seat_position payload', async ({ page }) => {
  await seedAuthenticated(page)

  let acceptedSeatPosition: number | undefined
  const pendingInviteToken = 'invite-seat-manual'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
    onAcceptInvitationRequest: (payload) => {
      acceptedSeatPosition = payload.body.seat_position
    },
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1\?invite=invite-seat-manual$/)
  await page.getByRole('button', { name: /pozice 2/i }).click()
  await expect(page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' })).toBeEnabled()
  await page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' }).click()

  expect(acceptedSeatPosition).toBe(2)
  await expect(page).toHaveURL(/\/rides\/ride-1$/)
  await expect(page.getByText('Pozvánka přijata a sedadlo potvrzeno.')).toBeVisible()
})

test('ride detail with invalid invite token is denied', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page, {
    invites: [],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
  })

  await page.goto('/rides/ride-1?invite=invalid-token')
  await expect(page.getByText('You are not part of this ride.')).toBeVisible()
})

test('ride detail with expired invite token shows expiration error', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page, {
    invites: [],
    inviteTokenErrors: {
      'expired-token': {
        status: 410,
        detail: 'Invitation has expired.',
      },
    },
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
  })

  await page.goto('/rides/ride-1?invite=expired-token')
  await expect(page.getByText('Invitation has expired.')).toBeVisible()
})

test('accept finalization failure keeps invitation pending and seat step open', async ({ page }) => {
  await seedAuthenticated(page)

  const pendingInviteToken = 'invite-seat-fail'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
    acceptInvitationStatus: 409,
    acceptInvitationDetail: 'Seat 2 is not available.',
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1\?invite=invite-seat-fail$/)
  await page.getByRole('button', { name: 'Nechat systém vybrat' }).click()

  await expect(page.getByText('Nepodařilo se dokončit výběr sedadla. Pozvánka zůstává čekající.')).toBeVisible()
  await expect(page).toHaveURL(/\/rides\/ride-1\?invite=invite-seat-fail$/)
  await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()
})

test('past ride invite flow is read-only and hides seat finalization controls', async ({ page }) => {
  await seedAuthenticated(page)

  const pendingInviteToken = 'invite-past-ride'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      departure_time: '2025-01-01T08:30:00.000Z',
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1\?invite=invite-past-ride$/)
  await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Nechat systém vybrat' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Potvrdit vybrané sedadlo' })).toHaveCount(0)
})

test('notification reject removes invite without navigating to ride detail', async ({ page }) => {
  await seedAuthenticated(page)

  const initialInviteToken = 'invite-reject-1'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: initialInviteToken,
        ride_id: mockRide.id,
      },
    ],
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await expect(page.getByRole('button', { name: 'Odmítnout' })).toBeVisible()

  await page.getByRole('button', { name: 'Odmítnout' }).click()

  await expect(page).toHaveURL(/\/rides$/)
  await expect(page.getByText('Žádné nové pozvánky').first()).toBeVisible()
})

test('accept finalization with 401 refresh failure redirects to login expired', async ({ page }) => {
  await seedAuthenticated(page)

  const pendingInviteToken = 'invite-auth-expire'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
    acceptInvitationStatus: 401,
    acceptInvitationDetail: 'Unauthorized',
    refreshStatus: 401,
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()
  await page.getByRole('button', { name: 'Nechat systém vybrat' }).click()

  await expect(page).toHaveURL(/\/login\?expired=1$/)
})

test('accept finalization blocks duplicate submit while request is in flight', async ({ page }) => {
  await seedAuthenticated(page)

  let acceptCalls = 0
  const pendingInviteToken = 'invite-double-submit'
  await mockAuthenticatedApi(page, {
    invites: [
      {
        invited_email: 'jan@example.com',
        status: 'Pending',
        created_at: '2026-04-10T12:00:00.000Z',
        token: pendingInviteToken,
        ride_id: mockRide.id,
      },
    ],
    ride: {
      ...mockRide,
      passengers: [],
      driver_user_id: 'driver-2',
      car: {
        ...mockCar,
        owner_id: 'owner-2',
        owner_name: 'Alena Majitelová',
      },
    },
    acceptInvitationDelayMs: 250,
    onAcceptInvitationRequest: () => {
      acceptCalls += 1
    },
  })

  await page.goto('/rides')
  await page.getByRole('button', { name: 'Otevřít notifikace' }).click()
  await page.getByRole('button', { name: 'Přijmout' }).click()

  const autoAssignButton = page.getByRole('button', { name: 'Nechat systém vybrat' })
  await Promise.allSettled([
    autoAssignButton.click(),
    autoAssignButton.click({ timeout: 250 }),
  ])

  await expect(page.getByText('Pozvánka přijata a sedadlo potvrzeno.')).toBeVisible()
  expect(acceptCalls).toBe(1)
})

test('role matrix shows owner, driver and passenger action visibility correctly', async ({ page }) => {
  await seedAuthenticated(page)

  const ownerRide = {
    ...mockRide,
    driver_user_id: mockUser.id,
    car: {
      ...mockCar,
      owner_id: mockUser.id,
      owner_name: mockUser.full_name ?? undefined,
    },
  }

  await mockAuthenticatedApi(page, { ride: ownerRide, rides: [ownerRide] })
  await page.goto('/rides/ride-1')
  await expect(page.getByRole('button', { name: 'Smazat jízdu' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pozvánky' })).toBeVisible()

  const driverRide = {
    ...mockRide,
    driver_user_id: mockUser.id,
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

  await mockAuthenticatedApi(page, { ride: driverRide, rides: [driverRide] })
  await page.goto('/rides/ride-1')
  await expect(page.getByRole('button', { name: 'Smazat jízdu' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Opustit jízdu' })).toBeDisabled()

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
        seat_position: 3,
        full_name: mockUser.full_name,
        avatar_url: null,
      },
    ],
  }

  await mockAuthenticatedApi(page, { ride: passengerRide, rides: [passengerRide] })
  await page.goto('/rides/ride-1')
  await expect(page.getByRole('button', { name: 'Opustit jízdu' })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Pozvánky' })).toHaveCount(0)
})