import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      toast.error('Neplatný callback.')
      navigate('/login')
      return
    }

    instance
      .get(`/auth/oauth/callback`, { params: { code, state } })
      .then(({ data }) => {
        localStorage.setItem('access_token', data.access_token)
        navigate('/')
      })
      .catch(() => {
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