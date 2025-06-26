import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SeatPage from './pages/SeatPage'
import InvitationPage from './pages/InvitationPage'
import CarPage from './pages/CarPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        {/* Veřejné stránky */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Stránky pod layoutem */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/seats" element={<SeatPage />} />
          <Route path="/invitations" element={<InvitationPage />} />
          <Route path="/car" element={<CarPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
