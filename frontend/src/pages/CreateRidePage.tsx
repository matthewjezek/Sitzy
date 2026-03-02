import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useRide } from '../hooks/useRide'
import { useCar } from '../hooks/useCar'
import { rideSchema, type RideFormValues } from '../utils/validation'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreateRideSkeleton() {
  return (
    <div className="animate-pulse max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-violet-200 dark:bg-violet-900" />
    </div>
  )
}

// ─── CreateRidePage ───────────────────────────────────────────────────────────

export default function CreateRidePage() {
  const navigate = useNavigate()
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
      departure_time: '',
      destination: '',
    },
  })

  useEffect(() => {
    fetchMyCars()
  }, [fetchMyCars])

  const onSubmit = async (data: RideFormValues) => {
    setSubmitting(true)
    try {
      const result = await createRide(data)
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
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">Nová jízda</h1>

      {/* Žádné auto */}
      {!carsLoading && cars.length === 0 && (
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm flex flex-col gap-3">
          <p>Nemáte žádné auto. Nejprve přidejte auto.</p>
          <button
            onClick={() => navigate('/cars/new')}
            className="py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition self-start"
          >
            Přidat auto
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Výběr auta */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Auto</label>
          <select
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

        {/* Čas odjezdu */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Čas odjezdu</label>
          <input
            type="datetime-local"
            className={`form-input ${errors.departure_time ? 'border-red-400' : ''}`}
            {...register('departure_time')}
          />
          {errors.departure_time && (
            <p className="text-red-500 text-sm">{errors.departure_time.message}</p>
          )}
        </div>

        {/* Cíl */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Cíl</label>
          <input
            type="text"
            placeholder="Praha"
            className={`form-input ${errors.destination ? 'border-red-400' : ''}`}
            {...register('destination')}
          />
          {errors.destination && (
            <p className="text-red-500 text-sm">{errors.destination.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || cars.length === 0}
          className="w-full py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50"
        >
          {submitting ? 'Vytvářím...' : 'Vytvořit jízdu'}
        </button>

      </form>
    </div>
  )
}