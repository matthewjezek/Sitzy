import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FiTrash,
  FiUserPlus,
  FiClock,
  FiRepeat,
  FiUserX,
  FiLogOut,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiCopy,
} from 'react-icons/fi'
import { BiCar } from 'react-icons/bi'
import { toast } from 'react-toastify'
import { formatLocalDateTime } from '../utils/datetime'
import instance from '../api/axios'
import { useRide } from '../hooks/useRide'
import { useInvites, notifyInvitesChanged } from '../hooks/useInvites'
import { useAuth } from '../hooks/useAuth'
import type { PassengerOut } from '../types/models'
import { inviteSchema, type InviteFormValues } from '../utils/validation'
import SeatRenderer from '../components/SeatRenderer'
import { RideSummaryCard } from '../components/RideSummaryCard'
import { mapCarLayoutForSeatRenderer, getSeatCapacity } from '../utils/seatUtils'
import { SharePreset } from '../components/SharePreset'
import { generateSharePayload, type SharePresetId } from '../utils/sharePresets'
import { completeTask } from '../utils/survey'
import type { SeatData } from '../components/SeatRenderer'
import ErrorView from '../components/ErrorView'
import { ConfirmDialog } from '../components/Dialog'

function RideDetailSkeleton() {
  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="animate-pulse page-content max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="h-40 rounded-xl skeleton-dark" />
        <div className="h-48 rounded-xl skeleton-dark" />
        <div className="h-40 rounded-xl skeleton-dark" />
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

function InviteSection({ rideId, canCancelInvites }: { rideId: string; canCancelInvites: boolean }) {
  const { invites, loading, createInvite, cancelInvite } = useInvites(rideId)
  const [cancellingToken, setCancellingToken] = useState<string | null>(null)
  const pendingInvites = invites.filter(inv => inv.status === 'Pending')

  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    action: () => void | Promise<void>;
  } | null>(null)

  const showConfirm = (
    title: string,
    message: string,
    action: () => void | Promise<void>,
    type: 'danger' | 'warning' | 'info' | 'success' = 'info',
    confirmText?: string
  ) => {
    setConfirmConfig({ title, message, action, type, confirmText })
    setTimeout(() => {
      confirmDialogRef.current?.showModal()
    }, 0)
  }

  const closeConfirm = () => {
    confirmDialogRef.current?.close()
  }

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
    const success = await createInvite(data.email)
    if (success) {
      toast.success(`Pozvánka odeslána na ${data.email}.`)
      reset()
    }
  }

  const handleCancelInvite = (token: string, email: string) => {
    showConfirm(
      'Zrušit pozvánku',
      `Opravdu chcete zrušit pozvánku pro ${email}?`,
      async () => {
        setCancellingToken(token)
        try {
          const success = await cancelInvite(token)
          if (success) {
            toast.success('Pozvánka byla zrušena.')
          }
        } finally {
          setCancellingToken(null)
        }
      },
      'warning',
      'Zrušit'
    )
  }

  return (
    <div className="card p-4 flex flex-col gap-4">
      <h2 className="font-semibold">Pozvánky</h2>

      <form onSubmit={handleSubmit(onInvite)} className="flex flex-col sm:flex-row gap-2">
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
          className="button-primary flex items-center justify-center gap-2 sm:shrink-0 h-10 sm:h-auto"
        >
          <FiUserPlus size={16} />
          <span className="sm:hidden">Pozvat</span>
          <span className="hidden sm:inline">Pozvat</span>
        </button>
      </form>

      {loading && (
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 rounded-lg skeleton-dark" />
          ))}
        </div>
      )}

      {!loading && pendingInvites.length === 0 && (
        <p className="text-sm text-muted text-center py-2">Žádné aktivní pozvánky.</p>
      )}

      {!loading && pendingInvites.map(inv => (
        <div
          key={inv.token}
          className="flex items-center justify-between gap-2 p-3 rounded-lg list-item-bg"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium truncate">{inv.invited_email}</p>
            <span className="text-xs w-fit px-2 py-0.5 rounded-full status-pending">Čeká</span>
          </div>

          {canCancelInvites && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const inviteLink = `${window.location.origin}/i/${inv.token}`
                  navigator.clipboard.writeText(inviteLink)
                    .then(() => toast.success('Odkaz na pozvánku byl zkopírován.'))
                    .catch(() => toast.error('Nepodařilo se zkopírovat odkaz.'))
                }}
                className="text-xs button-secondary flex items-center gap-1"
                aria-label={`Kopírovat odkaz pozvánky pro ${inv.invited_email}`}
              >
                <FiCopy size={12} />
                <span>Kopírovat odkaz</span>
              </button>
              <button
                type="button"
                disabled={cancellingToken === inv.token}
                onClick={() => handleCancelInvite(inv.token, inv.invited_email)}
                className="text-xs button-secondary flex items-center gap-1"
              >
                <FiXCircle size={12} />
                {cancellingToken === inv.token ? 'Ruším...' : 'Zrušit'}
              </button>
            </div>
          )}
        </div>
      ))}
      {confirmConfig && (
        <ConfirmDialog
          ref={confirmDialogRef}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          type={confirmConfig.type}
          action={confirmConfig.action}
          toggle={closeConfirm}
        />
      )}
    </div>
  )
}

