import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { FiEdit, FiTrash, FiPlus } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useCar } from '../hooks/useCar'
import { SedanSvg, CoupeSvg, MinivanSvg } from '../assets/icons'

function CarDetailSkeleton() {
  return (
    <div className="animate-pulse max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <div className="h-8 w-48 rounded skeleton-dark mx-auto" />
      <div className="h-32 rounded-xl skeleton-dark" />
      <div className="h-10 rounded-lg skeleton-dark" />
      <div className="flex gap-3">
        <div className="flex-1 h-10 rounded-lg skeleton-dark" />
        <div className="w-10 h-10 rounded-lg skeleton-dark" />
        <div className="w-10 h-10 rounded-lg skeleton-dark" />
      </div>
    </div>
  )
}

function LayoutIcon({ layout }: { layout: string }) {
  switch (layout) {
    case 'Sedan': return <SedanSvg />
    case 'Coupe': return <CoupeSvg />
    case 'Minivan': return <MinivanSvg />
    default: return null
  }
}

export default function CarDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { car, loading, error, notFound, fetchCarById, deleteCar } = useCar()

  useEffect(() => {
    if (id) fetchCarById(id)
  }, [id, fetchCarById])

  const handleDelete = async () => {
    if (!car) return
    if (!window.confirm('Opravdu chcete smazat toto auto? Tato akce je nevratná.')) return
    const success = await deleteCar(car.id)
    if (success) {
      toast.success('Auto bylo smazáno.')
      navigate('/cars')
    }
  }

  document.title = car ? `Sitzy - ${car.name}` : 'Sitzy - Auto'

  if (loading) return <CarDetailSkeleton />

  if (error) return (
    <div className="text-red-500 text-center mt-10">{error}</div>
  )

  if (notFound || !car) return (
    <div className="max-w-lg mx-auto mt-10 p-6 text-center flex flex-col gap-4">
      <p className="text-gray-500">Auto nebylo nalezeno.</p>
      <button
        onClick={() => navigate('/cars')}
        className="py-2 px-4 rounded-xl button-primary"
      >
        Zpět na auta
      </button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">

      <div className="card p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl badge-indigo">
          <LayoutIcon layout={car.layout} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{car.name}</h1>
          <p className="text-sm text-secondary">{car.layout}</p>
          {car.owner_name && (
            <p className="text-xs text-accent mt-1">Majitel: {car.owner_name}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate(`/rides/new?car_id=${car.id}`)}
        className="w-full py-3 px-4 rounded-xl button-primary flex items-center justify-center gap-2"
      >
        <FiPlus size={20} />
        Nová jízda s tímto autem
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/cars/${car.id}/edit`)}
          className="flex-1 py-2 px-4 rounded-xl button-secondary hover-opacity-80 flex items-center justify-center gap-2"
        >
          <FiEdit size={18} />
          Upravit
        </button>
        <button
          onClick={handleDelete}
          className="py-2 px-4 rounded-xl button-danger hover-opacity-80 flex items-center justify-center gap-2"
        >
          <FiTrash size={18} />
          Smazat
        </button>
      </div>

    </div>
  )
}