import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function CarPage() {
  const navigate = useNavigate()
  const [car, setCar] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCar(res.data)
      } catch (err) {
        setError('Nepodařilo se načíst auto.')
      }
    }
    fetchCar()
  }, [])

  if (error) return <div className="text-red-500 text-center mt-4">{error}</div>
  if (!car) return <div className="text-center mt-4">Načítání...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Moje auto</h1>
      <div className="bg-white shadow rounded p-4 mb-4">
        <p><strong>Název:</strong> {car.name}</p>
        <p><strong>Rozložení:</strong> {car.layout_label}</p>
        <p><strong>Datum jízdy:</strong> {new Date(car.date).toLocaleString()}</p>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/car/edit')}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Upravit auto
        </button>
        <button
          onClick={async () => {
            const token = localStorage.getItem('token')
            await axios.delete(`http://localhost:8000/cars/${car.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            navigate('/dashboard')
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Smazat auto
        </button>
      </div>
    </div>
  )
}
