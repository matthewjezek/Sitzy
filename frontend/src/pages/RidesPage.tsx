import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { FiPlus, FiChevronRight, FiClock, FiMapPin } from 'react-icons/fi'
import { useRide } from '../hooks/useRide'
import { formatLocalDateTime } from '../utils/datetime'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RidesListSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 max-w-lg mx-auto mt-10 p-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 rounded-xl skeleton-dark" />
      ))}
    </div>
  )
}

// ─── RideCard ─────────────────────────────────────────────────────────────────

function RideStatusBadge({ departureTime }: { departureTime: string }) {
  const now = new Date()
  const departure = new Date(departureTime)
  const diffMs = departure.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full list-item-bg text-muted">
        Proběhla
      </span>
    )
  }
  if (diffHours < 24) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full status-success">
        Brzy
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full status-info">
      Nadcházející
    </span>
  )
}

// ─── RidesPage ────────────────────────────────────────────────────────────────

export default function RidesPage() {
  const navigate = useNavigate()
  const { rides, loading, error, fetchMyRides } = useRide()

  useEffect(() => {
    fetchMyRides()
  }, [fetchMyRides])

  if (loading) return <RidesListSkeleton />

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jízdy</h1>
        <button
          onClick={() => navigate('/rides/new')}
          className="py-2 px-4 rounded-xl button-primary flex items-center gap-2"
        >
          <FiPlus size={18} />
          Nová jízda
        </button>
      </div>

      {/* Chyba */}
      {error && (
        <div className="p-4 rounded-xl status-danger text-sm">
          {error}
        </div>
      )}

      {/* Prázdný stav */}
      {!error && rides.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted">Zatím nemáte žádné jízdy.</p>
          <button
            onClick={() => navigate('/rides/new')}
            className="py-2 px-6 rounded-xl button-primary flex items-center gap-2"
          >
            <FiPlus size={18} />
            Naplánovat první jízdu
          </button>
        </div>
      )}

      {/* Seznam jízd */}
      {rides.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rides.map(ride => (
            <li key={ride.id}>
              <button
                onClick={() => navigate(`/rides/${ride.id}`)}
                className="w-full card card-interactive p-4 flex items-center gap-4 hover-border-accent text-left"
                aria-label={`Zobrazit jízdu do ${ride.destination}, odjezd ${formatLocalDateTime(ride.departure_time)}`}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FiMapPin size={14} className="text-accent shrink-0" />
                    <p className="font-semibold truncate">{ride.destination}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={14} className="text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500">
                      {formatLocalDateTime(ride.departure_time)}
                    </p>
                  </div>
                  {ride.car && (
                    <p className="text-xs text-gray-400">{ride.car.name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <RideStatusBadge departureTime={ride.departure_time} />
                  <FiChevronRight className="text-gray-400" size={20} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}