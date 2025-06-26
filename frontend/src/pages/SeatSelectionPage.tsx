import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface Seat {
  id: string
  car_id: string
  user_id: string | null
  position: number
  position_label: string
}

export default function SeatPage() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/seats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSeats(res.data)
      } catch (err) {
        setError('Nepodařilo se načíst sedadla.')
      }
    }
    fetchSeats()
  }, [])

  const handleChoose = async () => {
    if (selected === null) return
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(
        'http://localhost:8000/seats/choose',
        { position: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (err) {
      setError('Nepodařilo se vybrat sedadlo.')
    }
  }

  if (error) return <div className="text-red-500 text-center mt-4">{error}</div>
  if (!seats.length) return <div className="text-center mt-4">Načítání...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Výběr místa</h1>
      <div className="grid grid-cols-1 gap-4 mb-4">
        {seats.map((seat) => (
          <button
            key={seat.position}
            disabled={seat.user_id !== null}
            onClick={() => setSelected(seat.position)}
            className={`p-3 rounded border text-left transition duration-200 ${
              seat.user_id !== null
                ? 'bg-gray-300 cursor-not-allowed'
                : selected === seat.position
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-blue-100'
            }`}
          >
            {seat.position_label}
          </button>
        ))}
      </div>
      <button
        onClick={handleChoose}
        disabled={selected === null}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Potvrdit výběr
      </button>
    </div>
  )
}