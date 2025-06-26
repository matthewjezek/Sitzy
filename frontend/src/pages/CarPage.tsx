import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function CarPage() {
  const navigate = useNavigate()
  interface Car {
    id: number
    name: string
    layout_label: string
    date: string
    // Add other fields as needed
  }

  const [car, setCar] = useState<Car | null>(null)
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

  if (error)
    return (
      <div className="text-red-500 text-center mt-4">{error}</div>
    )
  if (!car)
    return (
      <div className="text-center mt-4">Načítání...</div>
    )

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Moje auto</h1>
      <div className="bg-white shadow rounded p-4 mb-4">
        <p><strong>Název:</strong> {car?.name}</p>
        <p><strong>Rozložení:</strong> {car?.layout_label}</p>
        <p>
          <strong>Datum jízdy:</strong>{' '}
          {car.date && !isNaN(new Date(car.date).getTime())
            ? new Date(car.date).toLocaleString()
            : 'Neznámé datum'}
        </p>
        <button
          onClick={async () => {
            try {
              const token = localStorage.getItem('token')
              await axios.delete(`http://localhost:8000/cars/${car.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              navigate('/dashboard')
            } catch (err) {
              setError('Nepodařilo se smazat auto.')
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Smazat auto
        </button>
      </div>
    </>
  )
}
