import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useRide } from '../hooks/useRide'
import { useCar } from '../hooks/useCar'
import { rideSchema, type RideFormValues } from '../utils/validation'
import { localInputToUTC, nowForDatetimeInput } from '../utils/datetime'

function CreateRideSkeleton() {
  return (
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="animate-pulse page-content max-w-lg mx-auto w-full p-6 flex flex-col gap-6">
        <div className="h-8 w-48 rounded skeleton-dark mx-auto" />
        <div className="h-10 rounded-lg skeleton-dark" />
        <div className="h-10 rounded-lg skeleton-dark" />
        <div className="h-10 rounded-lg skeleton-dark" />
        <div className="h-10 rounded-lg skeleton-dark" />
      </div>
    </div>
  )
}

export default function CreateRidePage() {
  const navigate = useNavigate()
  const today = nowForDatetimeInput()
  const [searchParams] = useSearchParams()
  const preselectedCarId = searchParams.get('car_id') ?? ''

  const { createRide } = useRide()
  const { cars, loading: carsLoading, fetchMyCars } = useCar()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RideFormValues>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      car_id: preselectedCarId,
      departure_time: today,
      destination: '',
    },
  })

  useEffect(() => {
    fetchMyCars()
    document.title = 'Sitzy - Nová jízda'
  }, [fetchMyCars])

  const onSubmit = async (data: RideFormValues) => {
    setSubmitting(true)
    try {
      const result = await createRide({
        ...data,
        departure_time: localInputToUTC(data.departure_time),
      })
      if (result) {
        toast.success('Jízda byla vytvořena.')
        navigate(`/rides/${result.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (carsLoading) return <CreateRideSkeleton />

  return (
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto w-full p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">Nová jízda</h1>

      
      {!carsLoading && cars.length === 0 && (
        <div className="p-4 rounded-xl status-warning text-sm flex flex-col gap-3">
          <p>Nemáte žádné auto. Nejprve přidejte auto.</p>
          <button
            onClick={() => navigate('/cars/new')}
            className="py-2 px-4 rounded-xl button-primary self-start"
          >
            Přidat auto
          </button>
        </div>
      )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        
        <div className="flex flex-col gap-1">
          <label htmlFor="car-select" className="font-medium text-sm">Auto</label>
          <select
            id="car-select"
            className={`form-input ${errors.car_id ? 'border-red-400' : ''}`}
            {...register('car_id')}
          >
            <option value="">Vyberte auto</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.name} ({car.layout})
              </option>
            ))}
          </select>
          {errors.car_id && (
            <p className="text-red-500 text-sm">{errors.car_id.message}</p>
          )}
        </div>

        
        <div className="flex flex-col gap-1">
          <label htmlFor="departure-time" className="font-medium text-sm">Čas odjezdu</label>
          <input
            id="departure-time"
            type="datetime-local"
            min={today}
            required
            className={`form-input ${errors.departure_time ? 'border-red-400' : ''}`}
            {...register('departure_time')}
          />
          {errors.departure_time && (
            <p className="text-red-500 text-sm">{errors.departure_time.message}</p>
          )}
        </div>

        
        <div className="flex flex-col gap-1">
          <label htmlFor="destination" className="font-medium text-sm">Cíl</label>
          <input
            id="destination"
            type="text"
            placeholder="Praha"
            required
            className={`form-input ${errors.destination ? 'border-red-400' : ''}`}
            {...register('destination')}
          />
          {errors.destination && (
            <p className="text-red-500 text-sm">{errors.destination.message}</p>
          )}
        </div>

        
          <button
            type="submit"
            disabled={submitting || cars.length === 0}
            className="w-full py-2 px-4 rounded-xl button-primary flex items-center justify-center"
          >
            {submitting ? 'Vytvářím...' : 'Vytvořit jízdu'}
          </button>

        </form>
      </div>
    </div>
  )
}