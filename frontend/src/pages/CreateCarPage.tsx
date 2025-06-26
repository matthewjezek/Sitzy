import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CreateCarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('SEDAN')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Nejste přihlášeni. Přihlaste se prosím znovu.')
        return
      }
      await axios.post(
        'http://localhost:8000/cars/create-car',
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

        <input
          type="datetime-local"
          className="w-full p-2 border rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <label className="block text-gray-600 text-xs mb-2 -mt-2">Datum jízdy</label>

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
