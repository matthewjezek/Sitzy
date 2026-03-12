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
  const { user, loading } = useAuth();
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference())
  const [emailNotifications, setEmailNotifications] = useState<'enabled' | 'disabled'>('enabled')
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    
    document.title = 'Sitzy - Nastavení'
  }, [])

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

      {/* Nebezpečná zóna */}
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

      {/* Dokumenty */}
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

      {/* Delete confirmation dialog */}
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
  )
}