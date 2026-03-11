import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import instance from '../api/axios'
import { toast } from 'react-toastify'
import SplashScreen from '../components/SplashScreen'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const executedRef = useRef(false)

  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const [animationDone, setAnimationDone] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)

  useEffect(() => {
    // Prevent double execution in Strict Mode
    if (executedRef.current) return
    executedRef.current = true

    if (!code || !state) {
      toast.error('Neplatný callback.')
      setTargetPath('/login') // Místo okamžitého navigate si cestu jen uložíme
      return
    }

    instance.get('/auth/oauth/callback', { 
      params: { code, state }
    })
      .then(response => {
        const data = response.data
        localStorage.setItem('access_token', data.access_token)
        toast.success('Přihlášení úspěšné!')
        setTargetPath('/') // Uložíme si, kam chceme jít při úspěchu
      })
      .catch(error => {
        const errorDetail = error.response?.data?.detail || ''
        const errorMessage = error.response?.data?.error || ''

        if (errorMessage.includes('Rate limit')) {
          toast.error('Příliš mnoho pokusů. Prosím zkuste za chvíli.')
        } else if (errorDetail.includes('Invalid or expired state token')) {
          toast.error('Přihlášení vypršelo. Prosím zkuste v novém okně.')
        } else {
          toast.error('Přihlášení selhalo.')
        }
        setTargetPath('/login') // Uložíme si cestu při chybě
      })
  }, [code, state])

  // 2. Efekt, který čeká na splnění obou podmínek
  useEffect(() => {
    // Pokud animace dojela A ZÁROVEŇ už nám backend vrátil výsledek (máme cestu)
    if (animationDone && targetPath) {
      navigate(targetPath)
    }
  }, [animationDone, targetPath, navigate])

  return (
    <div className="page-container min-h-screen bg-slate-900 dark:bg-slate-950">
      <div className="page-content text-center flex flex-col items-center justify-center">
        {/* 3. Napojení na callback animace */}
        <SplashScreen onComplete={() => setAnimationDone(true)} />
      </div>
    </div>
  )
}