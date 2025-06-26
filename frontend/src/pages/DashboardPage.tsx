import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [car, setCar] = useState<any>(null)
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

    axios
      .get('http://localhost:8000/cars/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCar(res.data))
      .catch(() => setCar(null))
  }, [navigate])

  return (
    <div className="space-y-4">
      {user && <h1 className="text-2xl font-bold">Vítej, {user.email}!</h1>}

      {car ? (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Tvé auto: {car.name}</h2>
          <p>Datum jízdy: {new Date(car.date).toLocaleString()}</p>
          <p>Rozložení: {car.layout_label}</p>

          <h3 className="text-lg font-semibold mt-4">Pozvánky:</h3>
          <ul className="list-disc list-inside">
            {car.invitations.length > 0 ? (
              car.invitations.map((invitation: any) => (
                <li key={invitation.id}>
                  {invitation.invited_email} – {invitation.status_label}
                </li>
              ))
            ) : (
              <li>Žádné pozvánky.</li>
            )}
          </ul>

          <h3 className="text-lg font-semibold mt-4">Obsazená místa:</h3>
          <ul className="list-disc list-inside">
            {car.seats.length > 0 ? (
              car.seats.map((seat: any) => (
                <li key={`${seat.car_id}-${seat.position}`}>
                  {seat.position_label}
                  {seat.user_name ? ` – ${seat.user_name}` : ' – volné'}
                </li>
              ))
            ) : (
              <li>Žádná místa nejsou obsazena.</li>
            )}
          </ul>
        </div>
      ) : (
        <p className="text-gray-600">Nemáš žádné vlastní auto.</p>
      )}
    </div>
  )
}
