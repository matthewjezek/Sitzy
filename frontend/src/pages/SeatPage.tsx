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
    // Helper to render a seat with custom style
    const seatStyle = (isDriver: boolean, occupied: boolean, selected: boolean) =>
      `w-12 h-16 rounded-xl flex items-center justify-center border-2 shadow-md m-1
      ${isDriver ? 'bg-yellow-200 border-yellow-500' : ''}
      ${occupied ? 'bg-gray-400 border-gray-500 text-gray-700 cursor-not-allowed' :
        selected ? 'bg-blue-500 border-blue-700 text-white' :
        'bg-white border-gray-300 hover:bg-blue-100 hover:border-blue-400'}
      `;

    // Helper to render a seat (rectangle)
    function SeatShape({ seat, selected, onSelect, isDriver }: { seat: Seat, selected: number | null, onSelect: (pos: number) => void, isDriver?: boolean }) {
      return (
        <button
          disabled={seat.occupied}
          onClick={() => onSelect(seat.position)}
          className={seatStyle(!!isDriver, seat.occupied, selected === seat.position)}
          style={{ position: 'relative' }}
          title={isDriver ? 'Řidič' : undefined}
        >
          {isDriver && (
            <span style={{ position: 'absolute', top: 2, left: 2, fontSize: 14, color: '#b59f00' }} title="Řidič">🛞</span>
          )}
          <span style={{ fontWeight: 600 }}>{seat.position}</span>
        </button>
      );
    }

    if (layout === 'SEDAN') {
      // 2 front (driver left), 3 back
      return (
        <div className="flex flex-col items-center">
          <div className="flex flex-row justify-center mb-6 gap-8">
            <SeatShape seat={seats[0]} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
            <SeatShape seat={seats[1]} selected={selected} onSelect={handleChooseSeat} />
          </div>
          <div className="flex flex-row justify-center gap-6">
            <SeatShape seat={seats[2]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[3]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[4]} selected={selected} onSelect={handleChooseSeat} />
          </div>
        </div>
      )
    } else if (layout === 'SUV') {
      // 2 front, 3 middle, 2 back
      return (
        <div className="flex flex-col items-center">
          <div className="flex flex-row justify-center mb-6 gap-8">
            <SeatShape seat={seats[0]} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
            <SeatShape seat={seats[1]} selected={selected} onSelect={handleChooseSeat} />
          </div>
          <div className="flex flex-row justify-center mb-6 gap-6">
            <SeatShape seat={seats[2]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[3]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[4]} selected={selected} onSelect={handleChooseSeat} />
          </div>
          <div className="flex flex-row justify-center gap-10">
            <SeatShape seat={seats[5]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[6]} selected={selected} onSelect={handleChooseSeat} />
          </div>
        </div>
      )
    } else if (layout === 'MINIVAN') {
      // 2 front, 3 middle, 3 back
      return (
        <div className="flex flex-col items-center">
          <div className="flex flex-row justify-center mb-6 gap-8">
            <SeatShape seat={seats[0]} selected={selected} onSelect={handleChooseSeat} isDriver={true} />
            <SeatShape seat={seats[1]} selected={selected} onSelect={handleChooseSeat} />
          </div>
          <div className="flex flex-row justify-center mb-6 gap-6">
            <SeatShape seat={seats[2]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[3]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[4]} selected={selected} onSelect={handleChooseSeat} />
          </div>
          <div className="flex flex-row justify-center gap-6">
            <SeatShape seat={seats[5]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[6]} selected={selected} onSelect={handleChooseSeat} />
            <SeatShape seat={seats[7]} selected={selected} onSelect={handleChooseSeat} />
          </div>
        </div>
      )
    } else {
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
