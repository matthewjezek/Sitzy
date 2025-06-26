import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    axios
      .get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => navigate('/login'))
  }, [navigate])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <p className="mt-4">Vítej, {user.email}!</p>
      ) : (
        <p className="mt-4">Načítám data...</p>
      )}
    </div>
  )
}
