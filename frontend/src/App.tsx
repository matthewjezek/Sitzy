import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { Slide, ToastContainer } from 'react-toastify'
import { AUTH_EXPIRED_EVENT } from './api/axios'
import Layout from './components/Layout'
import ProtectedRoute from './utils/ProtectedRoute'
import AnonymousRoute from './utils/AnonymousRoute'
import {
  applyThemePreference,
  getThemePreference,
  resolveThemePreference,
  THEME_CHANGED_EVENT,
} from './utils/theme'
import { PWAProvider } from './context/PWAProvider'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const PageNotFound = lazy(() => import('./pages/PageNotFound'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))
const DeletionStatusPage = lazy(() => import('./pages/DeletionStatusPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const RidesPage = lazy(() => import('./pages/RidesPage'))
const RideDetailPage = lazy(() => import('./pages/RideDetailPage'))
const CreateRidePage = lazy(() => import('./pages/CreateRidePage'))
const CarsPage = lazy(() => import('./pages/CarsPage'))
const CarDetailPage = lazy(() => import('./pages/CarDetailPage'))
const CreateCarPage = lazy(() => import('./pages/CreateCarPage'))
const InviteEntryPage = lazy(() => import('./pages/InviteEntryPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SurveyRedirectPage = lazy(() => import('./pages/SurveyRedirectPage'))

const isDev = import.meta.env.MODE === 'development'

const SeatRendererLabPage = isDev ? lazy(() => import('./pages/SeatRendererLabPage')) : null

function AppRoutes() {
  const navigate = useNavigate()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyStoredTheme = () => {
      const preference = getThemePreference()
      applyThemePreference(preference)
    }

    const handleSystemThemeChange = () => {
      if (getThemePreference() === 'system') {
        applyThemePreference('system')
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        applyStoredTheme()
      }
    }

    applyStoredTheme()
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const handler = () => navigate('/login?expired=1')
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
  }, [navigate])

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <Routes>
        <Route path="*" element={<PageNotFound />} />

        <Route element={<AnonymousRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/deletion-status" element={<DeletionStatusPage />} />
        </Route>

        {/* Public routes (accessible to everyone) */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/i/:inviteToken" element={<InviteEntryPage />} />
        <Route path="/survey" element={<SurveyRedirectPage />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Rides */}
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/rides/new" element={<CreateRidePage />} />
          <Route path="/rides/:id" element={<RideDetailPage />} />

          {/* Cars */}
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/cars/new" element={<CreateCarPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/cars/:id/edit" element={<CreateCarPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Dev only */}
          {isDev && SeatRendererLabPage && (
            <Route path="/seat-lab" element={<Suspense fallback={null}><SeatRendererLabPage /></Suspense>} />
          )}
        </Route>
      </Routes>
    </Suspense>
  )
}

// Handle survey token synchronously on load to ensure child components have access to it on first render
const initSurveyToken = () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    if (window.location.hostname === '127.0.0.1') {
      const newUrl = window.location.href.replace('127.0.0.1', 'localhost')
      window.location.replace(newUrl)
      return
    }
    localStorage.setItem('survey_token', token)
    params.delete('token')
    const newSearch = params.toString()
    const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '')
    window.history.replaceState({}, '', newPath)
  }
}
initSurveyToken()

function App() {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveThemePreference(getThemePreference()))

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const syncThemeState = () => {
      const preference = getThemePreference()
      setResolvedTheme(resolveThemePreference(preference))
    }

    const handleThemeChanged = () => syncThemeState()
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        syncThemeState()
      }
    }
    const handleSystemThemeChange = () => {
      if (getThemePreference() === 'system') {
        syncThemeState()
      }
    }

    syncThemeState()
    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChanged)
    window.addEventListener('storage', handleStorageChange)
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChanged)
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])
  
  return (
    <Router>
      <PWAProvider>
        <AppRoutes />
        <ToastContainer
          position="bottom-left"
          autoClose={3000}
          hideProgressBar
          pauseOnHover
          draggable
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          transition={Slide}
        />
      </PWAProvider>
    </Router>
  )
}

export default App