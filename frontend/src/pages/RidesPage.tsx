import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FiPlus, FiChevronRight, FiClock, FiMapPin, FiList, FiSearch } from 'react-icons/fi'
import { useRide } from '../hooks/useRide'
import { useAuth } from '../hooks/useAuth'
import { formatLocalDateTime } from '../utils/datetime'

type TimeFilter = 'all_time' | 'upcoming' | 'history'
type RoleFilter = 'all_roles' | 'organizing' | 'participating'
type SortBy = 'date_asc' | 'date_desc' | 'alpha'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RidesListSkeleton() {
  return (
    <div className="list-container list-none">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 rounded-xl skeleton-dark animate-pulse" aria-hidden="true" />
      ))}
    </div>
  )
}

// ─── RideStatusBadge ──────────────────────────────────────────────────────────
function RideStatusBadge({ departureTime }: { departureTime: string }) {
  const now = new Date()
  const departure = new Date(departureTime)
  const diffMs = departure.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full list-item-bg text-muted">Proběhla</span>
  }
  if (diffHours < 24) {
    return <span className="text-xs px-2 py-0.5 rounded-full status-success">Brzy</span>
  }
  return <span className="text-xs px-2 py-0.5 rounded-full status-info">Nadcházející</span>
}

// ─── RidesPage ────────────────────────────────────────────────────────────────
export default function RidesPage() {
  const navigate = useNavigate()
  const { rides, loading, error, fetchMyRides } = useRide()
  const { user } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all_roles')
  // Změněno podle tvého zadání - defaultně se řadí od nejnovější
  const [sortBy, setSortBy] = useState<SortBy>('date_desc')

  useEffect(() => {
    fetchMyRides()
    document.title = 'Sitzy - Jízdy'
  }, [fetchMyRides])

  // 1. Zpracování dat
  const processedRides = () => {
    const now = new Date()
    
    let result = rides.filter(ride => {
      const isPast = new Date(ride.departure_time) < now
      
      if (timeFilter === 'upcoming' && isPast) return false
      if (timeFilter === 'history' && !isPast) return false

      if (roleFilter === 'organizing' && ride.driver_user_id !== user?.id) return false
      console.log('Ride:', ride.id, 'Passengers:', ride.passengers.map(p => p.user_id), 'User ID:', user?.id, 'Driver ID:', ride.driver_user_id)
      if (roleFilter === 'participating' && !ride.passengers.some(p => p.user_id === user?.id)) return false

      return true
    })

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(ride => 
        ride.destination.toLowerCase().includes(lowerQuery) || 
        (ride.car?.name || '').toLowerCase().includes(lowerQuery)
      )
    }

    result.sort((a, b) => {
      const timeA = new Date(a.departure_time).getTime()
      const timeB = new Date(b.departure_time).getTime()

      if (sortBy === 'date_asc') return timeA - timeB
      if (sortBy === 'date_desc') return timeB - timeA
      if (sortBy === 'alpha') return a.destination.localeCompare(b.destination, 'cs')
      return 0
    })

    return result
  }

  const displayedRides = processedRides()

  // 2. Vykreslení obsahu
  const renderContent = () => {
    if (loading) return <RidesListSkeleton />
    if (error) return <div className="p-4 rounded-xl status-danger text-sm" role="alert">{error}</div>

    if (displayedRides.length === 0) {
      return (
        <div className="empty-state card mt-4">
          <div className="empty-state-icon">
            <FiList size={28} aria-hidden="true" />
          </div>
          <h3 className="empty-state-title">Žádné jízdy</h3>
          <p className="empty-state-description">Pro zadané filtry nebyly nalezeny žádné výsledky.</p>
          {timeFilter === 'upcoming' && searchQuery === '' && (
            <button 
              onClick={() => navigate('/rides/new')} 
              className="button-primary flex items-center gap-2 mx-auto mt-4"
            >
              <FiPlus size={18} aria-hidden="true" /> Naplánovat první jízdu
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="list-container list-none">
        {displayedRides.map(ride => (
          <button
            key={ride.id}
            onClick={() => navigate(`/rides/${ride.id}`)}
            className="list-item items-center gap-4 text-left w-full"
            aria-label={`Zobrazit jízdu: ${ride.destination}, odjezd ${formatLocalDateTime(ride.departure_time)}`}
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FiMapPin size={14} className="text-accent shrink-0" aria-hidden="true" />
                <p className="font-semibold truncate">{ride.destination}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiClock size={14} className="text-muted shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted">{formatLocalDateTime(ride.departure_time)}</p>
              </div>
              {ride.car && <p className="text-xs text-light mt-1">{ride.car.name}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <RideStatusBadge departureTime={ride.departure_time} />
              <FiChevronRight className="text-muted" size={20} aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto w-full flex flex-col gap-6">

        {/* Hlavička */}
        <div className="flex items-center justify-between">
          <h1 className="page-title">Jízdy</h1>
          <button 
            onClick={() => navigate('/rides/new')} 
            className="button-primary flex items-center gap-2"
          >
            <FiPlus size={18} aria-hidden="true" /> Nová jízda
          </button>
        </div>

        {/* Ovládací panel */}
        {!error && rides.length > 0 && (
          <section className="card p-4 flex flex-col gap-4" aria-label="Filtrování a vyhledávání jízd">
            
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
              <input
                type="text"
                aria-label="Hledat cíl nebo auto"
                placeholder="Hledat cíl nebo auto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10" 
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                aria-label="Filtrovat podle času"
                value={timeFilter} 
                onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                className="form-input flex-1 cursor-pointer py-2"
              >
                <option value="all_time">Všechny časy</option>
                <option value="upcoming">Aktuální</option>
                <option value="history">Historie</option>
              </select>

              <select 
                aria-label="Filtrovat podle role"
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value as RoleFilter)}
                className="form-input flex-1 cursor-pointer py-2"
              >
                <option value="all_roles">Všechny role</option>
                <option value="organizing">Organizuji</option>
                <option value="participating">Jedu</option>
              </select>

              <select 
                aria-label="Řazení výsledků"
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="form-input flex-1 cursor-pointer py-2"
              >
                {/* Změněno pořadí podle tvého vzoru */}
                <option value="alpha">A-Z</option>
                <option value="date_desc">Od nejnovější</option>
                <option value="date_asc">Od nejstarší</option>
              </select>
            </div>

          </section>
        )}

        {/* Obsah */}
        {renderContent()}

      </div>
    </div>
  )
}