import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import SplashScreen from '../components/SplashScreen'
import { completeTask, startSurveySession } from '../utils/survey'

// Cache pending callback requests to prevent double-fetching on React remounts
const pendingCallbacks = new Map<string, Promise<{ access_token: string }>>()

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const [animationDone, setAnimationDone] = useState(!!navigator.webdriver)
  const [targetPath, setTargetPath] = useState<string | null>(null)

  useEffect(() => {
    if (!code || !state) {
      toast.error('Neplatný callback.')
      setTargetPath('/login')
      return
    }

    let promise = pendingCallbacks.get(state)
    if (!promise) {
      promise = instance.get('/auth/oauth/callback', { 
        params: { code, state }
      }).then(response => response.data)
      pendingCallbacks.set(state, promise)
    }

    let active = true

    promise
      .then(async data => {
        pendingCallbacks.delete(state)
        if (!active) return

        localStorage.setItem('access_token', data.access_token)

        try {
          const userRes = await instance.get('/auth/me')
          if (!active) return
          await startSurveySession(userRes.data)
        } catch (err) {
          console.error('Failed to initialize survey session:', err)
        }

        toast.success('Přihlášení úspěšné!')
        completeTask('login_oauth')
        const redirectPath = localStorage.getItem('post_login_redirect')
        if (redirectPath) {
          localStorage.removeItem('post_login_redirect')
          setTargetPath(redirectPath)
          return
        }
        setTargetPath('/dashboard')
      })
      .catch(error => {
        pendingCallbacks.delete(state)
        if (!active) return

        const errorDetail = error.response?.data?.detail || ''
        const errorMessage = error.response?.data?.error || ''

        if (errorMessage.includes('Rate limit')) {
          toast.error('Příliš mnoho pokusů. Prosím zkuste za chvíli.')
        } else if (errorDetail.includes('Invalid or expired state token')) {
          toast.error('Přihlášení vypršelo. Prosím zkuste v novém okně.')
        } else {
          toast.error('Přihlášení selhalo.')
        }
        setTargetPath('/login')
      })

    return () => {
      active = false
    }
  }, [code, state])

  useEffect(() => {
    if (animationDone && targetPath) {
      navigate(targetPath)
    }
  }, [animationDone, targetPath, navigate])

  return (
    <div className="page-container min-h-screen bg-slate-900 dark:bg-slate-950">
      <div className="page-content text-center flex flex-col items-center justify-center">
        
        <SplashScreen onComplete={() => setAnimationDone(true)} />
      </div>
    </div>
  )
}