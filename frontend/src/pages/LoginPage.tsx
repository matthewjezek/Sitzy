import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import axios from 'axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const expired = new URLSearchParams(location.search).get('expired')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:8000/auth/login', {
        email,
        password,
      })
      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token)
        navigate('/dashboard')
      } else {
        setError('Chyba při přihlašování. Zkuste to prosím znovu.')
      }
    } catch (err) {
      setError('Neplatné přihlašovací údaje')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Přihlášení</h2>

        {expired && (
          <div className="text-red-500 text-sm mb-2 text-center">
            Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
          </div>
        )}
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
          Přihlásit se
        </button>
        <div className="text-center mt-2">
          <Link to="/register" className="text-blue-600 hover:underline">
            Nemáte účet? Zaregistrujte se
          </Link>
        </div>
      </form>
    </div>
  )
}
