import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('SEDAN')
  // Výchozí hodnota: dnešní datum s časem 00:00
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultDate = `${yyyy}-${mm}-${dd}T00:00`
  const [date, setDate] = useState(defaultDate)
  const [error, setError] = useState('')

  const minDate = `${yyyy}-${mm}-${dd}T00:00`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Nejste přihlášeni. Přihlaste se prosím znovu.')
        return
      }
      await axios.post(
        'http://localhost:8000/cars/',
        { name, layout, date },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate('/dashboard')
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError(err.response.data?.detail || 'Chyba při vytváření auta.')
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
          <option value="SEDAN">Sedan (4 místa)</option>
          <option value="COUPE">Kupé (2 místa)</option>
          <option value="MINIVAN">Minivan (7 míst)</option>
        </select>

        <label htmlFor="date" className="block text-gray-700 font-semibold mb-1">Kdy pojedete?</label>
        <input
          id="date"
          type="datetime-local"
          className="w-full p-2 border rounded mb-4"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          step="1"
          required
        />
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
