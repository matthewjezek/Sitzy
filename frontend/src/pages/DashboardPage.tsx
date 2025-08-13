import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'

interface Seat {
  position: number;
  position_label?: string;
  user_name?: string;
}
function SeatLayoutVisual({ seats, layout }: { seats: Seat[]; layout: string }) {
  // Normalize layout to backend enum
  const normalizeLayout = (layout: string) => {
    if (!layout) return '';
    const l = layout.toLowerCase();
    if (l.startsWith('sedan') || l === 'sedaq') return 'sedaq';
    if (l.startsWith('kup') || l === 'trapaq') return 'trapaq';
    if (l.startsWith('mini') || l === 'praq') return 'praq';
    return l;
  };
  const normLayout = normalizeLayout(layout);

  // Najdi seat pro každou pozici
  const seatByPosition: Record<number, Seat | undefined> = {};
  (seats || []).forEach(seat => {
    seatByPosition[seat.position] = seat;
  });

  // Helper for seat style
  const seatStyle = (isDriver: boolean, occupied: boolean) =>
    `w-14 h-16 rounded-xl flex flex-col items-center justify-center border-2 shadow-md m-1 text-xs
    ${isDriver ? 'bg-yellow-200 border-yellow-500' : ''}
    ${occupied ? 'bg-blue-400 border-blue-700 text-white' : 'bg-white border-gray-300 text-gray-700'}
    `;

  function SeatShape({ seat, position, isDriver }: { seat: Seat | undefined; position: number; isDriver?: boolean }) {
    return (
      <div
        className={seatStyle(!!isDriver, !!seat?.user_name)}
        style={{ position: 'relative' }}
        title={isDriver ? 'Řidič' : undefined}
      >
        {isDriver && (
          <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 14, color: '#b59f00' }} title="Řidič">🛞</span>
        )}
        <span className="font-bold mb-1">{seat?.position_label || `#${position}`}</span>
        <span className="truncate w-full text-center">
          {seat?.user_name ? seat.user_name : <span className="text-gray-400">volné</span>}
        </span>
      </div>
    );
  }

  // Vykresli podle layoutu
  if (normLayout === 'sedaq') {
    return (
      <>
        <div className="flex flex-col items-center">
          <div className="flex flex-row justify-center mb-4 gap-8">
            <SeatShape seat={seatByPosition[1]} position={1} isDriver={true} />
            <SeatShape seat={seatByPosition[2]} position={2} />
          </div>
          <div className="flex flex-row justify-center gap-6">
            <SeatShape seat={seatByPosition[3]} position={3} />
            <SeatShape seat={seatByPosition[4]} position={4} />
            <SeatShape seat={seatByPosition[5]} position={5} />
          </div>
        </div>
        <CarSilhouette />
      </>
    );
  } else if (normLayout === 'trapaq') {
    return (
      <>
        <div className="flex flex-row justify-center gap-8">
          <SeatShape seat={seatByPosition[1]} position={1} isDriver={true} />
          <SeatShape seat={seatByPosition[2]} position={2} />
        </div>
        <CarSilhouette />
      </>
    );
  } else if (normLayout === 'praq') {
    return (
      <>
        <div className="flex flex-col items-center">
          <div className="flex flex-row justify-center mb-4 gap-8">
            <SeatShape seat={seatByPosition[1]} position={1} isDriver={true} />
            <SeatShape seat={seatByPosition[2]} position={2} />
          </div>
          <div className="flex flex-row justify-center mb-4 gap-6">
            <SeatShape seat={seatByPosition[3]} position={3} />
            <SeatShape seat={seatByPosition[4]} position={4} />
            <SeatShape seat={seatByPosition[5]} position={5} />
          </div>
          <div className="flex flex-row justify-center gap-10">
            <SeatShape seat={seatByPosition[6]} position={6} />
            <SeatShape seat={seatByPosition[7]} position={7} />
          </div>
        </div>
        <CarSilhouette />
      </>
    );
  } else {
    return <div>Neznámý typ rozložení auta.</div>;
  }

  // SVG silueta vozu pod sedačky
  function CarSilhouette() {
    return (
      <div className="flex justify-center mt-10 mb-2">
        <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Karoserie auta */}
          <rect x="30" y="15" width="180" height="50" rx="28" fill="#b0b0b0" stroke="#888" strokeWidth="2" />
          {/* Kabina */}
          <rect x="85" y="25" width="70" height="30" rx="12" fill="#eaeaea" stroke="#aaa" strokeWidth="1.5" />
          {/* Kola */}
          <ellipse cx="45" cy="20" rx="12" ry="7" fill="#444" />
          <ellipse cx="45" cy="60" rx="12" ry="7" fill="#444" />
          <ellipse cx="195" cy="20" rx="12" ry="7" fill="#444" />
          <ellipse cx="195" cy="60" rx="12" ry="7" fill="#444" />
          {/* Přední světla */}
          <ellipse cx="32" cy="25" rx="4" ry="2" fill="#ffe066" />
          <ellipse cx="32" cy="55" rx="4" ry="2" fill="#ffe066" />
          {/* Zadní světla */}
          <ellipse cx="208" cy="25" rx="4" ry="2" fill="#ff7675" />
          <ellipse cx="208" cy="55" rx="4" ry="2" fill="#ff7675" />
        </svg>
      </div>
    );
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  interface Invitation {
    id: number;
    invited_email: string;
    status_label: string;
  }
  interface Car {
    id: number;
    name: string;
    date: string;
    layout_label: string;
    invitations: Invitation[];
    seats: Seat[];
  }
  const [car, setCar] = useState<Car | null>(null)
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
