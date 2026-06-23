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

  await expect(page.getByRole('heading', { name: 'Jízdy', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Zobrazit jízdu: Brno/ })).toBeVisible()

  await page.getByRole('button', { name: /Zobrazit jízdu: Brno/ }).click()

  await expect(page).toHaveURL(/\/rides\/ride-1$/)
  await expect(page.getByRole('heading', { name: 'Brno', level: 1 })).toBeVisible()
  await expect(page.getByText('Rodinný vůz (Minivan)')).toBeVisible()
  await expect(page.getByText('Jan Novák', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pozvánky' })).toBeVisible()
})

test('dashboard quick actions navigate to rides and cars', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ahoj,')

  await page.getByRole('button', { name: 'Nová jízda Naplánovat cestu' }).click()
  await expect(page).toHaveURL(/\/rides\/new$/)
  await expect(page.getByRole('heading', { name: 'Nová jízda' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Moje auta Správa flotily' }).click()
  await expect(page).toHaveURL(/\/cars$/)
  await expect(page.getByRole('heading', { name: 'Moje auta' })).toBeVisible()
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

test('car detail preselects the car when creating a ride', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/cars')
  await page.getByRole('button', { name: /Zobrazit auto Rodinný vůz, typ Minivan/ }).click()

  await expect(page).toHaveURL(/\/cars\/car-1$/)
  await page.getByRole('button', { name: 'Nová jízda s tímto autem' }).click()

  await expect(page).toHaveURL(/\/rides\/new\?car_id=car-1$/)
  await expect(page.getByRole('combobox', { name: 'Auto' })).toHaveValue('car-1')
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

test('settings page exposes theme, document, and demo controls', async ({ page }) => {
  await seedAuthenticated(page)
  await mockAuthenticatedApi(page)

  await page.goto('/settings')

  await expect(page.getByRole('heading', { name: 'Nastavení' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Světlý' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tmavý' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Podle systému' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Zásady ochrany osobních údajů' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Podmínky použití' })).toBeVisible()

  await page.getByRole('button', { name: 'Tmavý' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
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
  await existingInviteRow.getByRole('button', { name: 'Zrušit' }).click()
  await page.locator('dialog').locator('.button-primary').click()

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
  await existingInviteRow.getByRole('button', { name: 'Zrušit' }).click()
  await page.locator('dialog').locator('.dialog-cancel-button').click()

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
  await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()
  const seatButton = page.locator('button').filter({ hasText: '2' }).first()
  await seatButton.click()
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
  
  await autoAssignButton.dblclick()

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

  // Owner is a passenger on their own ride (after transferring driver role)
  const ownerPassengerRide = {
    ...mockRide,
    driver_user_id: 'driver-2',
    car: {
      ...mockCar,
      owner_id: mockUser.id,
      owner_name: mockUser.full_name ?? undefined,
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

  await mockAuthenticatedApi(page, { ride: ownerPassengerRide, rides: [ownerPassengerRide] })
  await page.goto('/rides/ride-1')
  
  // Owner cannot remove themselves from their own ride
  const ownerPassengerRow = page.locator('li').filter({ hasText: 'Majitel' })
  const removeBtn = ownerPassengerRow.locator('button.button-danger')
  await expect(removeBtn).toBeDisabled()
  await expect(removeBtn).toHaveAttribute('title', 'Majitel nemůže být odebrán ze své jízdy.')
})

test.describe('invitation edge cases', () => {
  test('valid pending invitation allows ride access with seat selection flow', async ({ page }) => {
    await seedAuthenticated(page)

    const validToken = 'invite-valid-edge'
    await mockAuthenticatedApi(page, {
      invites: [
        {
          invited_email: 'jan@example.com',
          status: 'Pending',
          created_at: '2026-04-10T12:00:00.000Z',
          token: validToken,
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

    await page.goto(`/rides/ride-1?invite=${encodeURIComponent(validToken)}`)

    await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Brno', level: 1 })).toBeVisible()
  })

  test('expired invitation returns 410 and shows clear error message', async ({ page }) => {
    await seedAuthenticated(page)

    await mockAuthenticatedApi(page, {
      invites: [],
      inviteTokenErrors: {
        'invite-expired-edge': {
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

    await page.goto('/rides/ride-1?invite=invite-expired-edge')

    await expect(page.getByText('Invitation has expired.')).toBeVisible()
    await expect(page.getByText('Jízda nebyla nalezena.')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Brno', level: 1 })).not.toBeVisible()
  })

  test('wrong invite token for ride returns 403 not-part-of-ride', async ({ page }) => {
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

    await page.goto('/rides/ride-1?invite=wrong-token')

    await expect(page.getByText('You are not part of this ride.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Brno', level: 1 })).not.toBeVisible()
  })

  test('invite token without query param is denied for non-participants', async ({ page }) => {
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

    await page.goto('/rides/ride-1')

    await expect(page.getByText('You are not part of this ride.')).toBeVisible()
  })

  test('invite link from notification correctly encodes token in URL', async ({ page }) => {
    await seedAuthenticated(page)

    const tokenWithSpecialChars = 'invite-abc+def/ghi='
    await mockAuthenticatedApi(page, {
      invites: [
        {
          invited_email: 'jan@example.com',
          status: 'Pending',
          created_at: '2026-04-10T12:00:00.000Z',
          token: tokenWithSpecialChars,
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

    await expect(page).toHaveURL(/\/rides\/ride-1\?invite=/)
    const url = page.url()
    expect(url).toContain(encodeURIComponent(tokenWithSpecialChars))
  })

  test('multiple invitations for same ride work independently', async ({ page }) => {
    await seedAuthenticated(page)

    const token1 = 'invite-multi-1'
    const token2 = 'invite-multi-2'
    await mockAuthenticatedApi(page, {
      invites: [
        {
          invited_email: 'jan@example.com',
          status: 'Pending',
          created_at: '2026-04-10T12:00:00.000Z',
          token: token1,
          ride_id: mockRide.id,
        },
        {
          invited_email: 'another@example.com',
          status: 'Pending',
          created_at: '2026-04-11T12:00:00.000Z',
          token: token2,
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

    await page.goto(`/rides/ride-1?invite=${encodeURIComponent(token1)}`)

    await expect(page.getByText('Vyberte sedadlo pro dokončení přijetí pozvánky.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Brno', level: 1 })).toBeVisible()
  })

  test('desktop share modal copies and shares public ingress URL if pending invite is present', async ({ page }) => {
    await seedAuthenticated(page)
    const pendingInviteToken = 'invite-share-test-token'
    await mockAuthenticatedApi(page, {
      invites: [
        {
          invited_email: 'public@sitzy.local',
          status: 'Pending',
          created_at: '2026-04-10T12:00:00.000Z',
          token: pendingInviteToken,
          ride_id: mockRide.id,
        }
      ]
    })

    await page.goto('/rides/ride-1')
    
    // Open the share modal
    await page.getByRole('button', { name: 'Sdílet' }).click()

    // Assert that the share links point to the public /i/:token link
    const twitterLink = page.locator('a[aria-label="Sdílet na X (Twitter)"]')
    const twitterHref = await twitterLink.getAttribute('href')
    expect(twitterHref).toContain(pendingInviteToken)
 
    const waLink = page.locator('a[aria-label="Sdílet na WhatsApp"]')
    const waHref = await waLink.getAttribute('href')
    expect(waHref).toContain(pendingInviteToken)
  })
})