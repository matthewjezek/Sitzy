import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'

export default function LoginPage() {
  const navigate = useNavigate()
  const axios = instance
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
      console.error(err);
      toast.error('Chyba přihlášení.');
    }
  }

  return (
    <div className="flex justify-center items-center h-full mt-32 p-6">
      <form
        onSubmit={handleLogin}
        className="bg-gray-100 rounded-3xl shadow-xl border border-indigo-100 p-8 space-y-4 max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Přihlášení</h2>

        {expired && (
          <div className="text-red-500 text-sm mb-2 text-center">
            Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
          </div>
        )}
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
            Přihlásit se
          </button>
        </div>

        <p className="text-center text-sm">
          Nemáš ještě účet?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-600 hover:underline cursor-pointer">
            Zaregistruj se
          </button>
        </p>
      </form>
    </div>
  )
}
