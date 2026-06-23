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
  }, [])

  const handleStart = () => {
    if (!localStorage.getItem('survey_token')) {
      const generated = 'pruz-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15))
      localStorage.setItem('survey_token', generated)
    }

    if (isLoggedInReal) {
      navigate('/')
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

    const targetSurveyUrl = `https://tally.so/r/wM07J5${token ? `?token=${encodeURIComponent(token)}` : ''}`
    window.location.href = targetSurveyUrl
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden font-sans">
      {/* Premium Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-xl backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10">
        {!isCompleted ? (
          /* Introduction Mode */
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full">
                Uživatelský průzkum
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Integrace webových služeb do sociálních sítí
              </h1>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed text-left">
                Tento průzkum je součástí akademické práce zaměřené na <strong>analýzu a pilotní implementaci integrace externích webových služeb do sociálních sítí</strong> (jako jsou Facebook, X / Twitter) s cílem usnadnit komunikaci a sdílení obsahu.
              </p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed text-left">
                Funkčnost a bezpečnost navržených integračních rozhraní (autentizace přes OAuth a sdílení dynamických pozvánek) ověřujeme na této pilotní aplikaci <strong>Sitzy</strong> pro správu spolujízd a obsazování míst v autech.
              </p>
            </div>

            <div className="h-px bg-white/10 my-1" />

            <div>
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">
                Během testování vás prosíme o vyzkoušení těchto úkolů:
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiLogIn size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">1. Přihlášení</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Zaregistrujte se / přihlaste se přes Facebook nebo X.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiBell size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">2. Výběr místa</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Přijměte pozvánku v notifikacích a zvolte si sedadlo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiPlusCircle size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">3. Vytvoření jízdy</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Přidejte auto a založte novou společnou jízdu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiShare2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">4. Sdílení jízdy</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Nasdílejte jízdu pomocí vygenerovaného odkazu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiShield size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">5. Správa účtu</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Vyzkoušejte odpojení sítě a odhlášení jiných relací.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <FiTrash2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">6. Smazání účtu</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Smažte svá data přes soft-delete pro konec průzkumu.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips for Tasks */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs space-y-2">
              <h3 className="font-semibold text-indigo-400 flex items-center gap-1.5">
                Tipy pro hladký průběh testování:
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-zinc-400 leading-relaxed">
                <li>
                  <strong className="text-zinc-300">Doporučené přihlášení:</strong> Pro snadný start doporučujeme použít přihlášení přes <strong className="text-indigo-300">X (Twitter)</strong>, které je plně veřejné. Facebook vyžaduje z důvodu schvalovacích pravidel společnosti Meta manuální přidání do testovací skupiny (pokud ho chcete vyzkoušet, <a href="https://m.me/MattyMatejJezek" target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">napište mi</a> své jméno/uživatelské jméno a přidám vás).
                </li>
                <li>
                  <strong className="text-zinc-300">Výběr místa z pozvánky:</strong> Po přihlášení klikněte na ikonu zvonečku (notifikace) v horním menu, klikněte na „Přijmout“ a na detailu jízdy si vyberte libovolné volné sedadlo v autě.
                </li>
                <li>
                  <strong className="text-zinc-300">Simulace pro usnadnění:</strong> Pro účely průzkumu jsme vám v nastavení automaticky nasimulovali druhé připojené sociální propojení a druhou aktivní relaci (Safari na iPhone).
                </li>
                <li>
                  <strong className="text-zinc-300">Odpojení účtu:</strong> V sekci <em>Propojení</em> klikněte na „Odpojit“ u nasimulovaného účtu.
                </li>
                <li>
                  <strong className="text-zinc-300">Odebrání jiných relací:</strong> V sekci <em>Aktivní relace</em> klikněte na „Odhlásit ostatní zařízení“ nebo odeberte simulovanou relaci Safari.
                </li>
                <li>
                  <strong className="text-zinc-300">Smazání účtu:</strong> Smazáním účtu v sekci <em>Profil</em> splníte poslední úkol a budete automaticky přesměrováni zpět k dotazníku.
                </li>
              </ul>
            </div>

            <button
              onClick={handleStart}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group transition-all duration-200 hover:scale-[1.02] hover:cursor-pointer"
            >
              <span>{isLoggedInReal ? 'Pokračovat v průzkumu' : 'Začít průzkum'}</span>
              <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          /* Completion & Redirect Mode */
          <div className="flex flex-col gap-6 text-center py-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 animate-pulse">
                <FiCheckCircle size={40} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Skvělá práce!
              </h1>
              <p className="text-sm text-zinc-300 mt-4 leading-relaxed max-w-md mx-auto">
                Úspěšně jste otestovali klíčové integrace v aplikaci Sitzy. Nyní vás prosíme o vyplnění krátkého dotazníku spokojenosti a dojmů z používání.
              </p>
            </div>

            <button
              onClick={handleRedirectToTally}
              disabled={redirecting}
              className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 hover:cursor-pointer"
            >
              {redirecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  <span>Přesměrovávám...</span>
                </>
              ) : (
                <>
                  <span>Přejít k závěrečnému dotazníku</span>
                  <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            {isLoggedInReal && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-10 mt-2 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-zinc-300 flex items-center justify-center gap-2 hover:cursor-pointer transition-colors text-xs"
              >
                Přejít do aplikace (k úkolům)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
