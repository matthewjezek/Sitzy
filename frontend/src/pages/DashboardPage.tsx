import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function SeatLayoutVisual({ seats, layout }: { seats: any[]; layout: string }) {
  // Helper for seat style
  const seatStyle = (isDriver: boolean, occupied: boolean) =>
    `w-14 h-16 rounded-xl flex flex-col items-center justify-center border-2 shadow-md m-1 text-xs
    ${isDriver ? 'bg-yellow-200 border-yellow-500' : ''}
    ${occupied ? 'bg-blue-400 border-blue-700 text-white' : 'bg-white border-gray-300 text-gray-700'}
    `;

  function SeatShape({ seat, isDriver }: { seat: any; isDriver?: boolean }) {
    return (
      <div
        className={seatStyle(!!isDriver, !!seat.user_name)}
        style={{ position: 'relative' }}
        title={isDriver ? 'Řidič' : undefined}
      >
        {isDriver && (
          <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 14, color: '#b59f00' }} title="Řidič">🛞</span>
        )}
        <span className="font-bold mb-1">{seat.position_label}</span>
        <span className="truncate w-full text-center">
          {seat.user_name ? seat.user_name : <span className="text-gray-400">volné</span>}
        </span>
      </div>
    );
  }

  if (layout === 'SEDAQ') {
    // Sedan: 2 front, 3 back
    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-row justify-center mb-4 gap-8">
          <SeatShape seat={seats[0]} isDriver={true} />
          <SeatShape seat={seats[1]} />
        </div>
        <div className="flex flex-row justify-center gap-6">
          <SeatShape seat={seats[2]} />
          <SeatShape seat={seats[3]} />
          <SeatShape seat={seats[4]} />
        </div>
      </div>
    );
  } else if (layout === 'TRAPAQ') {
    // Kupé: 2 seats (front only)
    return (
      <div className="flex flex-row justify-center gap-8">
        <SeatShape seat={seats[0]} isDriver={true} />
        <SeatShape seat={seats[1]} />
      </div>
    );
  } else if (layout === 'PRAQ') {
    // Minivan: 2 front, 3 middle, 2 back
    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-row justify-center mb-4 gap-8">
          <SeatShape seat={seats[0]} isDriver={true} />
          <SeatShape seat={seats[1]} />
        </div>
        <div className="flex flex-row justify-center mb-4 gap-6">
          <SeatShape seat={seats[2]} />
          <SeatShape seat={seats[3]} />
          <SeatShape seat={seats[4]} />
        </div>
        <div className="flex flex-row justify-center gap-10">
          <SeatShape seat={seats[5]} />
          <SeatShape seat={seats[6]} />
        </div>
      </div>
    );
  } else {
    return <div>Neznámý typ rozložení auta.</div>;
  }
}

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {user && <h1 className="text-3xl font-bold mb-4 text-blue-800">Vítej, {user.email}!</h1>}

      {car ? (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-200">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-semibold text-blue-700 mb-2">Tvé auto: <span className="text-gray-800">{car.name}</span></h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700">
              <span className="font-medium">Datum jízdy:</span>
              <span className="bg-blue-50 px-2 py-1 rounded text-blue-900 font-mono">
                {new Date(car.date).toLocaleString('cs-CZ', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700 mt-1">
              <span className="font-medium">Rozložení:</span>
              <span className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">{car.layout_label}</span>
            </div>
          </div>

          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Pozvánky:</h3>
            <ul className="list-disc list-inside ml-4">
              {car.invitations.length > 0 ? (
                car.invitations.map((invitation: any) => (
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
            <SeatLayoutVisual seats={car.seats} layout={car.layout_label} />
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