interface PassengersSectionProps {
  passengers: PassengerOut[]
  ownerId: string | undefined
  ownerName: string | undefined
  currentDriverId: string
  currentDriverName?: string
  currentDriverAvatar?: string
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
  currentDriverName,
  currentDriverAvatar,
  canManagePassengers,
  transferringUserId,
  removingUserId,
  onTransferDriver,
  onRemovePassenger,
}: PassengersSectionProps) {
  const isOwnerDriver = ownerId === currentDriverId
  // Fallback to ownerName if the owner is driving, else use provided driver name
  const driverLabel = currentDriverName || (isOwnerDriver ? ownerName : 'Neznámý řidič')
  
  const sortedPassengers = [...passengers].sort((left, right) => {
    const leftSeat = left.seat_position ?? Number.POSITIVE_INFINITY
    const rightSeat = right.seat_position ?? Number.POSITIVE_INFINITY

    if (leftSeat !== rightSeat) return leftSeat - rightSeat
    return left.full_name?.localeCompare(right.full_name ?? '', 'cs') ?? 0
  })

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Pasažéři</h2>

      <div className="p-3 rounded-xl bg-muted border theme-border flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
        {currentDriverAvatar ? (
          <img src={currentDriverAvatar} alt={driverLabel} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20" />
        ) : (
          <div className="w-10 h-10 rounded-full initials-avatar flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-indigo-500/20">
            {driverLabel?.[0]?.toUpperCase() ?? 'Ř'}
          </div>
        )}
        
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-semibold truncate">{driverLabel}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full status-success">Řidič</span>
            {isOwnerDriver && (
              <span className="text-[10px] px-2 py-0.5 rounded-full status-info">Majitel</span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5">Aktivní řidič (Sedadlo 1)</p>
        </div>

        <div className="hidden md:flex shrink-0 items-center justify-center px-4 text-indigo-500/30 dark:text-indigo-400/20">
          <BiCar size={28} />
        </div>
      </div>

      {passengers.length > 0 && (
        <hr className="theme-divider border-t my-1 mx-2 opacity-50" />
      )}

      {passengers.length === 0 ? (
        <p className="text-sm text-muted text-center py-2">Zatím žádní další pasažéři.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedPassengers.map(p => {
            const isThisOwner = p.user_id === ownerId

            return (
              <li key={p.user_id} className="flex flex-col md:flex-row md:items-center gap-3 p-2 rounded-lg list-item-bg">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name ?? ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/30 dark:bg-indigo-400/20 initials-avatar flex items-center justify-center text-sm font-bold shrink-0">
                    {p.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{p.full_name ?? 'Neznámý'}</p>
                    {isThisOwner && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full status-info">Majitel</span>
                    )}
                  </div>
                  {p.seat_position != null && (
                    <p className="text-xs text-secondary">Sedadlo {p.seat_position}</p>
                  )}
                </div>

                {canManagePassengers && (
                  <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
                    <button
                      type="button"
                      onClick={() => onTransferDriver(p.user_id, p.full_name ?? 'Neznámý')}
                      disabled={transferringUserId === p.user_id}
                      className="button-secondary text-xs flex items-center justify-center gap-1 flex-1 sm:flex-none h-10"
                    >
                      <FiRepeat size={12} />
                      {transferringUserId === p.user_id ? 'Předávám...' : 'Předat řízení'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePassenger(p.user_id, p.full_name ?? 'Neznámý')}
                      disabled={removingUserId === p.user_id || isThisOwner}
                      title={isThisOwner ? 'Majitel nemůže být odebrán ze své jízdy.' : undefined}
                      className="button-danger text-xs flex items-center justify-center gap-1 flex-1 sm:flex-none h-10"
                    >
                      <FiUserX size={16} />
                      {removingUserId === p.user_id ? 'Odebírám...' : ''}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function RideDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    action: () => void | Promise<void>;
  } | null>(null)

  const showConfirm = (
    title: string,
    message: string,
    action: () => void | Promise<void>,
    type: 'danger' | 'warning' | 'info' | 'success' = 'info',
    confirmText?: string
  ) => {
    setConfirmConfig({ title, message, action, type, confirmText })
    setTimeout(() => {
      confirmDialogRef.current?.showModal()
    }, 0)
  }

  const closeConfirm = () => {
    confirmDialogRef.current?.close()
  }
  const [finishingInvite, setFinishingInvite] = useState(false)
  const [storyAnonymized, setStoryAnonymized] = useState(() => localStorage.getItem('sitzy_anonymize_exports') !== 'false')
  const [exportingImage, setExportingImage] = useState(false)
  const [exportingJson, setExportingJson] = useState(false)
  const storyCardRef = useRef<HTMLDivElement | null>(null)

  const inviteToken = searchParams.get('invite')
  const isOwner = ride?.car?.owner_id === user?.id
  const activeInviteToken = inviteToken || ride?.public_invite_token || null

  useEffect(() => {
    if (id) {
      void fetchRide(id, inviteToken ?? undefined)
    }
  }, [id, fetchRide, inviteToken])

  useEffect(() => {
    document.title = ride ? `Sitzy - ${ride.destination}` : 'Sitzy - Jízda'
  }, [ride])

  const handleDelete = () => {
    if (!ride) return
    showConfirm(
      'Smazat jízdu',
      'Opravdu chcete smazat tuto jízdu?',
      async () => {
        const success = await cancelRide(ride.id)
        if (success) {
          toast.success('Jízda byla smazána.')
          navigate('/rides')
        }
      },
      'danger',
      'Smazat'
    )
  }

  const handleLeave = () => {
    if (!ride || !user) return
    showConfirm(
      'Opustit jízdu',
      'Opravdu chcete opustit tuto jízdu?',
      async () => {
        const success = await leaveRide(ride.id, user.id)
        if (success) {
          toast.success('Jízdu jste opustili.')
          navigate('/rides')
        }
      },
      'danger',
      'Opustit'
    )
  }

  const handleTransferDriver = async (newDriverId: string, displayName: string) => {
    if (!ride) return
    showConfirm(
      'Předat řízení',
      `Opravdu chcete předat řízení uživateli ${displayName}?`,
      async () => {
        setTransferringUserId(newDriverId)
        try {
          const updated = await transferDriver(ride.id, newDriverId, ride.driver_user_id)
          if (updated) {
            toast.success('Řízení bylo předáno.')
          }
        } finally {
          setTransferringUserId(null)
        }
      },
      'warning',
      'Předat řízení'
    )
  }

  const handleRemovePassenger = async (passengerId: string, displayName: string) => {
    if (!ride) return
    showConfirm(
      'Odebrat pasažéra',
      `Opravdu chcete vyhodit uživatele ${displayName} z jízdy?`,
      async () => {
        setRemovingUserId(passengerId)
        try {
          const success = await removePassenger(ride.id, passengerId)
          if (success) {
            toast.success('Pasažér byl odebrán z jízdy.')
          }
        } finally {
          setRemovingUserId(null)
        }
      },
      'danger',
      'Odebrat'
    )
  }

  const clearInviteQueryParam = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('invite')
    setSearchParams(next, { replace: true })
  }

  const handleFinalizeInvite = async (autoAssign: boolean) => {
    if (!inviteToken || !id) return

    if (!autoAssign && selectedSeat == null) {
      toast.info('Vyberte prosím sedadlo, nebo použijte automatické přiřazení.')
      return
    }

    setFinishingInvite(true)
    try {
      await instance.post(`/invitations/${inviteToken}/accept`, autoAssign ? {} : { seat_position: selectedSeat })
      await fetchRide(id)
      notifyInvitesChanged()
      clearInviteQueryParam()
      setSelectedSeat(null)
      toast.success('Pozvánka přijata a sedadlo potvrzeno.')
    } catch {
      toast.error('Nepodařilo se dokončit výběr sedadla. Pozvánka zůstává čekající.')
    } finally {
      setFinishingInvite(false)
    }
  }
  
  const seatCapacity = getSeatCapacity(ride?.car?.layout)
  const occupiedCount = Math.min(seatCapacity, (ride?.passengers?.length ?? 0) + 1)
  const storyDriverName = ride?.driver?.full_name ?? ride?.car?.owner_name ?? 'Řidič'
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
        name: storyAnonymized ? `Pasažér ${index + 1}` : passenger.full_name ?? 'Neznámý',
        avatar: storyAnonymized ? null : passenger.avatar_url,
        isDriver: false,
      }))
  }, [ride?.passengers, storyAnonymized])


  const [isWide, setIsWide] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (loading) return <RideDetailSkeleton />

  if (error) return (
    <ErrorView
      message={error}
      onRetry={() => id && fetchRide(id, inviteToken ?? undefined)}
    />
  )

  if (notFound || !ride) return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-4 md:p-6 text-center flex flex-col gap-4">
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

  const isCurrentDriver = ride.driver_user_id === user?.id
  const isPassenger = Boolean(user && (ride.passengers ?? []).some(p => p.user_id === user.id))
  const isPastRide = new Date(ride.departure_time).getTime() < Date.now()
  const requiresSeatSelection = Boolean(inviteToken && user && !isOwner && !isCurrentDriver && !isPassenger && !isPastRide)

  const seatRendererLayout = mapCarLayoutForSeatRenderer(ride.car?.layout)
  const seatRendererSeats: SeatData[] = (ride.passengers ?? []).map((p) => ({
    position: p.seat_position,
    user_name: p.full_name ?? undefined,
    avatar_url: p.avatar_url ?? undefined,
    occupied: true,
  }))

  const buildStoryExport = () => ({
    context: 'Sitzy Ride Summary',
    generated_at: new Date().toISOString(),
    anonymized: storyAnonymized,
    ride: {
      destination: ride.destination,
      departure_time: ride.departure_time,
      car: {
        name: ride.car?.name ?? null,
        layout: ride.car?.layout ?? null,
      },
      seats: {
        capacity: seatCapacity,
        occupied: occupiedCount,
      },
      driver: {
        name: storyAnonymized ? 'Řidič' : storyDriverName,
        seat: 1,
      },
      passengers: storyPassengers.map(passenger => ({
        name: passenger.name,
        seat: passenger.seat,
      })),
    },
  })

  const generateStoryImageBlob = async (): Promise<Blob | null> => {
    if (!storyCardRef.current) return null

    // Wait for fonts
    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    // Small extra delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 100))

    const htmlToImage = await import('html-to-image')
    const dataUrl = await htmlToImage.toPng(storyCardRef.current, {
      pixelRatio: 2, 
      backgroundColor: 'transparent',
      cacheBust: false,
      style: {
        transform: 'none',
      }
    })

    if (!dataUrl) return null
    const response = await fetch(dataUrl)
    return await response.blob()
  }

  const handleDownloadStoryImage = async () => {
    setExportingImage(true)
    try {
      const blob = await generateStoryImageBlob()
      if (!blob) {
        toast.error('Nepodařilo se připravit PNG export.')
        return
      }
      const dataUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `sitzy-jizda-${ride.id}.png`
      link.click()
      URL.revokeObjectURL(dataUrl)
      toast.success('PNG karta byla stažena.')
    } catch (err) {
      console.error('PNG export failed:', err)
      toast.error('Nepodařilo se vytvořit PNG kartu.')
    } finally {
      setExportingImage(false)
    }
  }

  const handleExportStoryJson = () => {
    setExportingJson(true)
    try {
      const payload = buildStoryExport()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sitzy-jizda-${ride.id}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('JSON export byl stažen.')
    } catch {
      toast.error('Nepodařilo se vytvořit JSON export.')
    } finally {
      setExportingJson(false)
    }
  }

  const buildSharePayload = (presetId: SharePresetId) => {
    return generateSharePayload(presetId, { id: ride.id, destination: ride.destination, departure_time: ride.departure_time }, activeInviteToken)
  }

  const canLeaveRide = Boolean(user && !isOwner && !isCurrentDriver)
  const roleBadge = isOwner ? 'Majitel auta' : isCurrentDriver ? 'Aktuální řidič' : 'Pasažér'
  const roleBadgeClass = isOwner
    ? 'status-info'
    : isCurrentDriver
      ? 'status-success'
      : 'status-pending'

  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-md md:max-w-2xl lg:max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">

        <div className="card p-4 md:p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-accent/10 blur-2xl pointer-events-none" aria-hidden="true" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold break-words">{ride.destination}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass}`}>{roleBadge}</span>
                <RideStatusBadge departureTime={ride.departure_time} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <FiClock size={14} className="shrink-0 text-accent" />
              <span className="break-words">{formatLocalDateTime(ride.departure_time)}</span>
            </div>
            {ride.car && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <BiCar size={15} className="shrink-0 text-accent" />
                <span className="break-words">{ride.car.name} ({ride.car.layout})</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {isPastRide ? null : isOwner ? (
              <button
                onClick={handleDelete}
                className="button-danger text-sm hover-opacity-80 flex items-center gap-2 h-10"
              >
                <FiTrash size={14} />
                <span>Smazat jízdu</span>
              </button>
            ) : (
              <button
                onClick={handleLeave}
                disabled={!canLeaveRide}
                className="button-secondary text-sm flex items-center gap-2 h-10"
                title={!canLeaveRide ? 'Aktuální řidič musí nejdříve předat řízení.' : undefined}
              >
                <FiLogOut size={14} />
                <span>Opustit jízdu</span>
              </button>
            )}
          </div>
        </div>

        <div className="card p-4 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-semibold">Rozložení sedadel</h2>
              <p className="text-sm text-secondary mt-1">
                {requiresSeatSelection
                  ? 'Vyberte sedadlo pro dokončení přijetí pozvánky.'
                  : 'Přehled obsazenosti sedadel v této jízdě.'}
              </p>
            </div>
          </div>

          <SeatRenderer
            layout={seatRendererLayout}
            seats={seatRendererSeats}
            ownerName={ride.driver?.full_name ?? ride.car?.owner_name ?? 'Řidič'}
            driverAvatarUrl={ride.driver?.avatar_url ?? null}
            mode={requiresSeatSelection ? 'interactive' : 'display'}
            selectedSeat={requiresSeatSelection ? selectedSeat : undefined}
            onSeatSelect={requiresSeatSelection ? setSelectedSeat : undefined}
            orientation={isWide ? 'landscape' : 'portrait'}
          />

          {requiresSeatSelection && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => void handleFinalizeInvite(false)}
                disabled={finishingInvite || selectedSeat == null}
                className="button-primary flex-1 sm:flex-none h-10"
              >
                {finishingInvite ? 'Ukládám...' : 'Potvrdit vybrané sedadlo'}
              </button>
              <button
                type="button"
                onClick={() => void handleFinalizeInvite(true)}
                disabled={finishingInvite}
                className="button-secondary flex-1 sm:flex-none h-10"
              >
                {finishingInvite ? 'Ukládám...' : 'Nechat systém vybrat'}
              </button>
            </div>
          )}
        </div>

        <div className="card p-4 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold">Sdílená karta jízdy</h2>
              <p className="text-sm text-secondary mt-1">
                Mobilní náhled vhodný pro story export. Anonymizace je zapnutá ve výchozím stavu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStoryAnonymized((prev) => !prev)}
              className="button-secondary flex items-center gap-2 h-10"
              aria-pressed={storyAnonymized}
            >
              {storyAnonymized ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {storyAnonymized ? 'Anonymizováno' : 'Plné údaje'}
            </button>
          </div>

          <div className="story-card-wrapper">
            <RideSummaryCard
              ref={storyCardRef}
              ride={ride}
              anonymized={storyAnonymized}
              watermarkText="Sitzy Demo"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <SharePreset
              title={`Sitzy: ${ride.destination}`}
              text={buildSharePayload('messenger_whatsapp_text_first').text}
              url={buildSharePayload('messenger_whatsapp_text_first').link}
              onDownloadPng={handleDownloadStoryImage}
              onExportJson={handleExportStoryJson}
              exportingImage={exportingImage}
              exportingJson={exportingJson}
              xText={buildSharePayload('x_compact').text}
              xUrl={buildSharePayload('x_compact').link}
              fbText={buildSharePayload('facebook_story').text}
              fbUrl={buildSharePayload('facebook_story').link}
              waText={buildSharePayload('messenger_whatsapp_text_first').text}
              waUrl={buildSharePayload('messenger_whatsapp_text_first').link}
              onGenerateBlob={generateStoryImageBlob}
              onShare={() => completeTask('create_public_invite')}
            />
          </div>
        </div>

        <PassengersSection
          passengers={ride.passengers ?? []}
          ownerId={ride.car?.owner_id}
          ownerName={ride.car?.owner_name ?? undefined}
          currentDriverId={ride.driver_user_id}
          currentDriverName={ride.driver?.full_name ?? undefined}
          currentDriverAvatar={ride.driver?.avatar_url ?? undefined}
          canManagePassengers={Boolean(isOwner && !isPastRide)}
          transferringUserId={transferringUserId}
          removingUserId={removingUserId}
          onTransferDriver={handleTransferDriver}
          onRemovePassenger={handleRemovePassenger}
        />

        {isOwner && !isPastRide ? <InviteSection rideId={ride.id} canCancelInvites /> : null}

      </div>
      {confirmConfig && (
        <ConfirmDialog
          ref={confirmDialogRef}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          type={confirmConfig.type}
          action={confirmConfig.action}
          toggle={closeConfirm}
        />
      )}
    </div>
  )
}