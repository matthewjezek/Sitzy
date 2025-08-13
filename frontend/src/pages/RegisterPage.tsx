import { useState } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(
        'http://localhost:8000/auth/register',
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // pokud backend používá cookies/sessions
        }
      )
      navigate('/login')
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(`Registrace selhala: ${err.response.data.detail}`);
        console.error('Registration error:', err);
        toast.error('Chyba registrace.');
      } else {
        setError('Registrace selhala. Zkus to znovu.');
        console.error('Registration error:', err);
        toast.error('Chyba registrace.');
      }
    }
  }

  return (
    <div className="flex justify-center-safe items-center h-fit mt-32">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Registrace</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <input
          type="email"
          placeholder="E-mail"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Heslo"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Registrovat se
        </button>
        <p className="text-center text-sm">
          Máš už účet?{' '}
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline cursor-pointer">
            Přihlaš se
          </button>
        </p>
      </form>
    </div>
  )
}
