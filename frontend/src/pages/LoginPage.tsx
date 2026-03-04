import React from 'react'
import { useLocation } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import { SocialButton, XIcon, FacebookIcon } from '../components/tailgrids/core/social-button'

export default function LoginPage() {
  const location = useLocation()
  const expired = new URLSearchParams(location.search).get('expired')
  const loggedOut = new URLSearchParams(location.search).get('logged_out')

  React.useEffect(() => {
    if (loggedOut) {
      toast.success('Úspěšně odhlášeno.')
    }
  }, [loggedOut])

  const handleOAuthLogin = async (provider: 'x' | 'facebook') => {
    try {
      const { data } = await instance.post(`/auth/oauth/${provider}/init`)
      window.location.href = data.authorization_url
    } catch {
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
              {expired && (
                <div className="text-sm mb-2 text-center status-danger">
                  Vaše přihlášení vypršelo. Přihlaste se prosím znovu.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
