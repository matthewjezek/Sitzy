import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';
import instance from '../api/axios';
import {
  applyThemePreference,
  getThemePreference,
  type ThemePreference,
} from '../utils/theme';

interface SocialAccount {
  provider: string
  email: string | null
  linked_at: string
}

interface User {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  social_accounts: SocialAccount[]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-6 max-w-lg mx-auto mt-10 p-6">
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
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const [emailNotifications, setEmailNotifications] = useState<'enabled' | 'disabled'>('enabled')

  useEffect(() => {
    instance.get<User>('/auth/me')
      .then(res => setUser(res.data))
      .catch(err => {
        toast.error(
          isAxiosError(err)
            ? (err.response?.data?.detail ?? 'Nepodařilo se načíst profil.')
            : 'Nastala neočekávaná chyba.'
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme)
    applyThemePreference(nextTheme)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login?logged_out=1'
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 flex flex-col gap-6">

      {/* Profil */}
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
          <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
          {user?.social_accounts && user.social_accounts.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Přihlášen přes{' '}
              {user.social_accounts.map(a => (
                <span key={a.provider} className="capitalize font-medium text-accent">
                  {a.provider}
                </span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [] as React.ReactNode[])}
            </p>
          )}
        </div>
      </div>

      {/* Motiv */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="setting-row">
          <span className="setting-label">Motiv</span>
          <div className="setting-value-group">
            <button
              onClick={() => handleThemeChange('light')}
              className={`setting-value-option ${themePreference === 'light' ? 'setting-value-option-active' : ''}`}
            >
              Světlý
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`setting-value-option ${themePreference === 'dark' ? 'setting-value-option-active' : ''}`}
            >
              Tmavý
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`setting-value-option ${themePreference === 'system' ? 'setting-value-option-active' : ''}`}
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
            >
              Zapnuto
            </button>
            <button
              onClick={() => setEmailNotifications('disabled')}
              className={`setting-value-option ${emailNotifications === 'disabled' ? 'setting-value-option-active' : ''}`}
            >
              Vypnuto
            </button>
          </div>
        </div>
      </div>

      {/* Odhlášení */}
      <button
        onClick={handleLogout}
        className="w-full button-danger flex items-center justify-center"
      >
        Odhlásit se
      </button>

    </div>
  )
}