import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';
import instance from '../api/axios';

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
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-56 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )

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

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
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
          <div className="w-16 h-16 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-2xl font-bold text-violet-700 dark:text-violet-200">
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
                <span key={a.provider} className="capitalize font-medium text-violet-500">
                  {a.provider}
                </span>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [] as React.ReactNode[])}
            </p>
          )}
        </div>
      </div>

      {/* Tmavý režim */}
      <div className="card p-4 flex items-center justify-between">
        <span className="font-medium">Tmavý režim</span>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
            darkMode ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
              darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Odhlášení */}
      <button
        onClick={handleLogout}
        className="w-full py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
      >
        Odhlásit se
      </button>

    </div>
  )
}