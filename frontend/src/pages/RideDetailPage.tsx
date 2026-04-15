import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiTrash, FiUserPlus, FiMapPin, FiClock, FiRepeat, FiUserX, FiLogOut } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { formatLocalDateTime } from '../utils/datetime'
import { useRide } from '../hooks/useRide'
import { useInvites } from '../hooks/useInvites'
import { useAuth } from '../hooks/useAuth'
import type { PassengerOut } from '../types/models'
import { inviteSchema, type InviteFormValues } from '../utils/validation'

function RideDetailSkeleton() {
  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="animate-pulse page-content max-w-lg mx-auto p-6 flex flex-col gap-6">
        <div className="h-32 rounded-xl skeleton-dark" />
        <div className="h-48 rounded-xl skeleton-dark" />
        <div className="h-10 rounded-xl skeleton-dark" />
      </div>
    </div>
  )
}

// Status badge for ride
function RideStatusBadge({ departureTime }: { departureTime: string }) {
  const now = new Date()
  const departure = new Date(departureTime)
  const diffMs = departure.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) return (
    <span className="text-xs px-2 py-0.5 rounded-full list-item-bg text-accent">
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
          className="button-primary flex items-center gap-2 shrink-0"
        >
          <FiUserPlus size={16} />
          Pozvat
        </button>
      </form>

      {loading && (
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 rounded-lg skeleton-dark" />
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <p className="text-sm text-muted text-center py-2">Zatím žádné pozvánky.</p>
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
                className="text-xs button-primary"
              >
                Přijmout
              </button>
              <button
                disabled={responding === inv.token}
                onClick={() => handleRespond(inv.token, false)}
                className="text-xs button-secondary"
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

interface PassengersSectionProps {
  passengers: PassengerOut[]
  ownerId: string | undefined
  ownerName: string | undefined
  currentDriverId: string
  canManagePassengers: boolean
  transferringUserId: string | null
  removingUserId: string | null
  onTransferDriver: (newDriverId: string, displayName: string) => Promise<void>
  onRemovePassenger: (passengerId: string, displayName: string) => Promise<void>
}

function PassengersSection({
  passengers,
  ownerId,
  ownerName,
  currentDriverId,
  canManagePassengers,
  transferringUserId,
  removingUserId,
  onTransferDriver,
  onRemovePassenger,
}: PassengersSectionProps) {
  const showOwnerTakeover = Boolean(ownerId && ownerId !== currentDriverId)

  const ownerLabel = ownerName ?? 'Majitel auta'

  if (passengers.length === 0) return (
    <div className="card p-4 flex flex-col gap-2">
      <h2 className="font-semibold">Pasažéři</h2>
      <p className="text-sm text-muted text-center py-2">Zatím žádní pasažéři.</p>
      {showOwnerTakeover && (
        <div className="mt-2 p-3 rounded-lg list-item-bg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{ownerLabel}</p>
            <p className="text-xs text-secondary">Majitel (aktuálně není řidič)</p>
          </div>
          {canManagePassengers && ownerId && (
            <button
              type="button"
              onClick={() => onTransferDriver(ownerId, ownerLabel)}
              disabled={transferringUserId === ownerId}
              className="button-secondary text-xs flex items-center gap-1"
            >
              <FiRepeat size={12} />
              {transferringUserId === ownerId ? 'Předávám...' : 'Předat řízení'}
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Pasažéři</h2>

      {showOwnerTakeover && (
        <div className="p-2 rounded-lg list-item-bg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full initials-avatar flex items-center justify-center text-sm font-bold">
            {ownerLabel[0]?.toUpperCase() ?? 'M'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{ownerLabel}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full status-pending">Majitel</span>
            </div>
            <p className="text-xs text-secondary">Aktuálně není řidič</p>
          </div>
          {canManagePassengers && ownerId && (
            <button
              type="button"
              onClick={() => onTransferDriver(ownerId, ownerLabel)}
              disabled={transferringUserId === ownerId}
              className="button-secondary text-xs flex items-center gap-1 shrink-0"
            >
              <FiRepeat size={12} />
              {transferringUserId === ownerId ? 'Předávám...' : 'Předat řízení'}
            </button>
          )}
        </div>
      )}

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
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{p.full_name ?? 'Neznámý'}</p>
                {p.user_id === currentDriverId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full status-info">Řidič</span>
                )}
              </div>
              {p.seat_position != null && (
                <p className="text-xs text-secondary">Sedadlo {p.seat_position}</p>
              )}
            </div>

            {canManagePassengers && (
              <div className="flex items-center gap-2 shrink-0">
                {p.user_id !== currentDriverId && (
                  <button
                    type="button"
                    onClick={() => onTransferDriver(p.user_id, p.full_name ?? 'Neznámý')}
                    disabled={transferringUserId === p.user_id}
                    className="button-secondary text-xs flex items-center gap-1"
                  >
                    <FiRepeat size={12} />
                    {transferringUserId === p.user_id ? 'Předávám...' : 'Předat řízení'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePassenger(p.user_id, p.full_name ?? 'Neznámý')}
                  disabled={removingUserId === p.user_id || p.user_id === currentDriverId}
                  className="button-danger text-xs flex items-center gap-1"
                  title={p.user_id === currentDriverId ? 'Nejdříve předejte řízení.' : undefined}
                >
                  <FiUserX size={12} />
                  {removingUserId === p.user_id ? 'Odebírám...' : 'Vyhodit'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RideDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const {
    ride,
    loading,
    error,
    notFound,
    fetchRide,
    cancelRide,
    leaveRide,
    transferDriver,
    removePassenger,
  } = useRide()
  const [transferringUserId, setTransferringUserId] = useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchRide(id)
  }, [id, fetchRide])

  useEffect(() => {
    document.title = ride ? `Sitzy - ${ride.destination}` : 'Sitzy - Jízda'
  }, [ride])

  const handleDelete = async () => {
    if (!ride) return
    if (!window.confirm('Opravdu chcete smazat tuto jízdu?')) return
    const success = await cancelRide(ride.id)
    if (success) {
      toast.success('Jízda byla smazána.')
      navigate('/rides')
    }
  }

  const handleLeave = async () => {
    if (!ride || !user) return
    if (!window.confirm('Opravdu chcete opustit tuto jízdu?')) return
    const success = await leaveRide(ride.id, user.id)
    if (success) {
      toast.success('Jízdu jste opustili.')
      navigate('/rides')
    }
  }

  const handleTransferDriver = async (newDriverId: string, displayName: string) => {
    if (!ride) return
    if (!window.confirm(`Opravdu chcete předat řízení uživateli ${displayName}?`)) return

    setTransferringUserId(newDriverId)
    try {
      const updated = await transferDriver(ride.id, newDriverId, ride.driver_user_id)
      if (updated) {
        toast.success('Řízení bylo předáno.')
      }
    } finally {
      setTransferringUserId(null)
    }
  }

  const handleRemovePassenger = async (passengerId: string, displayName: string) => {
    if (!ride) return
    if (!window.confirm(`Opravdu chcete vyhodit uživatele ${displayName} z jízdy?`)) return

    setRemovingUserId(passengerId)
    try {
      const success = await removePassenger(ride.id, passengerId)
      if (success) {
        toast.success('Pasažér byl odebrán z jízdy.')
      }
    } finally {
      setRemovingUserId(null)
    }
  }
  
  if (loading) return <RideDetailSkeleton />

  if (error) return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto p-6 text-red-500 text-center">{error}</div>
    </div>
  )

  if (notFound || !ride) return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto p-6 text-center flex flex-col gap-4">
        <p className="text-secondary">Jízda nebyla nalezena.</p>
        <button
          onClick={() => navigate('/rides')}
          className="button-primary"
        >
          Zpět na jízdy
        </button>
      </div>
    </div>
  )

  const isOwner = ride.car?.owner_id === user?.id
  const isCurrentDriver = ride.driver_user_id === user?.id
  const canLeaveRide = Boolean(user && !isOwner && !isCurrentDriver)

  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto p-6 flex flex-col gap-6">

        <div className="card p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{ride.destination}</h1>
            <RideStatusBadge departureTime={ride.departure_time} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <FiClock size={14} className="shrink-0 text-accent" />
              {formatLocalDateTime(ride.departure_time)}
            </div>
            {ride.car && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <FiMapPin size={14} className="shrink-0 text-accent" />
                {ride.car.name} ({ride.car.layout})
              </div>
            )}
          </div>

          {isOwner ? (
            <button
              onClick={handleDelete}
              className="self-end button-danger text-sm hover-opacity-80 flex items-center gap-2"
            >
              <FiTrash size={14} />
              Smazat jízdu
            </button>
          ) : (
            <button
              onClick={handleLeave}
              disabled={!canLeaveRide}
              className="self-end button-secondary text-sm flex items-center gap-2"
              title={!canLeaveRide ? 'Aktuální řidič musí nejdříve předat řízení.' : undefined}
            >
              <FiLogOut size={14} />
              Opustit jízdu
            </button>
          )}
        </div>

        <PassengersSection
          passengers={ride.passengers ?? []}
          ownerId={ride.car?.owner_id}
          ownerName={ride.car?.owner_name ?? undefined}
          currentDriverId={ride.driver_user_id}
          canManagePassengers={Boolean(isOwner)}
          transferringUserId={transferringUserId}
          removingUserId={removingUserId}
          onTransferDriver={handleTransferDriver}
          onRemovePassenger={handleRemovePassenger}
        />

        {isOwner || isCurrentDriver ? <InviteSection rideId={ride.id} /> : null}

      </div>
    </div>
  )
}