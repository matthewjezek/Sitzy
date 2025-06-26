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
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCar(res.data)
        setNotFound(false)
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError('Nepodařilo se načíst auto.')
        }
      }
    }
    fetchCar()
  }, [])

  if (notFound)
    return (
      <div className="text-center mt-4 text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Nemáte žádné auto</h2>
        <p className="mb-4">Zatím nemáte žádné auto přiřazené k účtu.</p>
        <button
          onClick={() => navigate('/create-car')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Vytvořit auto
        </button>
      </div>
    )
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
            ? new Date(car.date).toLocaleString('cs-CZ', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
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
