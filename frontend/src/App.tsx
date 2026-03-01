import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CarPage from './pages/CarPage'
import { CreateCarPage } from './pages/CreateCarPage'
import Layout from './components/Layout'
import ProtectedRoute from './utils/ProtectedRoute'
import PageNotFound from './pages/PageNotFound'
import SeatRendererTestPage from './pages/SeatRendererTestPage';
import SeatRendererDemo from './pages/SeatRendererDemo';
import SeatPositionTest from './pages/SeatPositionTest';
import { ToastContainer } from 'react-toastify';
import SeatPageNew from './pages/SeatPageNew'
import SettingsPage from "./pages/SettingsPage";
import AnonymousRoute from './utils/AnonymousRoute'
import DialogExamples from './examples/DialogExamples'
import { useEffect } from 'react'
import { AUTH_EXPIRED_EVENT } from './api/axios'
import { useNavigate } from 'react-router'
import OAuthCallbackPage from './pages/OAuthCallbackPage'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => navigate('/login?expired=1')
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
  }, [navigate])
  
  return (
    <Router>
      <Routes>
        {/* Přesměrování rootu na dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Stránka pro 404 */}
        <Route path="*" element={<PageNotFound />} />
        {/* Veřejné stránky */}
        <Route element={<AnonymousRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />  {/* ✅ veřejná route */}
        </Route>
        {/* Stránky pod layoutem */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/car" element={<CarPage />} />
          <Route path="/create-car" element={<CreateCarPage />} />
          <Route path="/edit-car" element={<CreateCarPage editMode={true} />} />
          <Route path="/test-seats" element={<SeatRendererTestPage />} />
          <Route path="/demo-seats" element={<SeatRendererDemo />} />
          <Route path="/position-test" element={<SeatPositionTest />} />
          <Route path="/seats" element={<SeatPageNew />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dialogs" element={<DialogExamples />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar pauseOnHover draggable theme="colored" />
    </Router>
  )
}

export default App
