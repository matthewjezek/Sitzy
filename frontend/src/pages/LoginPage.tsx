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
    <div className="page-container">
      <div className='page-content'>
        <div className="form-container">
          <div className="main-card">
            <div className="main-card-header text-center">
              <h1 className='text-2xl font-bold'>Přihlášení</h1>
            </div>
            <div className="main-card-body">
              <form
                onSubmit={handleLogin}
              >
                {expired && (
                  <div className="text-red-500 text-sm mb-2 text-center">
                    Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
                  </div>
                )}
                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div className="form-group">
                  <input
                    type="email"
                    placeholder="E-mail"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Heslo"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="primary-button w-4/6"
                    >
                      Přihlásit se
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm">
                  Nemáš ještě účet?{' '}
                  <button onClick={() => navigate('/register')} className="text-indigo-600 hover:underline cursor-pointer">
                    Zaregistruj se
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
