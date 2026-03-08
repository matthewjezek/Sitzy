import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiTrash, FiUserPlus, FiMapPin, FiClock } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { formatLocalDateTime } from '../utils/datetime'
import { useRide } from '../hooks/useRide'
import { useInvites } from '../hooks/useInvites'
import { inviteSchema, type InviteFormValues } from '../utils/validation'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RideDetailSkeleton() {
  return (
    <div className="animate-pulse max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">
      <div className="h-32 rounded-xl skeleton-dark" />
      <div className="h-48 rounded-xl skeleton-dark" />
      <div className="h-10 rounded-xl skeleton-dark" />
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function RideStatusBadge({ departureTime }: { departureTime: string }) {
  const now = new Date()
  const departure = new Date(departureTime)
  const diffMs = departure.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) return (
    <span className="text-xs px-2 py-0.5 rounded-full list-item-bg text-muted">
      Proběhla
    </span>
  )
  if (diffHours < 24) return (
    <span className="text-xs px-2 py-0.5 rounded-full status-success">
      Brzy
    </span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full status-info">
      Nadcházející
    </span>
  )
}

// ─── Invite section ───────────────────────────────────────────────────────────

function InviteSection({ rideId }: { rideId: string }) {
  const { invites, loading, error, createInvite, respondInvite } = useInvites(rideId)
  const [responding, setResponding] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  })

  const onInvite = async (data: InviteFormValues) => {
    await createInvite(data.email)
    if (!error) {
      toast.success(`Pozvánka odeslána na ${data.email}.`)
      reset()
    }
  }

  const handleRespond = async (token: string, accept: boolean) => {
    setResponding(token)
    try {
      await respondInvite(token, accept)
      toast.success(accept ? 'Pozvánka přijata.' : 'Pozvánka odmítnuta.')
    } finally {
      setResponding(null)
    }
  }

  return (
    <div className="card p-4 flex flex-col gap-4">
      <h2 className="font-semibold">Pozvánky</h2>

      {/* Formulář pro pozvání */}
      <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label htmlFor="invite-email" className="sr-only">E-mail pro pozvánku</label>
          <input
            id="invite-email"
            type="email"
            placeholder="email@example.com"
            className={`form-input ${errors.email ? 'border-red-400' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2 px-4 rounded-xl button-primary flex items-center gap-2 shrink-0"
        >
          <FiUserPlus size={16} />
          Pozvat
        </button>
      </form>

      {/* Seznam pozvánek */}
      {loading && (
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 rounded-lg skeleton-dark" />
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">Zatím žádné pozvánky.</p>
      )}

      {!loading && invites.map(inv => (
        <div
          key={inv.token}
          className="flex items-center justify-between gap-2 p-3 rounded-lg list-item-bg"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium truncate">{inv.invited_email}</p>
            <span className={`text-xs w-fit px-2 py-0.5 rounded-full
              ${inv.status === 'Accepted' ? 'status-success' : ''}
              ${inv.status === 'Pending' ? 'status-pending' : ''}
              ${inv.status === 'Rejected' ? 'status-danger' : ''}
            `}>
              {inv.status === 'Accepted' && 'Přijato'}
              {inv.status === 'Pending' && 'Čeká'}
              {inv.status === 'Rejected' && 'Odmítnuto'}
            </span>
          </div>

          {inv.status === 'Pending' && (
            <div className="flex gap-2 shrink-0">
              <button
                disabled={responding === inv.token}
                onClick={() => handleRespond(inv.token, true)}
                className="text-xs py-1 px-3 rounded-lg button-primary"
              >
                Přijmout
              </button>
              <button
                disabled={responding === inv.token}
                onClick={() => handleRespond(inv.token, false)}
                className="text-xs py-1 px-3 rounded-lg button-secondary"
              >
                Odmítnout
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Passengers section ───────────────────────────────────────────────────────

function PassengersSection({ passengers }: { passengers: import('../hooks/useRide').PassengerOut[] }) {
  if (passengers.length === 0) return (
    <div className="card p-4 flex flex-col gap-2">
      <h2 className="font-semibold">Pasažéři</h2>
      <p className="text-sm text-gray-500 text-center py-2">Zatím žádní pasažéři.</p>
    </div>
  )

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Pasažéři</h2>
      <ul className="flex flex-col gap-2">
        {passengers.map(p => (
          <li key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg list-item-bg">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.full_name ?? ''} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full initials-avatar flex items-center justify-center text-sm font-bold">
                {p.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium truncate">{p.full_name ?? 'Neznámý'}</p>
              {p.seat_position != null && (
                <p className="text-xs text-gray-400">Sedadlo {p.seat_position}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── RideDetailPage ───────────────────────────────────────────────────────────

export default function RideDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { ride, loading, error, notFound, fetchRide, cancelRide } = useRide()  // ✅

  useEffect(() => {
    if (id) fetchRide(id)
  }, [id, fetchRide])

  const handleDelete = async () => {
    if (!ride) return
    if (!window.confirm('Opravdu chcete smazat tuto jízdu?')) return
    const success = await cancelRide(ride.id)  // ✅
    if (success) {
      toast.success('Jízda byla smazána.')
      navigate('/rides')
    }
  }

  if (loading) return <RideDetailSkeleton />

  if (error) return (
    <div className="text-red-500 text-center mt-10">{error}</div>
  )

  if (notFound || !ride) return (
    <div className="max-w-lg mx-auto mt-10 p-6 text-center flex flex-col gap-4">
      <p className="text-gray-500">Jízda nebyla nalezena.</p>
      <button
        onClick={() => navigate('/rides')}
        className="py-2 px-4 rounded-xl button-primary"
      >
        Zpět na jízdy
      </button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="card p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{ride.destination}</h1>
          <RideStatusBadge departureTime={ride.departure_time} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiClock size={14} className="shrink-0 text-accent" />
            {formatLocalDateTime(ride.departure_time)}
          </div>
          {ride.car && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiMapPin size={14} className="shrink-0 text-accent" />
              {ride.car.name} ({ride.car.layout})
            </div>
          )}
        </div>

        {/* Smazat */}
        <button
          onClick={handleDelete}
          className="self-end py-1.5 px-3 rounded-lg status-danger text-sm hover-opacity-80 flex items-center gap-2"
        >
          <FiTrash size={14} />
          Smazat jízdu
        </button>
      </div>

      {/* Pasažéři */}
      <PassengersSection passengers={ride.passengers ?? []} />

      {/* Pozvánky */}
      <InviteSection rideId={ride.id} />

    </div>
  )
}