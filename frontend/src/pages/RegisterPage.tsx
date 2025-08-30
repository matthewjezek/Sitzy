import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import instance from '../api/axios'
import { toast } from 'react-toastify'

export default function RegisterPage() {
  const navigate = useNavigate()
  const axios = instance
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
      if (isAxiosError(err) && err.response?.data?.detail) {
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
    <div className="flex justify-center-safe items-center h-full mt-32 p-6">
      <form
        onSubmit={handleRegister}
        className="bg-gray-100 rounded-3xl shadow-xl border border-indigo-100 p-8 space-y-4 max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Registrace</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <input
          type="email"
          placeholder="E-mail"
          className="w-full p-2 border rounded focus:outline-2 focus:outline-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Heslo"
          className="w-full p-2 border rounded focus:outline-2 focus:outline-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-center">
          <button
            type="submit"
            className="primary-button w-4/6"
          >
            Registrovat se
          </button>
        </div>

        <p className="text-center text-sm">
          Máš už účet?{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline cursor-pointer">
            Přihlaš se
          </button>
        </p>
      </form>
    </div>
  )
}
