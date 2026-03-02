import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useCar } from '../hooks/useCar'
import { carSchema, type CarFormValues } from '../utils/validation'
import { SedanSvg, CoupeSvg, MinivanSvg } from '../assets/icons'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CreateCarSkeleton() {
  return (
    <div className="animate-pulse max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 mx-auto" />
      <div className="flex gap-4 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-violet-200 dark:bg-violet-900" />
    </div>
  )
}

// ─── CreateCarPage ────────────────────────────────────────────────────────────

const LAYOUTS = [
  { value: 'Sedan', label: 'Sedan', description: '4 místa', icon: <SedanSvg /> },
  { value: 'Coupe', label: 'Kupé', description: '2 místa', icon: <CoupeSvg /> },
  { value: 'Minivan', label: 'Minivan', description: '7 míst', icon: <MinivanSvg /> },
]

export default function CreateCarPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { createCar, updateCar, fetchCarById, loading } = useCar()
  const [submitting, setSubmitting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: { name: '', layout: 'Sedan' },
  })

  const layout = watch('layout')

  // Pokud editace – načti existující auto
  useEffect(() => {
    if (!isEdit || !id) return
    fetchCarById(id).then(car => {
      if (car) {
        setValue('name', car.name)
        setValue('layout', car.layout)
      }
    }).finally(() => setInitialLoading(false))
  }, [isEdit, id, fetchCarById, setValue])

  const onSubmit = async (data: CarFormValues) => {
    setSubmitting(true)
    try {
      if (isEdit && id) {
        const result = await updateCar(id, data)
        if (result) {
          toast.success('Auto bylo upraveno.')
          navigate(`/cars/${id}`)
        }
      } else {
        const result = await createCar(data)
        if (result) {
          toast.success('Auto bylo vytvořeno.')
          navigate(`/cars/${result.id}`)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (initialLoading) return <CreateCarSkeleton />

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center">
        {isEdit ? 'Upravit auto' : 'Přidat auto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Layout výběr */}
        <div className="flex gap-4 justify-center flex-wrap">
          {LAYOUTS.map(l => (
            <label
              key={l.value}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition
                ${layout === l.value
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                }`}
            >
              <input
                type="radio"
                value={l.value}
                className="sr-only"
                {...register('layout')}
              />
              {l.icon}
              <span className="font-medium text-sm">{l.label}</span>
              <span className="text-xs text-gray-500">{l.description}</span>
            </label>
          ))}
        </div>
        {errors.layout && <p className="text-red-500 text-sm">{errors.layout.message}</p>}

        {/* Název auta */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-sm">Název auta</label>
          <input
            type="text"
            placeholder="Fabián"
            className={`form-input ${errors.name ? 'border-red-400' : ''}`}
            {...register('name')}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition disabled:opacity-50"
        >
          {submitting ? 'Ukládám...' : isEdit ? 'Uložit změny' : 'Vytvořit auto'}
        </button>

      </form>
    </div>
  )
}
