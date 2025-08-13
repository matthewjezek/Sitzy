import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from 'react-router'

export default function InvitePage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [hasCar, setHasCar] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkCar = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:8000/cars/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setHasCar(!!res.data)
      } catch {
        setHasCar(false)
      }
    }
    checkCar()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'http://localhost:8000/invitations',
        { invited_email: email },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Pozvánka úspěšně odeslána.')
      setEmail('')
    } catch (err: any) {
      setError('Nepodařilo se odeslat pozvánku.')
      toast.error('Chyba při odesílání pozvánky.')
    }
  }

  if (hasCar === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Nemáte žádné auto</h2>
          <p className="mb-4">Pro odeslání pozvánky musíte nejprve vytvořit auto.</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => navigate('/create-car')}
          >
            Vytvořit auto
          </button>
        </div>
      </div>
    )
  }

  if (hasCar === null) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Načítání...</div>
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <ToastContainer />
      <form
        onSubmit={handleInvite}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Pozvat pasažéra</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="E-mail příjemce"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Odeslat pozvánku
        </button>
      </form>
    </div>
  )
}
