import { useEffect, useState } from 'react'
import RideStatus from '../components/RideStatus'
import instance from '../api/axios'
import { useNavigate } from 'react-router'
import Loader from '../components/Loader';

interface Seat {
  position: number;
  position_label?: string;
  user_name?: string;
}

interface Invitation {
  id: number;
  invited_email: string;
  status_label: string;
}

interface Car {
  id: number;
  name: string;
  date: string;
  layout: string;
  invitations: Invitation[];
  seats: Seat[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [userNotFound, setUserNotFound] = useState(false)
  const [carNotFound, setCarNotFound] = useState(false)
  const navigate = useNavigate()
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // `instance` and `localStorage` are stable and do not change between renders, so it's safe to only include `navigate` in the dependency array.
  useEffect(() => {
    const axios = instance
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true);
    Promise.all([
      axios
        .get('http://localhost:8000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res: { data: { email: string } | null }) => {
          setUser(res.data);
          setUserNotFound(false);
        })
        .catch(() => navigate('/login')),
      axios
        .get('http://localhost:8000/cars/my', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res: { data: Car | null }) => {
          setCar(res.data);
          setCarNotFound(false);
        })
        .catch(() => setCar(null))
    ]).finally(() => {
      setLoading(false)
    })
  }, [navigate])

  if (loading && !userNotFound && !carNotFound) {
    return <Loader />
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {user && <h1 className="text-3xl font-bold mb-4 text-blue-800">Vítej, {user.email}!</h1>}

      {car && !loading ? (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-200">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-semibold text-blue-700 mb-2">Tvé auto: <span className="text-gray-800">{car.name}</span></h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700">
              <span className="font-medium">Datum jízdy:</span>
              <span className="bg-blue-50 px-2 py-1 rounded text-blue-900 font-mono">
                {new Date(car.date).toLocaleString('cs-CZ', { timeZone: localTimezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'  })}
              </span>
              <RideStatus date={car.date} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700 mt-1">
              <span className="font-medium">Rozložení:</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">
                {car ? car.layout : 'Neznámé rozložení'}
              </span>
            </div>
          </div>

          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Pozvánky:</h3>
            <ul className="list-disc list-inside ml-4">
              {car.invitations.length > 0 ? (
                car.invitations.map((invitation: Invitation) => (
                  <li key={invitation.id} className="mb-1">
                    <span className="font-mono text-gray-800">{invitation.invited_email}</span> – <span className="font-semibold text-gray-700">{invitation.status_label}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Žádné pozvánky.</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Obsazená místa:</h3>
            {/* Vizualizace sedaček */}
            {/* <SeatLayoutVisual seats={car.seats} layout={car.layout_label} /> */}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-900 text-center">
          <p className="text-lg font-semibold mb-2">Nemáš žádné vlastní auto.</p>
          <button
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => navigate('/create-car')}
          >
            Vytvořit auto
          </button>
        </div>
      )}
    </div>
  )
}
