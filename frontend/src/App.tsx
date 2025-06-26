// Unified routing and naming for Sitzy frontend

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CarPage from './pages/CarPage'
import InvitationPage from './pages/InvitationPage'
import SeatPage from './pages/SeatPage'
import CreateCarPage from './pages/CreateCarPage'
import EditCarPage from './pages/EditCarPage'
import InvitePage from './pages/InvitePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/car" element={<CarPage />} />
        <Route path="/car/create" element={<CreateCarPage />} />
        <Route path="/car/edit" element={<EditCarPage />} />
        <Route path="/invitations" element={<InvitationPage />} />
        <Route path="/seats" element={<SeatPage />} />
        <Route path="/invite" element={<InvitePage />} />

      </Routes>
    </BrowserRouter>
  )
}
