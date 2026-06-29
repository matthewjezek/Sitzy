import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FiLogIn, FiPlusCircle, FiShare2, FiShield, FiArrowRight, FiCheckCircle, FiBell, FiTrash2 } from 'react-icons/fi'

export default function SurveyRedirectPage() {
  const navigate = useNavigate()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoggedInReal, setIsLoggedInReal] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const token = localStorage.getItem('survey_token')

  useEffect(() => {
    const hasAccessToken = Boolean(localStorage.getItem('access_token'))
    const hasCompletedFlag = localStorage.getItem('survey_completed') === 'true'
    setIsCompleted(hasCompletedFlag)
    setIsLoggedInReal(hasAccessToken)
    document.title = 'Uživatelský průzkum - Sitzy'
  }, [])

  const handleStart = () => {
    if (!localStorage.getItem('survey_token')) {
      const generated = 'pruz-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15))
      localStorage.setItem('survey_token', generated)
    }

    if (isLoggedInReal) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const handleRedirectToTally = async () => {
    setRedirecting(true)
    if (token) {
      try {
        await fetch('/api/checkpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            checkpointName: 'survey_redirected'
          })
        })
        console.log('[Survey] Redirect checkpoint saved successfully.')
      } catch (err) {
        console.error('[Survey] Failed to save redirect checkpoint:', err)
      }
    }

    // Reset local storage survey testing states so the app is clean for the next test
    localStorage.removeItem('survey_token')
    localStorage.removeItem('survey_completed')
    localStorage.removeItem('survey_completed_checkpoints')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('survey_mock_')) {
        localStorage.removeItem(key)
      }
    })

    const targetSurveyUrl = `https://tally.so/r/1AOYoW${token ? `?token=${encodeURIComponent(token)}` : ''}`
    window.location.href = targetSurveyUrl
  }

  return (
    <div className="page-container page-container-auth relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="not-found-bg-glow" aria-hidden="true" />
      
      <div className="page-content max-w-xl mx-auto z-10">
        <div className="not-found-card flex flex-col p-6 md:p-8">
          {!isCompleted ? (
            /* Introduction Mode */
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <span className="text-xs font-semibold tracking-wider uppercase badge-indigo text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full">
                  Uživatelský průzkum
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight text-zinc-900 dark:text-zinc-100">
                  Integrace webových služeb do sociálních sítí
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pilotní aplikace <strong className="text-zinc-700 dark:text-zinc-300">Sitzy</strong> pro testování OAuth přihlášení a sdílení obsahu přes sociální sítě.
                </p>
              </div>

              {/* Facebook warning callout */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 dark:border-amber-500/30 text-left">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Facebook nefunguje bez schválení</p>
                  <p className="text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                    Doporučujeme přihlášení přes <strong>X (Twitter)</strong> — je plně veřejné. Facebook vyžaduje manuální přidání do testovací skupiny.{' '}
                    <a href="https://m.me/MattyMatejJezek" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:opacity-80 transition-opacity">Napište mi</a> a přidám vás.
                  </p>
                </div>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-850" />

              <div>
                <h2 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mb-3">
                  Úkoly k vyzkoušení:
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiLogIn size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">1. Přihlášení</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Zaregistrujte se přes Facebook nebo X.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiBell size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">2. Výběr místa</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Přijměte pozvánku a zvolte sedadlo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiPlusCircle size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">3. Vytvoření jízdy</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Přidejte auto a vytvořte jízdu.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiShare2 size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">4. Sdílení jízdy</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Sdílejte jízdu vygenerovaným odkazem.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiShield size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">5. Správa účtu</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Odpojte síť a odhlaste jiné relace.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl theme-surface-muted border theme-border hover:opacity-90 transition-opacity">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FiTrash2 size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">6. Smazání účtu</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Smažte účet pro dokončení průzkumu.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact helper hints */}
              <div className="p-3 rounded-xl theme-surface-muted border theme-border text-left text-[11px] space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <p><strong className="text-zinc-700 dark:text-zinc-300">Pozvánka:</strong> Po přihlášení klikněte na zvoneček v menu → Přijmout → vyberte sedadlo.</p>
                <p><strong className="text-zinc-700 dark:text-zinc-300">Simulace:</strong> V nastavení jsou předpřipravena druhé propojení a relace (Safari na iPhone) pro úkoly 5 a 6.</p>
              </div>

            <button
              onClick={handleStart}
              className="button-primary w-full h-12 flex items-center justify-center gap-2 group transition-all duration-200 hover:scale-[1.02] hover:cursor-pointer"
            >
              <span>{isLoggedInReal ? 'Pokračovat v průzkumu' : 'Začít průzkum'}</span>
              <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          /* Completion & Redirect Mode */
          <div className="flex flex-col gap-6 text-center py-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-pulse">
                <FiCheckCircle size={40} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight text-zinc-900 dark:text-zinc-100">
                Skvělá práce!
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed max-w-md mx-auto">
                Úspěšně jste otestovali klíčové integrace v aplikaci Sitzy. Nyní vás prosíme o vyplnění krátkého dotazníku spokojenosti a dojmů z používání.
              </p>
            </div>

            <button
              onClick={handleRedirectToTally}
              disabled={redirecting}
              className="button-primary w-full h-auto min-h-[3rem] py-3 mt-4 flex items-center justify-center gap-2 group transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 hover:cursor-pointer text-sm"
            >
              {redirecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white shrink-0" />
                  <span>Přesměrovávám...</span>
                </>
              ) : (
                <>
                  <span className="text-center leading-snug">Přejít k závěrečnému dotazníku</span>
                  <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
                </>
              )}
            </button>
            {isLoggedInReal && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="button-secondary w-full h-10 mt-2 flex items-center justify-center gap-2 hover:cursor-pointer text-xs"
              >
                Přejít do aplikace (k úkolům)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)
}

