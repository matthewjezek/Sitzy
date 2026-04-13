import { type Page } from '@playwright/test'

import type { Car, Invitation, RideOut, User } from '../../src/types/models'

const apiBaseUrl = /localhost:8000/

export const mockUser: User = {
  id: 'user-1',
  full_name: 'Jan Novák',
  email: 'jan@example.com',
  avatar_url: null,
  created_at: '2026-01-01T10:00:00.000Z',
  social_accounts: [{ provider: 'facebook', email: 'jan@example.com', linked_at: '2026-01-01T10:00:00.000Z' }],
}

export const mockCar: Car = {
  id: 'car-1',
  owner_id: mockUser.id,
  name: 'Rodinný vůz',
  layout: 'Minivan',
  owner_name: mockUser.full_name ?? undefined,
}

export const mockRide: RideOut = {
  id: 'ride-1',
  car_id: mockCar.id,
  car_driver_id: 'driver-1',
  driver_user_id: mockUser.id,
  departure_time: '2026-05-01T08:30:00.000Z',
  destination: 'Brno',
  created_at: '2026-04-01T08:30:00.000Z',
  passengers: [
    {
      user_id: mockUser.id,
      seat_position: 2,
      full_name: mockUser.full_name,
      avatar_url: null,
    },
  ],
  car: mockCar,
}

export const mockInvites: Invitation[] = [
  {
    invited_email: 'friend@example.com',
    status: 'Pending',
    created_at: '2026-04-10T12:00:00.000Z',
    token: 'invite-1',
    ride_id: mockRide.id,
  },
]

export async function seedLoggedOut(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('theme')
  })
}

export async function seedAuthenticated(page: Page) {
  await page.addInitScript(token => {
    localStorage.setItem('access_token', token)
    localStorage.removeItem('theme')
  }, 'test-access-token')
}

export async function mockAuthenticatedApi(page: Page, overrides?: {
  rides?: RideOut[]
  ride?: RideOut
  cars?: Car[]
  car?: Car
  invites?: Invitation[]
}) {
  const rides = overrides?.rides ?? [mockRide]
  const ride = overrides?.ride ?? mockRide
  const cars = overrides?.cars ?? [mockCar]
  const car = overrides?.car ?? mockCar
  const invites = overrides?.invites ?? mockInvites

  await page.route(apiBaseUrl, async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname
    const method = route.request().method()

    if (pathname === '/auth/me' && method === 'GET') {
      await route.fulfill({ json: mockUser })
      return
    }

    if (pathname === '/invitations/received' && method === 'GET') {
      await route.fulfill({ json: invites })
      return
    }

    if (pathname === `/invitations/ride/${ride.id}` && method === 'GET') {
      await route.fulfill({ json: invites })
      return
    }

    if (pathname === `/rides/${ride.id}/invite` && method === 'POST') {
      const requestBody = route.request().postDataJSON() as { invited_email?: string }
      const invitedEmail = requestBody.invited_email ?? 'new@example.com'
      await route.fulfill({
        json: {
          invited_email: invitedEmail,
          status: 'Pending',
          created_at: '2026-04-14T12:00:00.000Z',
          token: `invite-${invitedEmail}`,
          ride_id: ride.id,
        } satisfies Invitation,
      })
      return
    }

    if (pathname.startsWith('/invitations/') && pathname.endsWith('/accept') && method === 'POST') {
      await route.fulfill({ status: 200, json: ride })
      return
    }

    if (pathname.startsWith('/invitations/') && pathname.endsWith('/reject') && method === 'POST') {
      await route.fulfill({ status: 200, json: ride })
      return
    }

    if (pathname.startsWith('/invitations/') && method === 'DELETE') {
      await route.fulfill({ status: 200, json: { ok: true } })
      return
    }

    if (pathname === '/rides/' && method === 'GET') {
      await route.fulfill({ json: rides })
      return
    }

    if (pathname === `/rides/${ride.id}` && method === 'GET') {
      await route.fulfill({ json: ride })
      return
    }

    if (pathname === '/cars/' && method === 'GET') {
      await route.fulfill({ json: cars })
      return
    }

    if (pathname === `/cars/${car.id}` && method === 'GET') {
      await route.fulfill({ json: car })
      return
    }

    if (pathname === `/rides/${ride.id}` && method === 'DELETE') {
      await route.fulfill({ status: 200, json: { ok: true } })
      return
    }

    if (pathname === '/auth/delete-account' && method === 'DELETE') {
      await route.fulfill({ status: 200, json: { ok: true } })
      return
    }

    await route.continue()
  })
}