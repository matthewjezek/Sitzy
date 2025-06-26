import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Layout from '../components/Layout'

export default function SeatPage() {
  const [seats, setSeats] = useState<any[]>([])
  const [position, setPosition] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSeats()
  }, [])

  const fetchSeats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/seats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSeats(res.data)
    } catch (err) {
      setError('Nepodařilo se načíst seznam míst.')
    }
  }

  const handleChooseSeat = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8000/seats/choose',
        { position },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Místo bylo úspěšně vybráno.')
      fetchSeats()
    } catch (err) {
      toast.error('Výběr místa selhal.')
    }
  }

  const handleLeaveSeat = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete('http://localhost:8000/seats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Místo bylo uvolněno.')
      fetchSeats()
    } catch (err) {
      toast.error('Uvolnění místa selhalo.')
    }
  }

  const handleChangeSeat = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        'http://localhost:8000/seats/change',
        { position },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Místo bylo změněno.')
      fetchSeats()
    } catch (err) {
      toast.error('Změna místa selhala.')
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <ToastContainer />
        <h1 className="text-2xl font-bold mb-4">Výběr místa</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="position" className="block mb-2">Číslo místa:</label>
          <input
            id="position"
            type="number"
            value={position ?? ''}
            onChange={(e) => setPosition(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleChooseSeat}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Vybrat místo
          </button>
          <button
            onClick={handleLeaveSeat}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Uvolnit místo
          </button>
          <button
            onClick={handleChangeSeat}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Změnit místo
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2">Obsazená místa</h2>
        <ul className="list-disc list-inside">
          {seats.map((seat) => (
            <li key={`${seat.car_id}-${seat.position}`}>
              Pozice {seat.position_label}
              {seat.user_id
                ? ` - obsazeno${seat.user_name ? ` (${seat.user_name})` : ''}`
                : ' - volné'}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
