import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { FiPlus, FiChevronRight } from 'react-icons/fi'
import { useCar } from '../hooks/useCar'
import { SedanSvg, CoupeSvg, MinivanSvg } from '../assets/icons'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CarsListSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 max-w-lg mx-auto mt-10 p-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 rounded-xl skeleton-dark" />
      ))}
    </div>
  )
}

// ─── Layout ikona ─────────────────────────────────────────────────────────────

function LayoutIcon({ layout }: { layout: string }) {
  switch (layout) {
    case 'Sedan': return <SedanSvg />
    case 'Coupe': return <CoupeSvg />
    case 'Minivan': return <MinivanSvg />
    default: return null
  }
}

// ─── CarsPage ─────────────────────────────────────────────────────────────────

export default function CarsPage() {
  const navigate = useNavigate()
  const { cars, loading, error, fetchMyCars } = useCar()

  useEffect(() => {
    fetchMyCars()
  }, [fetchMyCars])

  if (loading) return <CarsListSkeleton />

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moje auta</h1>
        <button
          onClick={() => navigate('/cars/new')}
          className="py-2 px-4 rounded-xl button-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          Přidat
        </button>
      </div>

      {/* Chyba */}
      {error && (
        <div className="p-4 rounded-xl status-danger text-sm">
          {error}
        </div>
      )}

      {/* Prázdný stav */}
      {!error && cars.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-gray-500">Zatím nemáte žádné auto.</p>
          <button
            onClick={() => navigate('/cars/new')}
            className="py-2 px-6 rounded-xl button-primary flex items-center gap-2"
          >
            <FiPlus size={18} />
            Přidat první auto
          </button>
        </div>
      )}

      {/* Seznam aut */}
      {cars.length > 0 && (
        <ul className="flex flex-col gap-3">
          {cars.map(car => (
            <li key={car.id}>
              <button
                onClick={() => navigate(`/cars/${car.id}`)}
                className="w-full card card-interactive p-4 flex items-center gap-4 hover-border-accent text-left"
                aria-label={`Zobrazit auto ${car.name}, typ ${car.layout}`}
              >
                <div className="p-2 rounded-xl badge-indigo shrink-0">
                  <LayoutIcon layout={car.layout} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{car.name}</p>
                  <p className="text-sm text-gray-500">{car.layout}</p>
                </div>
                <FiChevronRight className="text-gray-400 shrink-0" size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}