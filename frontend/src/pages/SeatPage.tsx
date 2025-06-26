import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Seat {
  id: number
  position: number
  occupied: boolean
  user?: string
}

// Přidáme hook pro zjištění layoutu auta
function useCarLayout() {
  const [layout, setLayout] = useState<string | null>(null)
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLayout(res.data.layout_label)
      } catch {
        setLayout(null)
      }
    }
    fetchCar()
  }, [])
  return layout
}

export default function SeatPage() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const layout = useCarLayout()

  useEffect(() => {
    fetchSeats()
  }, [])

  const fetchSeats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/seats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSeats(res.data)
      setNotFound(false)
      setError('')
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          setNotFound(true)
          setError('')
        } else {
          setError('Nepodařilo se načíst seznam míst. (' + (err.response?.status || 'chyba') + ')')
          setNotFound(false)
        }
      } else {
        setError('Nepodařilo se načíst seznam míst. (neznámá chyba)')
        setNotFound(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChooseSeat = async (position: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8000/seats/choose',
        { position },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Místo bylo úspěšně vybráno.')
      setSelected(position)
      fetchSeats()
    } catch (err) {
      toast.error('Výběr místa selhal.')
    }
  }

  // UX fallbacky
  if (notFound || error)
    return (
      <div className="text-center mt-8 text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Nejste přihlášen(a) k žádné jízdě</h2>
        <p className="mb-4">Aktuálně nemáte žádné místo v autě jako spolujezdec. Pokud chcete jet s někým, přijměte pozvánku nebo počkejte na přidělení místa.</p>
      </div>
    )
  if (loading || !layout)
    return <div className="text-center mt-4">Načítání...</div>

  // Interaktivní vizualizace sedaček podle layoutu
  function renderSeats() {
    const normLayout = (layout || '').toLowerCase();
    const seatByPosition: Record<number, Seat> = {};
    seats.forEach(seat => {
      seatByPosition[seat.position] = seat;
    });

    // Zjisti jméno vlastníka auta (řidiče) - předpokládáme, že je v localStorage nebo v datech auta
    // Pro demo použijeme localStorage.getItem('user_email') nebo podobně, případně prop/drill z dashboardu
    const ownerName = localStorage.getItem('user_email') || 'Řidič';

    const seatStyle = (isDriver: boolean, occupied: boolean, selected: boolean) =>
      `w-12 h-16 rounded-xl flex flex-col items-center justify-center border-2 shadow-md m-1 text-xs
      ${isDriver ? 'bg-yellow-200 border-yellow-500' : ''}
      ${occupied ? 'bg-blue-500 border-blue-700 text-white' : selected ? 'bg-green-400 border-green-700 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-400'}
      `;

    function SeatShape({ seat, position, selected, onSelect, isDriver }: { seat: Seat | undefined, position: number, selected: number | null, onSelect: (pos: number) => void, isDriver?: boolean }) {
      // Pokud je to řidič, vždy zobraz jméno vlastníka auta
      const userLabel = isDriver ? ownerName : seat?.user;
      const isOccupied = isDriver || !!seat?.occupied;
      return (
        <button
          disabled={isOccupied}
          onClick={() => onSelect(position)}
          className={seatStyle(!!isDriver, isOccupied, selected === position)}
          style={{ position: 'relative' }}
          title={isDriver ? 'Řidič' : undefined}
        >
          {isDriver && (
            <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 14, color: '#b59f00' }} title="Řidič">🛞</span>
          )}
          <span style={{ fontWeight: 600 }}>{seat?.position ?? position}</span>
          <span className="truncate w-full text-center">
            {userLabel ? userLabel : <span className="text-gray-400">volné</span>}
          </span>
        </button>
      );
    }

    if (normLayout === 'sedaq') {
      return (
        <>
          <div className="flex flex-col items-center">
            <div className="flex flex-row justify-center mb-6 gap-8">
              <SeatShape seat={seatByPosition[1]} position={1} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
              <SeatShape seat={seatByPosition[2]} position={2} selected={selected} onSelect={handleChooseSeat} />
            </div>
            <div className="flex flex-row justify-center gap-6">
              <SeatShape seat={seatByPosition[3]} position={3} selected={selected} onSelect={handleChooseSeat} />
              <SeatShape seat={seatByPosition[4]} position={4} selected={selected} onSelect={handleChooseSeat} />
              <SeatShape seat={seatByPosition[5]} position={5} selected={selected} onSelect={handleChooseSeat} />
            </div>
          </div>
        </>
      )
    } else if (normLayout === 'trapaq') {
      return (
        <>
          <div className="flex flex-row justify-center gap-8">
            <SeatShape seat={seatByPosition[1]} position={1} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
            <SeatShape seat={seatByPosition[2]} position={2} selected={selected} onSelect={handleChooseSeat} />
          </div>
        </>
      )
    } else if (normLayout === 'praq') {
      return (
        <>
          <div className="flex flex-col items-center">
            <div className="flex flex-row justify-center mb-6 gap-8">
              <SeatShape seat={seatByPosition[1]} position={1} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
              <SeatShape seat={seatByPosition[2]} position={2} selected={selected} onSelect={handleChooseSeat} />
            </div>
            <div className="flex flex-row justify-center mb-6 gap-6">
              <SeatShape seat={seatByPosition[3]} position={3} selected={selected} onSelect={handleChooseSeat} />
              <SeatShape seat={seatByPosition[4]} position={4} selected={selected} onSelect={handleChooseSeat} />
              <SeatShape seat={seatByPosition[5]} position={5} selected={selected} onSelect={handleChooseSeat} />
            </div>
            <div className="flex flex-row justify-center gap-10">
              <SeatShape seat={seatByPosition[6]} position={6} selected={selected} onSelect={handleChooseSeat} />
              <SeatShape seat={seatByPosition[7]} position={7} selected={selected} onSelect={handleChooseSeat} />
            </div>
          </div>
        </>
      )
    } else {
      return <div>Neznámý typ rozložení auta.</div>
    }
  }

  // SVG silueta vozu pod sedačky
  function CarSilhouette() {
    // Pro jednoduchost použijeme stejný tvar pro všechny, lze rozšířit podle layoutu
    return (
      <div className="flex justify-center mt-10 mb-2">
        <svg width="220" height="60" viewBox="0 0 220 60" className="" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="30" width="180" height="20" rx="10" fill="#bbb" />
          <ellipse cx="50" cy="55" rx="18" ry="7" fill="#888" />
          <ellipse cx="170" cy="55" rx="18" ry="7" fill="#888" />
          <rect x="80" y="10" width="60" height="20" rx="10" fill="#ccc" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Jízdy</h1>
      <div className="flex flex-col items-center">
        <div className="bg-gray-200 rounded-lg p-6 flex flex-col items-center">
          {renderSeats()}
        </div>
        <CarSilhouette />
      </div>
    </div>
  )
}
