import { forwardRef, useMemo, useState, useRef, useEffect } from 'react'
import { FiClock } from 'react-icons/fi'
import { BiCar } from 'react-icons/bi'
import logoLight from '../assets/sitzy_logo_full.svg'
import logoDark from '../assets/sitzy_logo_full_dark.svg'
import { formatLocalDateTime } from '../utils/datetime'
import { mapCarLayoutForSeatRenderer, getSeatCapacity } from '../utils/seatUtils'
import SeatRenderer, { type SeatData } from './SeatRenderer'
import type { RideOut } from '../types/models'

export interface RideSummaryCardProps {
  ride: RideOut
  anonymized: boolean
  generatedAt?: string
  watermarkText?: string
}

export const RideSummaryCard = forwardRef<HTMLDivElement, RideSummaryCardProps>(
  ({ ride, anonymized, generatedAt, watermarkText = 'Sitzy Demo' }, ref) => {
    const seatCapacity = getSeatCapacity(ride?.car?.layout)
    const occupiedCount = Math.min(seatCapacity, (ride?.passengers?.length ?? 0) + 1)
    const storyDriverName = ride?.driver?.full_name ?? ride?.car?.owner_name ?? 'Řidič'
    const timestamp = generatedAt || new Date().toISOString()

    const storyPassengers = useMemo(() => {
      return [...(ride?.passengers ?? [])]
        .sort((left, right) => {
          const leftSeat = left.seat_position ?? Number.POSITIVE_INFINITY
          const rightSeat = right.seat_position ?? Number.POSITIVE_INFINITY
          if (leftSeat !== rightSeat) return leftSeat - rightSeat
          return left.full_name?.localeCompare(right.full_name ?? '', 'cs') ?? 0
        })
        .map((passenger, index) => ({
          id: passenger.user_id,
          seat: passenger.seat_position,
          name: anonymized ? `Pasažér ${index + 1}` : passenger.full_name ?? 'Neznámý',
          avatar: anonymized ? null : passenger.avatar_url,
          isDriver: false,
        }))
    }, [ride?.passengers, anonymized])

    const storySeatData = useMemo(() => {
      return (ride?.passengers ?? []).map((passenger) => ({
        position: passenger.seat_position,
        user_name: anonymized ? undefined : passenger.full_name ?? undefined,
        avatar_url: anonymized ? undefined : (passenger.avatar_url ?? undefined),
        occupied: true,
      })) as SeatData[]
    }, [ride?.passengers, anonymized])

    const storyPeople = useMemo(() => {
      const driver = {
        id: 'driver',
        seat: 1,
        name: anonymized ? 'Řidič' : storyDriverName,
        avatar: anonymized ? null : (ride?.driver?.avatar_url ?? null),
        isDriver: true,
      }
      return [driver, ...storyPassengers]
    }, [ride?.driver?.avatar_url, storyDriverName, anonymized, storyPassengers])

    const titleRef = useRef<HTMLHeadingElement>(null)
    const [maxVisiblePeople, setMaxVisiblePeople] = useState(4)

    useEffect(() => {
      const measure = () => {
        if (titleRef.current) {
          const height = titleRef.current.clientHeight
          // Adjust passenger list rows based on destination title wrap lines to prevent card overflow
          if (height <= 28) {
            setMaxVisiblePeople(6) // 1 line title: show up to 6 passengers (3 rows)
          } else if (height <= 52) {
            setMaxVisiblePeople(4) // 2 lines title: show up to 4 passengers (2 rows)
          } else {
            setMaxVisiblePeople(2) // 3+ lines title: show up to 2 passengers (1 row)
          }
        }
      }

      measure()
      const timer = setTimeout(measure, 50)
      window.addEventListener('resize', measure)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', measure)
      }
    }, [ride.destination])

    const visiblePeople = useMemo(() => {
      if (storyPeople.length > maxVisiblePeople) {
        return storyPeople.slice(0, maxVisiblePeople - 1)
      }
      return storyPeople
    }, [storyPeople, maxVisiblePeople])

    const extraPeopleCount = storyPeople.length - visiblePeople.length

    const seatRendererLayout = mapCarLayoutForSeatRenderer(ride?.car?.layout)

    return (
      <div ref={ref} className="story-card" aria-label="Náhled sdílené karty">
        <div className="story-card-top">
          <div className="story-card-brand">
            <img src={logoLight} alt="Sitzy" className="logo logo-light story-card-brand-logo h-4" />
            <img src={logoDark} alt="Sitzy" className="logo logo-dark story-card-brand-logo h-4" />
          </div>
          <span className="story-card-chip">
            {anonymized ? 'Anonymizováno' : 'Sdílení s údaji'}
          </span>
        </div>

        <div className="story-card-heading">
          <p className="story-card-label">Cíl jízdy</p>
          <h3 ref={titleRef} className="story-card-title">{ride.destination}</h3>
        </div>

        <div className="story-card-meta">
          <div className="story-meta-item">
            <FiClock size={12} aria-hidden="true" />
            <span>{formatLocalDateTime(ride.departure_time)}</span>
          </div>
          <div className="story-meta-item">
            <BiCar size={12} aria-hidden="true" />
            <span>{ride.car?.name ?? 'Auto'} • {ride.car?.layout ?? 'Layout'}</span>
          </div>
          <div className="story-meta-item">
            <span>{occupiedCount}/{seatCapacity} obsazeno</span>
          </div>
        </div>

        <div className="story-seat-stage">
          <SeatRenderer
            layout={seatRendererLayout}
            seats={storySeatData}
            ownerName={anonymized ? 'Řidič' : storyDriverName}
            driverAvatarUrl={anonymized ? null : (ride?.driver?.avatar_url ?? null)}
            mode="display"
            orientation="landscape"
            showHeader={false}
            showLegend={false}
            compact={true}
            className="story-seat-renderer"
          />
        </div>

        <div className="story-people">
          {visiblePeople.map((person) => (
            <div key={person.id} className={`story-person ${person.isDriver ? 'story-person-driver' : ''}`}>
              <div className="story-person-avatar" aria-hidden="true">
                {person.avatar ? (
                  <img src={person.avatar} alt="" crossOrigin="anonymous" />
                ) : (
                  <span>{person.name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="story-person-info">
                <span className="story-person-name">{person.name}</span>
                <span className="story-person-seat">Sedadlo {person.seat}</span>
              </div>
            </div>
          ))}
          {storyPeople.length > maxVisiblePeople && (
            <div className="story-person">
              <div className="story-person-avatar" aria-hidden="true">
                <span>+{extraPeopleCount}</span>
              </div>
              <div className="story-person-info">
                <span className="story-person-name">Další</span>
                <span className="story-person-seat">pasažéři</span>
              </div>
            </div>
          )}
        </div>

        <div className="story-card-footer">
          <span>Vygenerováno {formatLocalDateTime(timestamp)}</span>
          <span className="story-card-watermark">{watermarkText}</span>
        </div>
      </div>
    )
  }
)

RideSummaryCard.displayName = 'RideSummaryCard'
