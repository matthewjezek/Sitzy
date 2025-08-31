import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
// import SeatPage from './pages/SeatPage'
import InvitationListPage from './pages/InvitePage'
import CarPage from './pages/CarPage'
import CreateCarPage from './pages/CreateCarPage'
import Layout from './components/Layout'
import ProtectedRoute from './utils/ProtectedRoute'
import PageNotFound from './pages/PageNotFound'
import SeatRendererTestPage from './pages/SeatRendererTestPage';
import SeatRendererDemo from './pages/SeatRendererDemo';
import SeatPositionTest from './pages/SeatPositionTest';
import { ToastContainer } from 'react-toastify';
import SeatPageNew from './pages/SeatPageNew'
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Přesměrování rootu na dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Stránka pro 404 */}
        <Route path="*" element={<PageNotFound />} />
        {/* Veřejné stránky */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Stránky pod layoutem */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/seats" element={<SeatPage />} /> */}
          <Route path="/invitations" element={<InvitationListPage />} />
          <Route path="/car" element={<CarPage />} />
          <Route path="/create-car" element={<CreateCarPage />} />
          <Route path="/test-seats" element={<SeatRendererTestPage />} />
          <Route path="/demo-seats" element={<SeatRendererDemo />} />
          <Route path="/position-test" element={<SeatPositionTest />} />
          <Route path="/seats" element={<SeatPageNew />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar pauseOnHover draggable theme="colored" />
    </Router>
  )
}

export default App
