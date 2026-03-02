import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const processedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (processedRef.current) return
    processedRef.current = true

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
        console.log('OAuth success:', data)
        localStorage.setItem('access_token', data.access_token)
        toast.success('Přihlášení úspěšné!')
        navigate('/')
      })
      .catch((error) => {
        console.error('OAuth callback error:', error.response?.data || error.message)
        toast.error('Přihlášení selhalo.')
        navigate('/login')
      })
  }, [])

  return (
    <div className="page-container">
      <div className="page-content text-center">
        <p>Přihlašování...</p>
      </div>
    </div>
  )
}