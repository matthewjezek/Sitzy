import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { isAxiosError } from 'axios'
import { FiCalendar, FiMapPin, FiUser, FiArrowRight } from 'react-icons/fi'
import { BiCar } from 'react-icons/bi'
import instance from '../api/axios'
import type { InvitationResolve } from '../types/models'
import { formatLocalDateTime } from '../utils/datetime'

export default function InviteEntryPage() {
  const { inviteToken } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState<InvitationResolve | null>(null)
  const hasToken = Boolean(localStorage.getItem('access_token'))

  useEffect(() => {
    const resolveInvite = async () => {
      if (!inviteToken) {
        setErrorMsg('Neplatný odkaz pozvánky.')
        setLoading(false)
        return
      }

      try {
        const { data } = await instance.get<InvitationResolve>(`/invitations/${inviteToken}/resolve`)
        setInviteDetails(data)
        
        const targetPath = `/rides/${data.ride_id}?invite=${encodeURIComponent(inviteToken)}`
        if (hasToken) {
          // If authenticated, skip landing page and redirect directly
          navigate(targetPath, { replace: true })
          return
        }
        
        setLoading(false)
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response?.status === 410) {
            setErrorMsg('Pozvánka vypršela. Požádejte o novou.')
          } else if (error.response?.status === 404) {
            setErrorMsg('Pozvánka nebyla nalezena.')
          } else {
            setErrorMsg('Pozvánku se nepodařilo ověřit. Zkuste to znovu.')
          }
        } else {
          setErrorMsg('Nastala neočekávaná chyba při ověřování pozvánky.')
        }
        setLoading(false)
      }
    }

    void resolveInvite()
  }, [inviteToken, navigate, hasToken])

  const handleAccept = () => {
    if (!inviteDetails || !inviteToken) return
    const targetPath = `/rides/${inviteDetails.ride_id}?invite=${encodeURIComponent(inviteToken)}`
    localStorage.setItem('post_login_redirect', targetPath)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="page-container page-container-auth">
        <div className="page-content">
          <div className="form-container">
            <div className="main-card p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
              <p className="text-secondary font-medium">Ověřuji pozvánku...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="page-container page-container-auth">
        <div className="page-content">
          <div className="form-container">
            <div className="main-card p-8 text-center flex flex-col gap-4">
              <h1 className="text-xl font-bold text-red-500">Chyba pozvánky</h1>
              <p className="text-sm text-secondary">{errorMsg}</p>
              <button
                onClick={() => navigate(hasToken ? '/dashboard' : '/')}
                className="button-secondary mt-2 w-full"
              >
                Zpět na hlavní stránku
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container page-container-auth">
      <div className="page-content">
        <div className="form-container">
          <div className="main-card p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl pointer-events-none" aria-hidden="true" />
            
            <div className="text-center flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-accent font-bold">Pozvánka do jízdy</span>
              <h1 className="text-2xl font-extrabold tracking-tight">Pojeď taky!</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Byl(a) jste pozván(a) k účasti na následující společné cestě.
              </p>
            </div>

            {inviteDetails && (
              <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <FiMapPin size={18} className="text-accent shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Cíl cesty</span>
                    <span className="text-sm font-bold truncate">{inviteDetails.destination}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiCalendar size={18} className="text-accent shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Odjezd</span>
                    <span className="text-sm font-medium truncate">
                      {inviteDetails.departure_time ? formatLocalDateTime(inviteDetails.departure_time) : 'Neznámý'}
                    </span>
                  </div>
                </div>

                {inviteDetails.driver_name && (
                  <div className="flex items-center gap-3">
                    <FiUser size={18} className="text-accent shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Řidič / Pořadatel</span>
                      <span className="text-sm font-medium truncate">{inviteDetails.driver_name}</span>
                    </div>
                  </div>
                )}

                {inviteDetails.car_name && (
                  <div className="flex items-center gap-3">
                    <BiCar size={18} className="text-accent shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Vozidlo</span>
                      <span className="text-sm font-medium truncate">{inviteDetails.car_name}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleAccept}
                className="button-primary w-full h-11 flex items-center justify-center gap-2 group"
              >
                <span>Přijmout a vybrat sedadlo</span>
                <FiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate(hasToken ? '/dashboard' : '/')}
                className="button-secondary w-full h-11"
              >
                Zatím ne
              </button>
            </div>
            
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center">
              Pro registraci a výběr místa v autě budete přesměrováni na přihlašovací stránku.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
