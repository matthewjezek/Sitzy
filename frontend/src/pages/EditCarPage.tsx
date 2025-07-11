import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function EditCarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('sedaq')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [carId, setCarId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setName(res.data.name)
        setLayout(res.data.layout)
        setDate(res.data.date.slice(0, 16)) // ISO datetime format trim
        setCarId(res.data.id)
      } catch (err: any) {
        setError('Nepodařilo se načíst data auta. ' + (err?.message || ''))
      }
    }
    fetchCar()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!carId) {
        setError('ID auta nebylo načteno.')
        return
      }
      await axios.patch(
        `http://localhost:8000/cars/${carId}`,
        { name, layout, date },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (err: any) {
      setError('Chyba při úpravě auta. ' + (err?.message || ''))
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Úprava auta</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <input
          type="text"
          placeholder="Název auta"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded"
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
        >
          <option value="sedaq">Sedan (4 místa)</option>
          <option value="trapaq">Kupé (2 místa)</option>
          <option value="praq">Minivan (7 míst)</option>
        </select>

        <input
          type="datetime-local"
          className="w-full p-2 border rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Uložit změny
        </button>
      </form>
    </div>
  )
}
