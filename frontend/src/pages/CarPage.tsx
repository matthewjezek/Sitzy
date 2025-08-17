import { useEffect, useState } from 'react'
import RideStatus from '../components/RideStatus'
import instance from '../api/axios'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import { FiEdit, FiTrash } from 'react-icons/fi'
import { toast } from 'react-toastify'

export default function CarPage() {
  const navigate = useNavigate()
  interface Car {
    id: number;
    name: string;
    date?: string;
    layout_label?: string;
    // Add other fields as needed
  }
  const [car, setCar] = useState<Car | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const axios = instance
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCar(res.data)
        setNotFound(false)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
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
      <div className='flex justify-center-safe items-center h-screen'>
        <div className="w-80 bg-white rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300 ease-in-out">
          <img className="w-full h-60 object-cover rounded-t-lg" alt="Card Image" src="src/assets/karec.svg" />
          <div className="p-4">
            <h2 className="text-xl font-semibold">Kam pojedeme?</h2>
            <p className="text-gray-600">Přijměte pozvánku nebo naplánujte vlastní jízdu.</p>
            <div className="flex justify-between items-center mt-4">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => navigate('/create-car')}>
                Naplánovat jízdu</button>
            </div>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 text-center mt-4">{error}</div>
    )
  if (!car)
    return (
      <div className="text-center mt-4">Načítání...</div>
    )

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-800">{car.name}</h1>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-200">
        <div className="border-b pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700">
            <span className="font-medium">Datum jízdy:</span>
            <span className="bg-blue-50 px-2 py-1 rounded text-blue-900 font-mono">
              {car.date && !isNaN(new Date(car.date).getTime())
                ? new Date(car.date).toLocaleString('cs-CZ', { timeZone: localTimezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'  })
                : 'Neznámé datum'}
            </span>
            <RideStatus date={car.date} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700 mt-1">
            <span className="font-medium">Rozložení:</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">{car.layout_label}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/invite')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Pozvat řidiče
          </button>
          <button>
            <FiEdit size={20} />
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token')
                await axios.delete(`http://localhost:8000/cars/${car.id}`,
                  { headers: { Authorization: `Bearer ${token}` } })
                navigate('/dashboard')
              } catch (err) {
                console.error('Chyba při mazání auta:', err)
                toast.error('Nepodařilo se smazat auto.')
                setError('Nepodařilo se smazat auto.')
              }
            }}
            className="flex items-center gap-2 outline-1 outline-gray-400 text-gray-700 px-4 py-2 rounded hover:text-red-400 transition-colors"
          >
            <FiTrash size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
