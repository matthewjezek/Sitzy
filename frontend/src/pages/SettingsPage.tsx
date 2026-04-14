import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';
import instance from '../api/axios';
import {
  applyThemePreference,
  getThemePreference,
  type ThemePreference,
} from '../utils/theme';
import { DeleteDialog } from '../components/Dialog';
import { useAuth } from '../hooks/useAuth';
import type { SocialDashboard, SocialSessionInfo } from '../types/models';

function SettingsSkeleton() {
  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="animate-pulse page-content max-w-lg mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full skeleton-dark" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 rounded skeleton-dark" />
            <div className="h-3 w-56 rounded skeleton-dark" />
          </div>
        </div>
        <div className="h-10 rounded-lg skeleton-dark" />
        <div className="h-10 rounded-lg skeleton-dark" />
        <div className="h-10 rounded-lg skeleton-dark" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const [socialDashboard, setSocialDashboard] = useState<SocialDashboard | null>(null)
  const [socialLoading, setSocialLoading] = useState(false)
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [busyProvider, setBusyProvider] = useState<string | null>(null)
  const [showRevokedSessions, setShowRevokedSessions] = useState(false)
  const [isCompactMobile, setIsCompactMobile] = useState(false)
  const [socialExpanded, setSocialExpanded] = useState(true)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    document.title = 'Sitzy - Nastavení'

    const loadDashboard = async () => {
      setSocialLoading(true)
      try {
        const { data } = await instance.get<SocialDashboard>('/auth/social/dashboard')
        setSocialDashboard(data)
      } catch {
        toast.error('Nepodařilo se načíst sociální připojení.')
      } finally {
        setSocialLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const syncCompactMode = () => setIsCompactMobile(mediaQuery.matches)

    syncCompactMode()
    mediaQuery.addEventListener('change', syncCompactMode)

    return () => mediaQuery.removeEventListener('change', syncCompactMode)
  }, [])

  useEffect(() => {
    setSocialExpanded(!isCompactMobile)
  }, [isCompactMobile])

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('cs-CZ')
  }

  const refreshSocialDashboard = async () => {
    const { data } = await instance.get<SocialDashboard>('/auth/social/dashboard')
    setSocialDashboard(data)
  }

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme)
    applyThemePreference(nextTheme)
  }

  const toggleDeleteDialog = () => {
    if (deleteDialogRef.current) {
      if (deleteDialogRef.current.open) {
        deleteDialogRef.current.close()
      } else {
        deleteDialogRef.current.showModal()
      }
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await instance.delete('/auth/delete-account')
      toast.success('Účet byl úspěšně smazán.')
      localStorage.removeItem('access_token')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? 'Nepodařilo se smazat účet.')
          : 'Nastala neočekávaná chyba.'
      )
      toggleDeleteDialog()
    }
  }

  const handleRevokeSession = async (session: SocialSessionInfo) => {
    try {
      setBusySessionId(session.id)
      await instance.post(`/auth/social/sessions/${session.id}/revoke`)

      if (session.is_current) {
        toast.success('Aktuální relace byla odhlášena.')
        localStorage.removeItem('access_token')
        navigate('/login', { replace: true })
        return
      }

      await refreshSocialDashboard()

      toast.success('Relace byla zneplatněna.')
    } catch {
      toast.error('Relaci se nepodařilo zneplatnit.')
    } finally {
      setBusySessionId(null)
    }
  }

  const handleUnlinkProvider = async (provider: string) => {
    try {
      setBusyProvider(provider)
      await instance.post(`/auth/social/providers/${provider}/unlink`)
      await Promise.all([refreshSocialDashboard(), refreshUser()])
      toast.success(`Poskytovatel ${provider} byl odpojen.`)
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? 'Poskytovatele se nepodařilo odpojit.')
          : 'Poskytovatele se nepodařilo odpojit.'
      )
    } finally {
      setBusyProvider(null)
    }
  }

  const sessionsToShow = socialDashboard
    ? (showRevokedSessions
        ? socialDashboard.sessions
        : socialDashboard.sessions.filter((session) => !session.revoked_at))
    : []

  const activeSessionCount = socialDashboard
    ? socialDashboard.sessions.filter((session) => !session.revoked_at).length
    : 0

  const providerCount = socialDashboard?.accounts.length ?? 0

  const hiddenRevokedCount = socialDashboard
    ? socialDashboard.sessions.filter((session) => Boolean(session.revoked_at)).length
    : 0

  if (loading) return <SettingsSkeleton />

  return (
    <div className="page-container flex-col pt-24 pb-10">
      <div className="page-content max-w-3xl mx-auto px-3 sm:px-6 flex flex-col gap-4 sm:gap-6">
        <div className="settings-section p-4 sm:p-6">
          <div className="settings-section-header">
            <div>
              <h1 className="settings-section-title text-xl">Nastavení</h1>
              <p className="text-sm text-secondary mt-1">
                Správa účtu, připojených poskytovatelů a vzhledu aplikace.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-2.5 sm:p-3">
              <p className="text-xs text-secondary">Propojení</p>
              <p className="text-base sm:text-lg font-semibold">{providerCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-2.5 sm:p-3">
              <p className="text-xs text-secondary">Aktivní relace</p>
              <p className="text-base sm:text-lg font-semibold">{activeSessionCount}</p>
            </div>
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-2.5 sm:p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-secondary">Email</p>
              <p className="text-base sm:text-lg font-semibold">{user?.email ? 'Ano' : 'Ne'}</p>
            </div>
          </div>
        </div>

        <div className="settings-section p-4 sm:p-6">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Profil</h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full initials-avatar flex items-center justify-center text-xl sm:text-2xl font-bold">
                {user?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-base sm:text-lg truncate">{user?.full_name ?? 'Neznámý uživatel'}</p>
              <p className="text-sm text-secondary truncate">{user?.email ?? '—'}</p>
              {!user?.email && (
                <p className="text-xs text-secondary mt-1 leading-5">
                  Primární identita je vedená přes poskytovatele, ne přes e-mail.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section p-4 sm:p-6">
          <button
            type="button"
            className="settings-section-header w-full justify-between text-left"
            onClick={() => setSocialExpanded((value) => !value)}
            aria-expanded={socialExpanded}
          >
            <div>
              <h2 className="settings-section-title">Sociální účty a relace</h2>
              <p className="text-sm text-secondary mt-1">
                {isCompactMobile ? 'Klepněte pro zobrazení detailů.' : 'Připojení poskytovatelé, aktivní relace a auditní stopa.'}
              </p>
            </div>
            <span className="text-xs text-link font-medium whitespace-nowrap">
              {socialExpanded ? 'Skrýt' : 'Zobrazit'}
            </span>
          </button>

          {socialExpanded && (
            <div className="mt-4 flex flex-col gap-4">
              {socialLoading && <p className="text-sm text-secondary">Načítám sociální dashboard...</p>}

              {!socialLoading && socialDashboard && socialDashboard.accounts.length === 0 && (
                <p className="text-sm text-secondary">Žádný připojený poskytovatel.</p>
              )}

              {!socialLoading && socialDashboard?.accounts.map(account => (
                <div key={`${account.provider}-${account.social_id}`} className="rounded-xl border border-black/10 dark:border-white/10 p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium capitalize">{account.provider}</p>
                      <p className="text-xs text-secondary">ID: {account.social_id}</p>
                      <p className="text-xs text-secondary">Propojeno: {formatDate(account.linked_at)}</p>
                      <p className="text-xs text-secondary">Poslední login: {formatDate(account.last_login_at)}</p>
                      <p className="text-xs text-secondary">Aktivní relace: {account.active_sessions}</p>
                      <p className="text-xs text-secondary">
                        E-mail z poskytovatele: {account.has_real_email ? account.provider_email : 'Nedostupný (provider-only identita)'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlinkProvider(account.provider)}
                      className="setting-value-option shrink-0 w-full sm:w-auto"
                      disabled={busyProvider === account.provider}
                    >
                      {busyProvider === account.provider ? 'Odpojuji...' : 'Odpojit'}
                    </button>
                  </div>
                </div>
              ))}

              {!socialLoading && socialDashboard && socialDashboard.sessions.length > 0 && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Relace</p>
                    {hiddenRevokedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRevokedSessions((v) => !v)}
                        className="text-xs text-link"
                      >
                        {showRevokedSessions
                          ? 'Skrýt historii'
                          : `Zobrazit historii (${hiddenRevokedCount})`}
                      </button>
                    )}
                  </div>
                  {sessionsToShow.length === 0 && (
                    <p className="text-xs text-secondary">Nejsou zde žádné aktivní relace.</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {sessionsToShow.map(session => (
                      <div key={session.id} className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div>
                          <p className="text-sm capitalize">
                            {session.provider} {session.is_current ? '(aktuální)' : ''}
                          </p>
                          <p className="text-xs text-secondary">Vytvořeno: {formatDate(session.created_at)}</p>
                          <p className="text-xs text-secondary">Platnost do: {formatDate(session.expires_at)}</p>
                          <p className="text-xs text-secondary">UA: {session.user_agent ?? 'Neznámé zařízení'}</p>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(session)}
                          className="setting-value-option w-full sm:w-auto"
                          disabled={Boolean(session.revoked_at) || busySessionId === session.id}
                        >
                          {session.revoked_at
                            ? 'Neaktivní'
                            : busySessionId === session.id
                              ? 'Ruším...'
                              : 'Zneplatnit'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!socialLoading && socialDashboard && socialDashboard.events.length > 0 && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10">
                  <p className="text-sm font-medium mb-2">Audit integrace (posledních 30 událostí)</p>
                  <div className="flex flex-col gap-1 max-h-44 overflow-auto pr-1">
                    {socialDashboard.events.map((event, idx) => (
                      <p key={`${event.created_at}-${event.event}-${idx}`} className="text-xs text-secondary">
                        {formatDate(event.created_at)} · {event.provider ?? 'oauth'} · {event.event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="settings-section p-4 sm:p-6">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Motiv</h2>
          </div>
          <div className="setting-value-group justify-start">
            <button
              onClick={() => handleThemeChange('light')}
              className={`setting-value-option ${themePreference === 'light' ? 'setting-value-option-active' : ''}`}
              aria-pressed={themePreference === 'light'}
            >
              Světlý
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`setting-value-option ${themePreference === 'dark' ? 'setting-value-option-active' : ''}`}
              aria-pressed={themePreference === 'dark'}
            >
              Tmavý
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`setting-value-option ${themePreference === 'system' ? 'setting-value-option-active' : ''}`}
              aria-pressed={themePreference === 'system'}
            >
              Podle systému
            </button>
          </div>
        </div>

        <div className="settings-section p-4 sm:p-6 border-2 border-red-500/20">
          <div className="settings-section-header">
            <h2 className="settings-section-title text-danger">Nebezpečná zóna</h2>
          </div>
          <p className="text-sm text-secondary mb-3">
            Smazání účtu je nevratné. Budou smazána všechna vaše auta, jízdy, pozvánky a účast v jízdách.
          </p>
          <button
            onClick={toggleDeleteDialog}
            className="button-danger w-full"
          >
            Smazat účet trvale
          </button>
        </div>

        <div className="settings-section p-4 sm:p-6">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Dokumenty</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/privacy"
              className="text-sm text-link"
            >
              Zásady ochrany osobních údajů
            </Link>
            <Link
              to="/terms"
              className="text-sm text-link"
            >
              Podmínky použití
            </Link>
          </div>
        </div>

      
      <DeleteDialog 
        ref={deleteDialogRef} 
        toggle={toggleDeleteDialog}
        action={handleDeleteAccount}
      >
        <h3 className="dialog-title">Opravdu chcete smazat svůj účet?</h3>
        <p className="dialog-text">
          Tato akce je <strong>nevratná</strong>. Všechna vaše data budou trvale smazána:
        </p>
        <ul className="dialog-text list-disc list-inside space-y-1 mt-2">
          <li>Všechna vaše auta</li>
          <li>Všechny vaše jízdy</li>
          <li>Pozvánky a účast v jízdách</li>
          <li>Propojení se sociálními sítěmi</li>
        </ul>
      </DeleteDialog>
      </div>
    </div>
  )
}