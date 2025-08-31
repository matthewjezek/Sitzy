import { useState } from 'react'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import instance from '../api/axios'

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
          withCredentials: true,
        }
      )
      navigate('/login')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Chyba registrace");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="form-container">
          <div className="main-card">
            <div className="main-card-header text-center">
              <h1 className="text-2xl font-bold">Registrace</h1>
            </div>
            <div className="main-card-body">
              <form
                onSubmit={handleRegister}
              >
                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div className="form-group">
                  <input
                    type="email"
                    placeholder="E-mail"
                    className="form-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.toLocaleLowerCase());
                      setError('');
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Heslo"
                    className="form-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="primary-button w-4/6"
                    >
                      Registrovat se
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm">
                  Máš už účet?{' '}
                  <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline cursor-pointer">
                    Přihlaš se
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
