import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import { useEffect } from 'react'
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

// ✅ Dev only stránky
const isDev = import.meta.env.MODE === 'development'
const SeatRendererTestPage = isDev ? (await import('./pages/SeatRendererTestPage')).default : null
const SeatRendererDemo = isDev ? (await import('./pages/SeatRendererDemo')).default : null
const SeatPositionTest = isDev ? (await import('./pages/SeatPositionTest')).default : null
const DialogExamples = isDev ? (await import('./examples/DialogExamples')).default : null

function AppRoutes() {
  const navigate = useNavigate()

  // ✅ Dark mode init – čte localStorage při startu
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
        {/* Main pages */}
        <Route path="/rides" element={<div>RidesPage – TODO</div>} />
        <Route path="/rides/new" element={<div>CreateRidePage – TODO</div>} />
        <Route path="/rides/:id" element={<div>RideDetailPage – TODO</div>} />
        <Route path="/cars" element={<div>CarsPage – TODO</div>} />
        <Route path="/cars/new" element={<div>CreateCarPage – TODO</div>} />
        <Route path="/cars/:id" element={<div>CarDetailPage – TODO</div>} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Dev only pages */}
        {isDev && SeatRendererTestPage && <Route path="/test-seats" element={<SeatRendererTestPage />} />}
        {isDev && SeatRendererDemo && <Route path="/demo-seats" element={<SeatRendererDemo />} />}
        {isDev && SeatPositionTest && <Route path="/position-test" element={<SeatPositionTest />} />}
        {isDev && DialogExamples && <Route path="/dialogs" element={<DialogExamples />} />}
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
