import { useState, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'
import instance from '../api/axios'
import type { RideOut, RideCreate, RideUpdate } from '../types/models';

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

  const toastError = (err: unknown, fallback: string) => {
    const msg = isAxiosError(err)
      ? (err.response?.data?.detail ?? fallback)
      : 'Nastala neočekávaná chyba.'
    toast.error(msg)
  }

  // GET /rides/ – seznam všech jízd
  const fetchMyRides = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await instance.get<RideOut[]>('/rides/')
      setRides(res.data) // TADY JE ZMĚNA: Ukládáme všechno, nic nemažeme
      return res.data
    } catch (err) {
      handleError(err, 'Nepodařilo se načíst jízdy.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // GET /rides/:id
  const fetchRide = useCallback(async (rideId: string, inviteToken?: string) => {
    if (rideId === 'survey-mock-ride') {
      setLoading(true)
      setError(null)
      setNotFound(false)
      
      const userSeat = localStorage.getItem('survey_mock_ride_user_seat')
      const isAccepted = localStorage.getItem('survey_mock_invite_accepted') === 'true'
      
      const passengers = [
        {
          user_id: "survey-mock-passenger-2",
          seat_position: 4,
          full_name: "Jan Smutný",
          avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        }
      ]
      
      if (isAccepted && userSeat) {
        passengers.push({
          user_id: "me",
          seat_position: Number(userSeat),
          full_name: "Můj profil (Pasažér)",
          avatar_url: null
        })
      }
      
      const mockRide: RideOut = {
        id: "survey-mock-ride",
        car_id: "survey-mock-car",
        car_driver_id: "survey-mock-driver-cd",
        driver_user_id: "survey-mock-driver-user",
        departure_time: new Date(Date.now() + 86400000).toISOString(),
        destination: "Praha (Hlavní nádraží)",
        created_at: new Date().toISOString(),
        passengers: passengers,
        car: {
          id: "survey-mock-car",
          owner_id: "survey-mock-driver-user",
          name: "Škoda Octavia IV",
          layout: "Sedan", // Sedan has 5 seats total (1 driver + 4 passengers)
          owner_name: "Petr Novák"
        },
        driver: {
          id: "survey-mock-driver-user",
          full_name: "Petr Novák",
          avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        }
      }
      
      setRide(mockRide)
      setLoading(false)
      return mockRide
    }

    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const url = inviteToken
        ? `/rides/${rideId}?invite_token=${encodeURIComponent(inviteToken)}`
        : `/rides/${rideId}`
      const res = await instance.get<RideOut>(url)
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
    try {
      const res = await instance.post<RideOut>('/rides/', data)
      setRide(res.data)
      return res.data
    } catch (err) {
      toastError(err, 'Nepodařilo se vytvořit jízdu.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // PATCH /rides/:id
  const updateRide = useCallback(async (rideId: string, data: RideUpdate) => {
    setLoading(true)
    try {
      const res = await instance.patch<RideOut>(`/rides/${rideId}`, data)
      setRide(res.data)
      return res.data
    } catch (err) {
      toastError(err, 'Nepodařilo se aktualizovat jízdu.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // DELETE /rides/:id
  const cancelRide = useCallback(async (rideId: string) => {
    setLoading(true)
    // Optimistic update
    setRides(prev => prev.filter(r => r.id !== rideId))
    try {
      await instance.delete(`/rides/${rideId}`)
      setRide(null)
      return true
    } catch (err) {
      // Rollback – refetch
      fetchMyRides()
      toastError(err, 'Nepodařilo se zrušit jízdu.')
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchMyRides])

  // POST /rides/:id/book – explicitní výběr sedadla
  const bookSeat = useCallback(async (rideId: string, seatPosition: number) => {
    if (rideId === 'survey-mock-ride') {
      localStorage.setItem('survey_mock_invite_accepted', 'true')
      localStorage.setItem('survey_mock_ride_user_seat', String(seatPosition))
      const updatedRide = await fetchRide(rideId)
      return updatedRide
    }

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
      toastError(err, 'Nepodařilo se rezervovat sedadlo.')
      return null
    }
  }, [fetchRide])

  // DELETE /rides/:id/book – zrušení rezervace
  const cancelBooking = useCallback(async (rideId: string, seatPosition: number) => {
    if (rideId === 'survey-mock-ride') {
      localStorage.removeItem('survey_mock_invite_accepted')
      localStorage.removeItem('survey_mock_ride_user_seat')
      await fetchRide(rideId)
      return true
    }

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
      toastError(err, 'Nepodařilo se zrušit rezervaci.')
      return false
    }
  }, [fetchRide])

  // POST /rides/:id/transfer-driver – pouze majitel auta
  const transferDriver = useCallback(async (
    rideId: string,
    newDriverId: string,
    previousDriverId: string
  ) => {
    // Optimistic update
    setRide(prev =>
      prev ? { ...prev, driver_user_id: newDriverId } : prev
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
        prev ? { ...prev, driver_user_id: previousDriverId } : prev
      )
      toastError(err, 'Nepodařilo se předat řízení.')
      return null
    }
  }, [])

  // DELETE /rides/:id/leave – odchod z jízdy pro pasažéra
  const leaveRide = useCallback(async (rideId: string, userId: string) => {
    if (rideId === 'survey-mock-ride') {
      localStorage.removeItem('survey_mock_invite_accepted')
      localStorage.removeItem('survey_mock_ride_user_seat')
      await fetchRide(rideId)
      return true
    }

    // Optimistic update
    setRide(prev =>
      prev
        ? {
            ...prev,
            passengers: prev.passengers.filter(p => p.user_id !== userId),
          }
        : prev
    )
    try {
      await instance.delete(`/rides/${rideId}/leave`)
      return true
    } catch (err) {
      await fetchRide(rideId)
      toastError(err, 'Nepodařilo se opustit jízdu.')
      return false
    }
  }, [fetchRide])

  // DELETE /rides/:id/passengers/:userId – odebrání pasažéra majitelem
  const removePassenger = useCallback(async (rideId: string, passengerUserId: string) => {
    // Optimistic update
    setRide(prev =>
      prev
        ? {
            ...prev,
            passengers: prev.passengers.filter(p => p.user_id !== passengerUserId),
          }
        : prev
    )
    try {
      await instance.delete(`/rides/${rideId}/passengers/${passengerUserId}`)
      return true
    } catch (err) {
      await fetchRide(rideId)
      toastError(err, 'Nepodařilo se odebrat pasažéra.')
      return false
    }
  }, [fetchRide])

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
    leaveRide,
    removePassenger,
    resetState,
  }
}