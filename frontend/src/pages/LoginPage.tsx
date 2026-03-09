import { useEffect } from 'react'
import { useLocation, Link } from 'react-router'
import { isAxiosError } from 'axios'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import { SocialButton, XIcon, FacebookIcon } from '../components/tailgrids/core/social-button'

export default function LoginPage() {
  const location = useLocation()
  const expired = new URLSearchParams(location.search).get('expired')
  const loggedOut = new URLSearchParams(location.search).get('logged_out')

  useEffect(() => {
    if (loggedOut) {
      toast.success('Úspěšně odhlášeno.')
    }
    document.title = 'Sitzy - Přihlášení'
  }, [loggedOut])

  const handleOAuthLogin = async (provider: 'x' | 'facebook') => {
    try {
      const { data } = await instance.post(`/auth/oauth/${provider}/init`)
      window.location.href = data.authorization_url
    } catch (error) {
      if (isAxiosError(error) && !error.response) {
        toast.error('Nelze kontaktovat API. Zkontrolujte VITE_API_BASE_URL (HTTPS).')
        return
      }
      toast.error('Nepodařilo se zahájit přihlášení.')
    }
  }

  return (
    <div className="page-container page-container-auth">
      <div className='page-content'>
        <div className="form-container">
          <div className="main-card">
            <div className="main-card-header text-center">
              <h1 className='text-2xl font-bold'>Přihlášení</h1>
            </div>
            <div className="main-card-body">
              <div className="form-group">
                <SocialButton
                  onClick={() => handleOAuthLogin('x')}
                >
                  <XIcon />
                  Přihlásit se přes X
                </SocialButton>
              </div>

              <div className="form-group">
                <SocialButton
                  onClick={() => handleOAuthLogin('facebook')}
                >
                  <FacebookIcon />
                  Přihlásit se přes Facebook
                </SocialButton>
              </div>
              {expired && (
                <div className="text-sm text-center text-danger">
                  Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-4 text-sm">
                <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Ochrana osobních údajů
                </Link>
                <span className="text-gray-400">•</span>
                <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Podmínky použití
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
