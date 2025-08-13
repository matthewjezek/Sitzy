import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SeatPage from './pages/SeatPage'
import InvitationListPage from './pages/InvitationListPage'
import CarPage from './pages/CarPage'
import CreateCarPage from './pages/CreateCarPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import InvitePage from "./pages/InvitePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Přesměrování rootu na dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Veřejné stránky */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Stránky pod layoutem */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/seats" element={<SeatPage />} />
          <Route path="/invitations" element={<InvitationListPage />} />
          <Route path="/car" element={<CarPage />} />
          <Route path="/create-car" element={<CreateCarPage />} />
          <Route path="/invite" element={<InvitePage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
