import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import SplashScreen from '../components/SplashScreen'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestSentRef = useRef(false)

  useEffect(() => {
    // Prevent double request in Strict Mode (state token is one-time use)
    if (requestSentRef.current) return
    requestSentRef.current = true

    let isMounted = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    console.log('OAuth callback params:', { code, state })

    if (!code || !state) {
      toast.error('Neplatný callback.')
      navigate('/login')
      return
    }

    instance
      .get(`/auth/oauth/callback`, { params: { code, state } })
      .then(({ data }) => {
        if (!isMounted) return
        console.log('OAuth success:', data)
        localStorage.setItem('access_token', data.access_token)
        toast.success('Přihlášení úspěšné!')
        navigate('/')
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('OAuth callback error:', error.response?.data || error.message)
        
        const errorDetail = error.response?.data?.detail || ''
        const errorMessage = error.response?.data?.error || ''
        
        if (errorMessage.includes('Rate limit')) {
          toast.error('Příliš mnoho pokusů. Prosím zkuste za chvíli.')
        } else if (errorDetail.includes('Invalid or expired state token')) {
          toast.error('Přihlášení vypršelo. Prosím zkuste v novém okně.')
        } else {
          toast.error('Přihlášení selhalo.')
        }
        navigate('/login')
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page-container">
      <div className="page-content text-center">
        <SplashScreen />
      </div>
    </div>
  )
}