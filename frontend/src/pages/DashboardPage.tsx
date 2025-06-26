import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [car, setCar] = useState<any | null>(null)
  const [received, setReceived] = useState<any[]>([])
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

    fetchCar()
    fetchReceived()
  }, [navigate])

  const fetchCar = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://localhost:8000/cars/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCar(res.data)
    } catch {
      setCar(null)
    }
  }

  const fetchReceived = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://localhost:8000/invitations/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReceived(res.data)
    } catch {
      setReceived([])
    }
  }

  const handleCancel = async (token: string) => {
    try {
      const auth = localStorage.getItem('token')
      await axios.delete(`http://localhost:8000/invitations/${token}`, {
        headers: { Authorization: `Bearer ${auth}` },
      })
      toast.success('Pozvánka byla zrušena.')
      fetchCar()
    } catch {
      toast.error('Zrušení pozvánky selhalo.')
    }
  }

  return (
    <div className="p-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {user ? (
        <p className="mt-4">Vítej, {user.email}!</p>
      ) : (
        <p className="mt-4">Načítám data...</p>
      )}

      {/* === Moje auto === */}
      {car ? (
        <>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Tvůj vůz</h2>
            <p>Název: {car.name}</p>
            <p>Layout: {car.layout_label}</p>
            <p>Datum jízdy: {new Date(car.date).toLocaleString()}</p>
          </div>

          {/* === Pozvánky === */}
          {car.invitations.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Odeslané pozvánky</h2>
              <ul className="space-y-2">
                {car.invitations.map((inv: any) => (
                  <li
                    key={inv.token}
                    className="flex justify-between items-center bg-gray-100 p-2 rounded"
                  >
                    <span>
                      {inv.invited_email} — {inv.status_label}
                    </span>
                    <button
                      onClick={() => handleCancel(inv.token)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Zrušit
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* === Místa === */}
          {car.seats.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Obsazená místa</h2>
              <ul className="list-disc list-inside space-y-1">
                {car.seats.map((seat: any) => (
                  <li key={`${seat.car_id}-${seat.position}`}>
                    Pozice {seat.position_label}{' '}
                    {seat.user_id
                      ? `— obsazeno${seat.user_name ? ` (${seat.user_name})` : ''}`
                      : '— volné'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="mt-6 text-gray-600">Nemáš žádné vlastní auto.</p>
      )}

      {/* === Přijaté pozvánky === */}
      {received.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Přijaté pozvánky</h2>
          <ul className="space-y-2">
            {received.map((inv: any) => (
              <li
                key={inv.token}
                className="bg-gray-100 p-2 rounded"
              >
                {inv.invited_email} — {inv.status_label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
