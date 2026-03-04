import { useLocation } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'

export default function LoginPage() {
  const location = useLocation()
  const expired = new URLSearchParams(location.search).get('expired')

  const handleOAuthLogin = async (provider: 'x' | 'facebook') => {
    try {
      const { data } = await instance.post(`/auth/oauth/${provider}/init`)
      window.location.href = data.authorization_url
    } catch {
      toast.error('Nepodařilo se zahájit přihlášení.')
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
              {expired && (
                <div className="text-red-500 text-sm mb-2 text-center">
                  Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
                </div>
              )}

              <div className="form-group">
                <button
                  onClick={() => handleOAuthLogin('x')}
                  className="button-primary w-full"
                >
                  Přihlásit se přes X
                </button>
              </div>

              <div className="form-group">
                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  className="button-primary w-full"
                >
                  Přihlásit se přes Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
