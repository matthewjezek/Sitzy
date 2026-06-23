import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router'
import { isAxiosError } from 'axios'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import { SocialButton, XIcon, FacebookIcon } from '../components/tailgrids/core/social-button'

export default function LoginPage() {
  const location = useLocation()
  const expired = new URLSearchParams(location.search).get('expired')
  const loggedOut = new URLSearchParams(location.search).get('logged_out')
  const [isInvitationLogin, setIsInvitationLogin] = useState(false)

  useEffect(() => {
    setIsInvitationLogin(Boolean(localStorage.getItem('post_login_redirect')))
  }, [])

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
              {isInvitationLogin && (
                <div className="mb-6 p-4 rounded-xl border border-accent/20 bg-accent/5 flex flex-col gap-1.5 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-accent/5 blur-xl pointer-events-none" aria-hidden="true" />
                  
                  <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Přihlášení k pozvánce</span>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Chcete-li přijmout pozvánku a vybrat sedadlo, nejprve se přihlaste:
                  </p>
                </div>
              )}

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
                <div className="text-sm text-center text-danger mt-2">
                  Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-center gap-4 text-sm">
                <Link to="/privacy" className="text-accent hover:underline">
                  Ochrana osobních údajů
                </Link>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <Link to="/terms" className="text-accent hover:underline">
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

