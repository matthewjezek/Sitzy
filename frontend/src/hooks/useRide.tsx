import { useState, useCallback } from 'react'
import { isAxiosError } from 'axios'
import instance from '../api/axios'
import type { CarOut } from './useCar'

export interface PassengerOut {
  user_id: string
  seat_position: number
  full_name: string | null
  avatar_url: string | null
}

export interface RideOut {
  id: string
  car_id: string
  car_driver_id: string
  departure_time: string
  destination: string
  created_at: string
  passengers: PassengerOut[]
  car: CarOut | null
}

export interface RideCreate {
  car_id: string
  departure_time: string
  destination: string
}

export interface RideUpdate {
  departure_time: string
  destination: string
}

export function useRide() {
  const [ride, setRide] = useState<RideOut | null>(null)
  const [rides, setRides] = useState<RideOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleError = (err: unknown, fallback: string) => {
    setError(
      isAxiosError(err)
        ? (err.response?.data?.detail ?? fallback)
        : 'Nastala neočekávaná chyba.'
    )
  }

  // GET /rides/ – seznam jízd (filtr nadcházejících na FE)
  const fetchMyRides = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await instance.get<RideOut[]>('/rides/')
      const now = new Date()
      const upcoming = res.data.filter(
        r => new Date(r.departure_time) > now
      )
      setRides(upcoming)
      return upcoming
    } catch (err) {
      handleError(err, 'Nepodařilo se načíst jízdy.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // GET /rides/:id
  const fetchRide = useCallback(async (rideId: string) => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const res = await instance.get<RideOut>(`/rides/${rideId}`)
      setRide(res.data)
      return res.data
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
        setRide(null)
      } else {
        handleError(err, 'Nepodařilo se načíst jízdu.')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // POST /rides/
  const createRide = useCallback(async (data: RideCreate) => {
    setLoading(true)
    setError(null)
    try {
      const res = await instance.post<RideOut>('/rides/', data)
      setRide(res.data)
      return res.data
    } catch (err) {
      handleError(err, 'Nepodařilo se vytvořit jízdu.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // PATCH /rides/:id
  const updateRide = useCallback(async (rideId: string, data: RideUpdate) => {
    setLoading(true)
    setError(null)
    try {
      const res = await instance.patch<RideOut>(`/rides/${rideId}`, data)
      setRide(res.data)
      return res.data
    } catch (err) {
      handleError(err, 'Nepodařilo se aktualizovat jízdu.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // DELETE /rides/:id
  const cancelRide = useCallback(async (rideId: string) => {
    setLoading(true)
    setError(null)
    // Optimistic update
    setRides(prev => prev.filter(r => r.id !== rideId))
    try {
      await instance.delete(`/rides/${rideId}`)
      setRide(null)
      return true
    } catch (err) {
      // Rollback – refetch
      fetchMyRides()
      handleError(err, 'Nepodařilo se zrušit jízdu.')
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchMyRides])

  // POST /rides/:id/book – explicitní výběr sedadla
  const bookSeat = useCallback(async (rideId: string, seatPosition: number) => {
    setError(null)
    // Optimistic update
    setRide(prev =>
      prev
        ? {
            ...prev,
            passengers: [
              ...prev.passengers,
              { user_id: 'me', seat_position: seatPosition, full_name: null, avatar_url: null },
            ],
          }
        : prev
    )
    try {
      const res = await instance.post<RideOut>(`/rides/${rideId}/book`, {
        seat_position: seatPosition,
      })
      setRide(res.data)  // Nahradí optimistic update reálnými daty
      return res.data
    } catch (err) {
      // Rollback
      setRide(prev =>
        prev
          ? {
              ...prev,
              passengers: prev.passengers.filter(
                p => p.seat_position !== seatPosition
              ),
            }
          : prev
      )
      handleError(err, 'Nepodařilo se rezervovat sedadlo.')
      return null
    }
  }, [])

  // DELETE /rides/:id/book – zrušení rezervace
  const cancelBooking = useCallback(async (rideId: string, seatPosition: number) => {
    setError(null)
    // Optimistic update
    setRide(prev =>
      prev
        ? {
            ...prev,
            passengers: prev.passengers.filter(
              p => p.seat_position !== seatPosition
            ),
          }
        : prev
    )
    try {
      await instance.delete(`/rides/${rideId}/book`)
      return true
    } catch (err) {
      // Rollback – refetch
      await fetchRide(rideId)
      handleError(err, 'Nepodařilo se zrušit rezervaci.')
      return false
    }
  }, [fetchRide])

  // POST /rides/:id/transfer-driver – pouze majitel auta
  const transferDriver = useCallback(async (
    rideId: string,
    newDriverId: string,
    previousDriverId: string
  ) => {
    setError(null)
    // Optimistic update
    setRide(prev =>
      prev ? { ...prev, car_driver_id: newDriverId } : prev
    )
    try {
      const res = await instance.post<RideOut>(`/rides/${rideId}/transfer-driver`, {
        new_driver_id: newDriverId,
      })
      setRide(res.data)
      return res.data
    } catch (err) {
      // Rollback
      setRide(prev =>
        prev ? { ...prev, car_driver_id: previousDriverId } : prev
      )
      handleError(err, 'Nepodařilo se předat řízení.')
      return null
    }
  }, [])

  const resetState = useCallback(() => {
    setRide(null)
    setRides([])
    setLoading(false)
    setError(null)
    setNotFound(false)
  }, [])

  return {
    ride,
    rides,
    loading,
    error,
    notFound,
    fetchMyRides,
    fetchRide,
    createRide,
    updateRide,
    cancelRide,
    bookSeat,
    cancelBooking,
    transferDriver,
    resetState,
  }
}