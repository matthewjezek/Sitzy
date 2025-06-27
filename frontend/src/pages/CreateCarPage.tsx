import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import { isAxiosError } from 'axios'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('sedaq')
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultDate = `${yyyy}-${mm}-${dd}`
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('00:00')
  const [error, setError] = useState('')

  const minDate = `${yyyy}-${mm}-${dd}`
  const axios = axiosInstance()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Nejste přihlášeni. Přihlaste se prosím znovu.')
        return
      }
      // Sestav datetime ve formátu YYYY-MM-DDTHH:mm:ss+00:00 (UTC)
      let dateWithSeconds = `${date}T${time}:00Z` // Z na konci znamená UTC
      await axios.post(
        'http://localhost:8000/cars/',
        { name, layout, date: dateWithSeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (err: any) {
      if (isAxiosError(err)) {
        setError(JSON.stringify(err.response?.data) || 'Chyba při vytváření auta.')
      } else {
        setError('Chyba při vytváření auta.')
      }
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Vytvoření auta</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <input
          type="text"
          placeholder="Název auta"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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

        <label htmlFor="date" className="block text-gray-700 font-semibold mb-1">Kdy pojedete?</label>
        <div className="flex gap-2 mb-4">
          <input
            id="date"
            type="date"
            className="w-full p-2 border rounded"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            id="time"
            type="time"
            className="w-full p-2 border rounded"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="text-xs text-gray-500 mb-2">Výchozí čas je 00:00, můžete změnit.</div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Vytvořit auto
        </button>
      </form>
    </div>
  )
}
