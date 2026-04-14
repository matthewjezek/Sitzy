import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
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
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="animate-pulse page-content max-w-lg mx-auto w-full p-6 flex flex-col gap-6">
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
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const [emailNotifications, setEmailNotifications] = useState<'enabled' | 'disabled'>('enabled')
  const [socialDashboard, setSocialDashboard] = useState<SocialDashboard | null>(null)
  const [socialLoading, setSocialLoading] = useState(false)
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [busyProvider, setBusyProvider] = useState<string | null>(null)
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
      window.location.href = '/login'
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
      await refreshSocialDashboard()

      if (session.is_current) {
        toast.success('Aktuální relace byla odhlášena.')
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return
      }

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

  if (loading) return <SettingsSkeleton />

  return (
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="page-content max-w-lg mx-auto w-full p-6 flex flex-col gap-6">

      
      <div className="card p-6 flex items-center gap-4">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Avatar"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full initials-avatar flex items-center justify-center text-2xl font-bold">
            {user?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <p className="font-semibold text-lg">{user?.full_name ?? 'Neznámý uživatel'}</p>
          <p className="text-sm text-secondary">{user?.email ?? '—'}</p>
          {user?.social_accounts && user.social_accounts.length > 0 && (
            <p className="text-xs text-accent mt-1">
              Přihlášen přes{' '}
              {user.social_accounts.map(a => (
                <span key={a.provider} className="capitalize font-medium text-accent">
                  {a.provider}
                </span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [] as React.ReactNode[])}
            </p>
          )}
          {!user?.email && (
            <p className="text-xs text-secondary mt-1">
              Primární identita je vedená přes poskytovatele (např. X ID), ne přes e-mail.
            </p>
          )}
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Sociální účty a relace</h3>
        {socialLoading && <p className="text-sm text-secondary">Načítám sociální dashboard...</p>}

        {!socialLoading && socialDashboard && socialDashboard.accounts.length === 0 && (
          <p className="text-sm text-secondary">Žádný připojený poskytovatel.</p>
        )}

        {!socialLoading && socialDashboard?.accounts.map(account => (
          <div key={`${account.provider}-${account.social_id}`} className="rounded-lg border border-black/10 dark:border-white/10 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
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
                className="setting-value-option"
                disabled={busyProvider === account.provider}
              >
                {busyProvider === account.provider ? 'Odpojuji...' : 'Odpojit'}
              </button>
            </div>
          </div>
        ))}

        {!socialLoading && socialDashboard && socialDashboard.sessions.length > 0 && (
          <div className="pt-2 border-t border-black/10 dark:border-white/10">
            <p className="text-sm font-medium mb-2">Relace</p>
            <div className="flex flex-col gap-2">
              {socialDashboard.sessions.map(session => (
                <div key={session.id} className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-4">
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
                    className="setting-value-option"
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

      
      <div className="card p-4 flex flex-col gap-3">
        <div className="setting-row">
          <span className="setting-label">Motiv</span>
          <div className="setting-value-group">
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

        <div className="setting-row">
          <span className="setting-label">E-mail notifikace</span>
          <div className="setting-value-group">
            <button
              onClick={() => setEmailNotifications('enabled')}
              className={`setting-value-option ${emailNotifications === 'enabled' ? 'setting-value-option-active' : ''}`}
              aria-pressed={emailNotifications === 'enabled'}
            >
              Zapnuto
            </button>
            <button
              onClick={() => setEmailNotifications('disabled')}
              className={`setting-value-option ${emailNotifications === 'disabled' ? 'setting-value-option-active' : ''}`}
              aria-pressed={emailNotifications === 'disabled'}
            >
              Vypnuto
            </button>
          </div>
        </div>
      </div>

      
      <div className="card p-4 border-2 border-red-500/20">
        <h3 className="text-sm font-semibold text-danger mb-2">Nebezpečná zóna</h3>
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

      
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3">Dokumenty</h3>
        <div className="flex flex-col gap-2">
          <Link
            to="/privacy"
            className="text-sm text-link hover:underline"
          >
            Zásady ochrany osobních údajů
          </Link>
          <Link
            to="/terms"
            className="text-sm text-link hover:underline"
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