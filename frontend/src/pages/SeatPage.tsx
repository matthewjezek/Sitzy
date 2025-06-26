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
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError('Nepodařilo se načíst seznam míst.')
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
  if (notFound)
    return (
      <div className="text-center mt-4 text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Žádná místa nejsou k dispozici</h2>
        <p className="mb-4">Zatím nejsou k dispozici žádná místa k výběru.</p>
      </div>
    )
  if (error)
    return <div className="text-red-500 text-center mt-4">{error}</div>
  if (loading || !layout)
    return <div className="text-center mt-4">Načítání...</div>

  // Interaktivní vizualizace sedaček podle layoutu
  function renderSeats() {
    if (layout === 'SEDAN') {
      // 2 vpředu, 3 vzadu
      return (
        <>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {seats.slice(0, 2).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Předek" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {seats.slice(2, 5).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Zadek" />
            ))}
          </div>
        </>
      )
    } else if (layout === 'SUV') {
      // 2 vpředu, 3 uprostřed, 2 vzadu
      return (
        <>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {seats.slice(0, 2).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Předek" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 mb-4">
            {seats.slice(2, 5).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Střed" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {seats.slice(5, 7).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Zadek" />
            ))}
          </div>
        </>
      )
    } else if (layout === 'MINIVAN') {
      // 2 vpředu, 3 uprostřed, 3 vzadu
      return (
        <>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {seats.slice(0, 2).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Předek" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 mb-4">
            {seats.slice(2, 5).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Střed" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {seats.slice(5, 8).map((seat) => (
              <SeatButton key={seat.id} seat={seat} selected={selected} onSelect={handleChooseSeat} label="Zadek" />
            ))}
          </div>
        </>
      )
    } else {
      // fallback
      return <div>Neznámý typ rozložení auta.</div>
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Výběr místa</h1>
      <div className="flex flex-col items-center">
        <div className="bg-gray-200 rounded-lg p-6 flex flex-col items-center">
          {renderSeats()}
        </div>
      </div>
    </div>
  )
}

function SeatButton({ seat, selected, onSelect, label }: {
  seat: Seat
  selected: number | null
  onSelect: (pos: number) => void
  label: string
}) {
  return (
    <button
      disabled={seat.occupied}
      onClick={() => onSelect(seat.position)}
      className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center border-2 text-sm font-semibold
        ${seat.occupied ? 'bg-gray-400 border-gray-500 text-gray-700 cursor-not-allowed' :
          selected === seat.position ? 'bg-blue-500 border-blue-700 text-white' :
          'bg-white border-gray-300 hover:bg-blue-100 hover:border-blue-400'}
      `}
    >
      <span>{label}</span>
      <span>{seat.position}</span>
    </button>
  )
}
