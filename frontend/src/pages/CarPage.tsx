import { useEffect, useState } from 'react'
import axiosInstance from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'

export default function CarPage() {
  const navigate = useNavigate()
  const [car, setCar] = useState<any>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const axios = axiosInstance()

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCar(res.data)
        setNotFound(false)
        // if (isAxiosError(err) && err.response?.status === 404) {
        //   setNotFound(true)
        // } else {
        //   setError('Nepodařilo se načíst auto.')
        // }
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-900 text-center max-w-2xl mx-auto mt-8">
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-800">Moje auto</h1>
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-200">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-semibold text-blue-700 mb-2">Název: <span className="text-gray-800">{car.name}</span></h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700">
            <span className="font-medium">Datum jízdy:</span>
            <span className="bg-blue-50 px-2 py-1 rounded text-blue-900 font-mono">
              {car.date && !isNaN(new Date(car.date).getTime())
                ? new Date(car.date).toLocaleString('cs-CZ', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : 'Neznámé datum'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-700 mt-1">
            <span className="font-medium">Rozložení:</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">{car.layout_label}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token')
                await axios.delete(`http://localhost:8000/cars/${car.id}`,
                  { headers: { Authorization: `Bearer ${token}` } })
                navigate('/dashboard')
              } catch (err) {
                setError('Nepodařilo se smazat auto.')
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Smazat auto
          </button>
          <button
            onClick={() => navigate('/invite')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Pozvat řidiče
          </button>
        </div>
      </div>
    </div>
  )
}
