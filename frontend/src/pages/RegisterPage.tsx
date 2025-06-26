import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

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
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(`Registrace selhala: ${err.response.data.detail}`)
      } else {
        setError('Registrace selhala. Zkus to znovu.')
      }
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Registrace</h2>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <input
            type="email"
            placeholder="Email"
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
            <Link to="/login" className="text-blue-600 hover:underline">
              Přihlaš se
            </Link>
          </p>
        </form>
      </div>
    </Layout>
  )
}
