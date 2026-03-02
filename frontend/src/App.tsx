import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import { useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { ToastContainer } from 'react-toastify'
import { AUTH_EXPIRED_EVENT } from './api/axios'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import ProtectedRoute from './utils/ProtectedRoute'
import PageNotFound from './pages/PageNotFound'
import SettingsPage from './pages/SettingsPage'
import AnonymousRoute from './utils/AnonymousRoute'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import RidesPage from './pages/RidesPage'
import RideDetailPage from './pages/RideDetailPage'
import CreateRidePage from './pages/CreateRidePage'
import CarsPage from './pages/CarsPage'
import CarDetailPage from './pages/CarDetailPage'
import CreateCarPage from './pages/CreateCarPage'

const isDev = import.meta.env.MODE === 'development'

const SeatRendererTestPage = isDev ? lazy(() => import('./pages/SeatRendererTestPage')) : null
const SeatRendererDemo = isDev ? lazy(() => import('./pages/SeatRendererDemo')) : null
const SeatPositionTest = isDev ? lazy(() => import('./pages/SeatPositionTest')) : null
const DialogExamples = isDev ? lazy(() => import('./examples/DialogExamples')) : null

function AppRoutes() {
  const navigate = useNavigate()

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const handler = () => navigate('/login?expired=1')
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
  }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rides" replace />} />
      <Route path="*" element={<PageNotFound />} />

      <Route element={<AnonymousRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      </Route>

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Jízdy */}
        <Route path="/rides" element={<RidesPage />} />
        <Route path="/rides/new" element={<CreateRidePage />} />
        <Route path="/rides/:id" element={<RideDetailPage />} />

        {/* Auta */}
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/new" element={<CreateCarPage />} />
        <Route path="/cars/:id" element={<CarDetailPage />} />
        <Route path="/cars/:id/edit" element={<CreateCarPage />} />

        {/* Nastavení */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Dev only */}
        {isDev && SeatRendererTestPage && (
          <Route path="/test-seats" element={<Suspense fallback={null}><SeatRendererTestPage /></Suspense>} />
        )}
        {isDev && SeatRendererDemo && (
          <Route path="/demo-seats" element={<Suspense fallback={null}><SeatRendererDemo /></Suspense>} />
        )}
        {isDev && SeatPositionTest && (
          <Route path="/position-test" element={<Suspense fallback={null}><SeatPositionTest /></Suspense>} />
        )}
        {isDev && DialogExamples && (
          <Route path="/dialogs" element={<Suspense fallback={null}><DialogExamples /></Suspense>} />
        )}
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar
        pauseOnHover
        draggable
        theme="colored"
      />
    </Router>
  )
}

export default App