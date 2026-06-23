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
import { completeTask } from '../utils/survey';
import { DeleteDialog, ConfirmDialog } from '../components/Dialog';
import { useAuth } from '../hooks/useAuth';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import type { SocialDashboard, SocialSessionInfo } from '../types/models';
import pkg from '../../package.json';

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

  const modifySocialDashboardForSurvey = (data: SocialDashboard): SocialDashboard => {
    if (!localStorage.getItem('survey_token')) return data

    const cloned = JSON.parse(JSON.stringify(data)) as SocialDashboard

    // 1. Session injection: if no mock revoked flag is set, inject a second session
    const mockSessionRevoked = localStorage.getItem('survey_mock_session_revoked') === 'true'
    const hasOtherSessions = cloned.sessions.some((s: SocialSessionInfo) => !s.is_current && !s.revoked_at)
    if (!mockSessionRevoked && !hasOtherSessions) {
      cloned.sessions.push({
        id: 'mock-session-survey-other',
        provider: cloned.accounts[0]?.provider === 'twitter' ? 'facebook' : 'twitter',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        revoked_at: null,
        user_agent: 'Safari on iPhone (Simulated Study Session)',
        is_current: false,
      })
    } else if (mockSessionRevoked) {
      const mockSession = cloned.sessions.find((s: SocialSessionInfo) => s.id === 'mock-session-survey-other')
      if (mockSession) {
        mockSession.revoked_at = new Date().toISOString()
      } else {
        cloned.sessions.push({
          id: 'mock-session-survey-other',
          provider: cloned.accounts[0]?.provider === 'twitter' ? 'facebook' : 'twitter',
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
          revoked_at: new Date().toISOString(),
          user_agent: 'Safari on iPhone (Simulated Study Session)',
          is_current: false,
        })
      }
    }

    // Filter out accounts that have been marked as unlinked in survey mode
    cloned.accounts = cloned.accounts.filter((acc: { provider: string }) => {
      const val = localStorage.getItem(`survey_mock_${acc.provider.toLowerCase()}_unlinked`)
      return !val || val === 'false'
    })

    // 2. Provider unlinking injection: if they only have 1 provider, inject a mock second provider
    if (cloned.accounts.length === 1) {
      const currentProvider = cloned.accounts[0].provider
      const mockProvider = currentProvider.toLowerCase() === 'twitter' ? 'facebook' : 'twitter'
      const mockProviderUnlinkedVal = localStorage.getItem(`survey_mock_${mockProvider}_unlinked`)
      const mockProviderUnlinked = mockProviderUnlinkedVal && mockProviderUnlinkedVal !== 'false'

      if (!mockProviderUnlinked) {
        cloned.accounts.push({
          provider: mockProvider,
          social_id: `mock-${mockProvider}-id`,
          linked_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          provider_email: `survey-participant@mock-${mockProvider}.com`,
          has_real_email: true,
          active_sessions: 1,
          last_login_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        })

        // Also push a linking event
        cloned.events.unshift({
          event: 'linked',
          provider: mockProvider,
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          metadata: {},
        })
      }
    }

    // 3. Inject audit events for any unlinked providers
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('survey_mock_') && key.endsWith('_unlinked')) {
        const provider = key.substring('survey_mock_'.length, key.length - '_unlinked'.length)
        const timestamp = localStorage.getItem(key)
        if (timestamp && timestamp !== 'false') {
          const alreadyHasEvent = cloned.events.some(
            e => e.event === 'social_provider_unlinked' && e.provider?.toLowerCase() === provider.toLowerCase()
          )
          if (!alreadyHasEvent) {
            cloned.events.unshift({
              event: 'social_provider_unlinked',
              provider: provider,
              created_at: timestamp === 'true' ? new Date().toISOString() : timestamp,
              metadata: { provider: provider },
            })
          }
        }
      }
    })

    // Sort events by created_at descending to make sure audit looks correct
    cloned.events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return cloned
  }
  const [socialLoading, setSocialLoading] = useState(false)
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [busyProvider, setBusyProvider] = useState<string | null>(null)
  const [showRevokedSessions, setShowRevokedSessions] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'sessions' | 'privacy' | 'dev'>('profile')
  const [revokingOthers, setRevokingOthers] = useState(false)
  const [showDemoUI, setShowDemoUIState] = useState(() => localStorage.getItem('sitzy_show_demo_ui') !== 'false')
  const handleToggleDemoUI = (checked: boolean) => {
    setShowDemoUIState(checked)
    localStorage.setItem('sitzy_show_demo_ui', checked ? 'true' : 'false')
    window.dispatchEvent(new Event('sitzy:show_demo_ui_changed'))
    toast.success(checked ? 'Demo banner byl zapnut.' : 'Demo banner byl skryt.')
  }
  const [hasSurveyToken, setHasSurveyToken] = useState(() => Boolean(localStorage.getItem('survey_token')))
  const handleToggleSurveyMode = () => {
    if (hasSurveyToken) {
      localStorage.removeItem('survey_token')
      localStorage.removeItem('survey_completed')
      localStorage.removeItem('survey_completed_checkpoints')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('survey_mock_')) {
          localStorage.removeItem(key)
        }
      })
      toast.success('Testovací režim průzkumu byl vypnut.')
    } else {
      localStorage.setItem('survey_token', 'test-study-token')
      toast.success('Testovací režim průzkumu byl zapnut.')
    }
    setHasSurveyToken(!hasSurveyToken)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }
  const handleRevokeOthers = () => {
    showConfirm(
      'Odhlásit ostatní zařízení',
      'Opravdu chcete zneplatnit všechny ostatní relace a odhlásit se na ostatních zařízeních?',
      async () => {
        try {
          setRevokingOthers(true)
          if (localStorage.getItem('survey_token')) {
            localStorage.setItem('survey_mock_session_revoked', 'true')
          }
          await instance.post('/auth/social/sessions/revoke-others')
          toast.success('Ostatní relace byly zneplatněny.')
          completeTask('session_revoked_others')
          await refreshSocialDashboard()
        } catch {
          toast.error('Nepodařilo se zneplatnit ostatní relace.')
        } finally {
          setRevokingOthers(false)
        }
      },
      'warning',
      'Odhlásit ostatní'
    )
  }
  const [anonymizeExports, setAnonymizeExports] = useState<boolean>(() => {
    return localStorage.getItem('sitzy_anonymize_exports') !== 'false';
  })
  const handleAnonymizeExportsChange = (checked: boolean) => {
    setAnonymizeExports(checked)
    localStorage.setItem('sitzy_anonymize_exports', checked ? 'true' : 'false')
    toast.success(checked ? 'Anonymizace exportů byla zapnuta.' : 'Anonymizace exportů byla vypnuta.')
  }
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
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
    isPWAInstalled,
    isUpdateAvailable,
    error,
    applyUpdate
  } = usePWAUpdate();

  useEffect(() => {
    document.title = 'Sitzy - Nastavení'

    const loadDashboard = async () => {
      setSocialLoading(true)
      try {
        const { data } = await instance.get<SocialDashboard>('/auth/social/dashboard')
        setSocialDashboard(modifySocialDashboardForSurvey(data))
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
    setSocialDashboard(modifySocialDashboardForSurvey(data))
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
      completeTask('account_anonymized')
      localStorage.removeItem('access_token')
      
      if (localStorage.getItem('survey_token')) {
        localStorage.setItem('survey_completed', 'true')
        navigate('/survey', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
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
      if (session.id === 'mock-session-survey-other') {
        localStorage.setItem('survey_mock_session_revoked', 'true')
        toast.success('Relace byla zneplatněna.')
        completeTask('session_revoked_others')
        await refreshSocialDashboard()
        return
      }

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
    // Prevent unlinking the logged-in provider
    const currentSession = socialDashboard?.sessions.find(s => s.is_current)
    if (currentSession && currentSession.provider === provider) {
      toast.error('Nelze odpojit poskytovatele, kterým jste právě přihlášeni.')
      return
    }

    try {
      setBusyProvider(provider)
      if (localStorage.getItem('survey_token')) {
        localStorage.setItem(`survey_mock_${provider.toLowerCase()}_unlinked`, 'true')
        toast.success(`Poskytovatel ${provider} byl odpojen.`)
        completeTask('unlink_social')
        await refreshSocialDashboard()
        return
      }

      await instance.post(`/auth/social/providers/${provider}/unlink`)
      await Promise.all([refreshSocialDashboard(), refreshUser()])
      toast.success(`Poskytovatel ${provider} byl odpojen.`)
      completeTask('unlink_social')
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

  const [demoBusy, setDemoBusy] = useState(false)

  const handleGenerateDemoData = () => {
    showConfirm(
      'Generovat demo data',
      'Opravdu chcete vygenerovat demo data pro aktuální účet?',
      async () => {
        try {
          setDemoBusy(true)
          await instance.post('/auth/dev/fixtures/generate')
          toast.success('Demo data byla vygenerována.')
          await Promise.all([refreshSocialDashboard(), refreshUser()])
        } catch {
          toast.error('Generování demo dat se nezdařilo.')
        } finally {
          setDemoBusy(false)
        }
      },
      'info',
      'Vygenerovat'
    )
  }

  const handleResetDemoData = () => {
    showConfirm(
      'Resetovat demo data',
      'Opravdu chcete smazat všechna demo data vygenerovaná pro tento účet?',
      async () => {
        try {
          setDemoBusy(true)
          await instance.post('/auth/dev/fixtures/reset')
          toast.success('Demo data byla smazána.')
          await Promise.all([refreshSocialDashboard(), refreshUser()])
        } catch {
          toast.error('Reset demo dat se nezdařil.')
        } finally {
          setDemoBusy(false)
        }
      },
      'danger',
      'Smazat'
    )
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

  const isDevMode = import.meta.env.MODE === 'development';
  type TabId = 'profile' | 'social' | 'sessions' | 'privacy' | 'dev';
  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profil' },
    { id: 'social', label: 'Propojení' },
    { id: 'sessions', label: 'Aktivní relace' },
    { id: 'privacy', label: 'Soukromí' }
  ];
  if (isDevMode) {
    tabs.push({ id: 'dev', label: 'Vývoj / Tester' });
  }

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
            <div className="rounded-xl border theme-border theme-surface-muted p-2.5 sm:p-3">
              <p className="text-xs text-secondary">Propojení</p>
              <p className="text-base sm:text-lg font-semibold">{providerCount}</p>
            </div>
            <div className="rounded-xl border theme-border theme-surface-muted p-2.5 sm:p-3">
              <p className="text-xs text-secondary">Aktivní relace</p>
              <p className="text-base sm:text-lg font-semibold">{activeSessionCount}</p>
            </div>
            <div className="rounded-xl border theme-border theme-surface-muted p-2.5 sm:p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-secondary">Email</p>
              <p className="text-base sm:text-lg font-semibold">{user?.email ? 'Ano' : 'Ne'}</p>
            </div>
          </div>
        </div>

        <div className="flex border-b theme-divider overflow-x-auto scrollbar-none gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 border-b-2 font-semibold text-sm whitespace-nowrap transition-all duration-200 hover:cursor-pointer ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <>
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
              <div className="settings-section-header">
                <h2 className="settings-section-title">Motiv</h2>
              </div>
              <div className="setting-value-group justify-start">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`setting-value-option ${themePreference === 'light' ? 'setting-value-option-active' : ''}`}
                  aria-pressed={themePreference === 'light'}
                >
                  Světlý
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`setting-value-option ${themePreference === 'dark' ? 'setting-value-option-active' : ''}`}
                  aria-pressed={themePreference === 'dark'}
                >
                  Tmavý
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`setting-value-option ${themePreference === 'system' ? 'setting-value-option-active' : ''}`}
                  aria-pressed={themePreference === 'system'}
                >
                  Podle systému
                </button>
              </div>
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

            {import.meta.env.MODE === 'production' && isPWAInstalled && (
              <div className="settings-section p-4 sm:p-6">
                <div className="settings-section-header flex items-start justify-between gap-4">
                  <div>
                    <h2 className="settings-section-title">Aktualizace aplikace</h2>
                    <p className="text-sm text-secondary mt-1">
                      Aplikace se automaticky aktualizuje na pozadí.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-secondary border theme-border shrink-0">
                    Verze {pkg.version}
                  </span>
                </div>

                {error && (
                  <div className="text-sm text-error mt-3">
                    {error}
                  </div>
                )}

                {isUpdateAvailable ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={applyUpdate}
                      className="button-primary w-full"
                    >
                      Použít aktualizaci a restartovat aplikaci
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-secondary mt-3">
                    Žádná aktualizace není momentálně k dispozici.
                  </p>
                )}
              </div>
            )}

            <div className="settings-section p-4 sm:p-6 border-2 border-red-500/20">
              <div className="settings-section-header">
                <h2 className="settings-section-title text-danger">Nebezpečná zóna</h2>
              </div>
              <p className="text-sm text-secondary mb-3">
                Smazání účtu je nevratné. Budou smazána všechna vaše auta, jízdy, pozvánky a účast v jízdách.
              </p>
              <button
                type="button"
                onClick={toggleDeleteDialog}
                className="button-danger w-full"
              >
                Smazat účet trvale
              </button>
            </div>
          </>
        )}

        {activeTab === 'social' && (
          <div className="settings-section p-4 sm:p-6">
            <div className="settings-section-header">
              <h2 className="settings-section-title">Připojení poskytovatelé</h2>
              <p className="text-sm text-secondary mt-1">
                Správa propojení se sociálními sítěmi a auditní stopa integrace.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {socialLoading && <p className="text-sm text-secondary">Načítám propojení...</p>}

              {!socialLoading && socialDashboard && socialDashboard.accounts.length === 0 && (
                <p className="text-sm text-secondary">Žádný připojený poskytovatel.</p>
              )}

              {!socialLoading && socialDashboard?.accounts.map(account => (
                <div key={`${account.provider}-${account.social_id}`} className="rounded-xl border theme-border theme-surface-muted p-3 sm:p-4">
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
                    {(() => {
                      const currentSession = socialDashboard?.sessions.find(s => s.is_current)
                      const isCurrentProvider = currentSession?.provider === account.provider
                      return (
                        <button
                          type="button"
                          onClick={() => handleUnlinkProvider(account.provider)}
                          className={`setting-value-option shrink-0 w-full sm:w-auto font-medium ${
                            isCurrentProvider ? 'opacity-50 cursor-not-allowed hover:bg-transparent text-zinc-400 dark:text-zinc-600' : ''
                          }`}
                          disabled={busyProvider === account.provider || isCurrentProvider}
                          title={isCurrentProvider ? 'Tento účet nelze odpojit, protože jste jím přihlášeni.' : undefined}
                        >
                          {busyProvider === account.provider ? 'Odpojuji...' : isCurrentProvider ? 'Přihlášen' : 'Odpojit'}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              ))}

              {!socialLoading && socialDashboard && socialDashboard.events.length > 0 && (
                <div className="pt-4 border-t theme-divider">
                  <p className="text-sm font-medium mb-2">Audit integrace (posledních 30 událostí)</p>
                  <div className="flex flex-col gap-1 max-h-60 overflow-auto pr-1">
                    {socialDashboard.events.map((event, idx) => (
                      <p key={`${event.created_at}-${event.event}-${idx}`} className="text-xs text-secondary">
                        {formatDate(event.created_at)} · {event.provider ?? 'oauth'} · {event.event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="settings-section p-4 sm:p-6">
            <div className="settings-section-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="settings-section-title">Aktivní relace</h2>
                  <p className="text-sm text-secondary mt-1">
                    Seznam přihlášených zařízení a relací k tomuto účtu.
                  </p>
                </div>
                {!socialLoading && socialDashboard && activeSessionCount > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeOthers}
                    disabled={revokingOthers}
                    className="button-danger text-xs font-semibold py-1.5 px-3 rounded-lg shrink-0"
                  >
                    {revokingOthers ? 'Odhlašuji...' : 'Odhlásit ostatní zařízení'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {socialLoading && <p className="text-sm text-secondary">Načítám relace...</p>}

              {!socialLoading && socialDashboard && socialDashboard.sessions.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Seznam relací</p>
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
                      <div
                        key={session.id}
                        className={`rounded-xl border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                          session.is_current
                            ? 'session-current font-semibold'
                            : 'theme-border theme-surface-muted'
                        }`}
                      >
                        <div>
                          <p className="text-sm capitalize">
                            {session.provider} {session.is_current ? '(aktuální)' : ''}
                          </p>
                          <p className="text-xs text-secondary">Vytvořeno: {formatDate(session.created_at)}</p>
                          <p className="text-xs text-secondary">Platnost do: {formatDate(session.expires_at)}</p>
                          <p className="text-xs text-secondary truncate max-w-md">UA: {session.user_agent ?? 'Neznámé zařízení'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session)}
                          className="setting-value-option w-full sm:w-auto text-xs"
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
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-section p-4 sm:p-6">
            <div className="settings-section-header">
              <h2 className="settings-section-title">Soukromí a exporty</h2>
              <p className="text-sm text-secondary mt-1">
                Konstrukce exportů a nastavení sdílení dat z jízd.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                id="anonymize-exports"
                checked={anonymizeExports}
                onChange={(e) => handleAnonymizeExportsChange(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent border-zinc-300 dark:border-zinc-700 hover:cursor-pointer"
              />
              <label htmlFor="anonymize-exports" className="text-sm font-medium hover:cursor-pointer">
                Anonymizovat exporty (výchozí)
              </label>
            </div>
            <p className="text-xs text-secondary mt-2">
              Při zapnutí budou exportované karty a soubory JSON standardně skrývat jména a avatary účastníků. Nastavení lze změnit i přímo u konkrétního exportu.
            </p>
          </div>
        )}

        {activeTab === 'dev' && import.meta.env.MODE === 'development' && (
          <div className="settings-section p-4 sm:p-6 border-dashed border-2 border-accent">
            <div className="settings-section-header">
              <h2 className="settings-section-title">Vývojářské nástroje</h2>
              <p className="text-sm text-secondary mt-1">
                Nástroje pro prezentaci a simulaci dat (pouze vývojové prostředí).
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="toggle-demo-banner"
                  checked={showDemoUI}
                  onChange={(e) => handleToggleDemoUI(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent border-zinc-300 dark:border-zinc-700 hover:cursor-pointer"
                />
                <label htmlFor="toggle-demo-banner" className="text-sm font-medium hover:cursor-pointer">
                  Zobrazit demo banner v aplikaci
                </label>
              </div>
              <p className="text-xs text-secondary">
                Zobrazí nebo skryje žlutý pulsing banner „Vývoj / Test Mode“ v pravém dolním rohu obrazovky.
              </p>

              <div className="border-t theme-divider pt-4 flex flex-col gap-3">
                <p className="text-sm font-medium">Generování testovacích dat</p>
                <button
                  type="button"
                  onClick={handleGenerateDemoData}
                  className="button-primary w-full"
                  disabled={demoBusy}
                >
                  {demoBusy ? 'Probíhá...' : 'Vygenerovat demo data'}
                </button>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="button-secondary w-full"
                  disabled={demoBusy}
                >
                  {demoBusy ? 'Probíhá...' : 'Reset demo dat'}
                </button>
              </div>

              <div className="border-t theme-divider pt-4 flex flex-col gap-3">
                <p className="text-sm font-medium">Testování uživatelského průzkumu</p>
                <button
                  type="button"
                  onClick={handleToggleSurveyMode}
                  className={`w-full ${hasSurveyToken ? 'button-danger' : 'button-primary'}`}
                >
                  {hasSurveyToken ? 'Deaktivovat testovací režim průzkumu' : 'Aktivovat testovací režim průzkumu'}
                </button>
              </div>
            </div>
          </div>
        )}

      <DeleteDialog 
        ref={deleteDialogRef} 
        toggle={toggleDeleteDialog}
        action={handleDeleteAccount}
      >
        <h3 className="dialog-title">Opravdu chcete smazat svůj účet?</h3>
        {localStorage.getItem('survey_token') && (
          <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-normal text-left">
            <strong>Účastníku průzkumu:</strong> Smazáním účtu splníte poslední úkol a budete automaticky přesměrováni zpět k odeslání závěrečného dotazníku dotazníkového šetření.
          </div>
        )}
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
    </div>
  )
}