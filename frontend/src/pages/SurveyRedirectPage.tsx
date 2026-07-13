import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { FiCheckCircle, FiHome, FiArrowRight } from 'react-icons/fi'

export default function SurveyRedirectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Clear all survey-related states so visitors don't get stuck in survey mode checklist widget
    localStorage.removeItem('survey_token')
    localStorage.removeItem('survey_completed')
    localStorage.removeItem('survey_completed_checkpoints')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('survey_mock_')) {
        localStorage.removeItem(key)
      }
    })
    document.title = 'Uživatelský průzkum dokončen - Sitzy'
  }, [])

  const handleEnterApp = () => {
    if (localStorage.getItem('access_token')) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="page-container page-container-auth relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="not-found-bg-glow" aria-hidden="true" />
      
      <div className="page-content max-w-xl mx-auto z-10">
        <div className="not-found-card flex flex-col p-6 md:p-8 text-center py-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-pulse">
              <FiCheckCircle size={48} />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold tracking-wider uppercase badge-indigo text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full">
              Průzkum dokončen
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-4 tracking-tight text-zinc-900 dark:text-zinc-100">
              Děkujeme za vaši účast!
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed max-w-md mx-auto">
              Uživatelský průzkum a testování aplikace Sitzy byly úspěšně ukončeny. Velice děkujeme všem účastníkům za jejich čas, ochotu a cennou zpětnou vazbu, kterou nám během testování poskytli. Pomohlo nám to vylepšit aplikaci pro každého!
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="button-secondary w-full h-12 flex items-center justify-center gap-2 hover:cursor-pointer text-sm"
            >
              <FiHome size={16} />
              <span>Hlavní stránka</span>
            </button>
            <button
              onClick={handleEnterApp}
              className="button-primary w-full h-12 flex items-center justify-center gap-2 hover:cursor-pointer text-sm"
            >
              <span>Vstoupit do aplikace</span>
              <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
