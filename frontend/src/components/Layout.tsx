import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import Navigation from './Navigation'
import type { ReactNode } from 'react'
import InstallPrompt from '../utils/InstallPrompt'
import { AuthProvider } from '../hooks/useAuth';
import { FiCheck, FiList, FiX } from 'react-icons/fi'
import { completeTask } from '../utils/survey'

interface LayoutProps {
    children?: ReactNode
}

function SurveyChecklistWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const hasSurveyToken = Boolean(localStorage.getItem('survey_token'))

  useEffect(() => {
    if (!hasSurveyToken) return

    // If they have access_token, they are logged in - automatically ensure login_oauth is marked completed
    const hasAccessToken = Boolean(localStorage.getItem('access_token'))
    if (hasAccessToken) {
      const stored = JSON.parse(localStorage.getItem('survey_completed_checkpoints') || '[]') as string[]
      if (!stored.includes('login_oauth')) {
        stored.push('login_oauth')
        localStorage.setItem('survey_completed_checkpoints', JSON.stringify(stored))
        // Report it to the Edge KV as well for consistency
        completeTask('login_oauth')
      }
    }

    const updateCheckpoints = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('survey_completed_checkpoints') || '[]') as string[]
        setCompleted(Array.isArray(stored) ? stored : [])
      } catch (err) {
        console.error('[Survey] Failed to parse completed checkpoints:', err)
        setCompleted([])
      }
    }

    updateCheckpoints()
    window.addEventListener('survey:checkpoints_updated', updateCheckpoints)
    return () => window.removeEventListener('survey:checkpoints_updated', updateCheckpoints)
  }, [hasSurveyToken])

  console.log('[Survey] Checklist Widget initialized. hasSurveyToken:', hasSurveyToken, 'completed:', completed, 'survey_token:', localStorage.getItem('survey_token'))

  if (!hasSurveyToken) return null

  const tasks = [
    { id: 'login_oauth', label: 'Přihlášení (Facebook/X)' },
    { id: 'accept_invite', label: 'Výběr místa z pozvánky' },
    { id: 'create_ride', label: 'Vytvoření jízdy' },
    { id: 'create_public_invite', label: 'Nasdílení jízdy' },
    { id: 'session_revoked_others', label: 'Odhlášení jiných relací' },
    { id: 'unlink_social', label: 'Odpojení sítě' },
    { id: 'account_anonymized', label: 'Smazání účtu' },
  ]

  const doneCount = tasks.filter(t => completed.includes(t.id)).length

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800/90 text-white rounded-full shadow-xl border border-white/10 hover:cursor-pointer transition-all duration-200 hover:scale-[1.05]"
        >
          <div className="relative">
            <FiList size={18} className="text-indigo-400" />
            {doneCount < tasks.length && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs font-semibold">
            Úkoly ({doneCount}/{tasks.length})
          </span>
        </button>
      ) : (
        <div className="w-64 backdrop-blur-md bg-slate-950/95 border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Úkoly průzkumu
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors hover:cursor-pointer"
            >
              <FiX size={14} />
            </button>
          </div>
          
          <div className="h-px bg-white/10" />

          <ul className="flex flex-col gap-2">
            {tasks.map(task => {
              const isDone = completed.includes(task.id)
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                    isDone ? 'text-zinc-400 line-through decoration-zinc-600/50' : 'text-zinc-200 font-medium'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {isDone && <FiCheck size={10} strokeWidth={3} />}
                  </div>
                  <span className="truncate">{task.label}</span>
                </li>
              )
            })}
          </ul>

          <div className="h-px bg-white/10" />
          
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>Po dokončení přejděte na /survey</span>
            <span className="font-semibold text-zinc-400">{Math.round((doneCount / tasks.length) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }: LayoutProps) {
    const [showDemoUI, setShowDemoUI] = useState(() => localStorage.getItem('sitzy_show_demo_ui') !== 'false')
    const isDev = import.meta.env.MODE === 'development'

    useEffect(() => {
        const handleToggle = () => {
            setShowDemoUI(localStorage.getItem('sitzy_show_demo_ui') !== 'false')
        }
        window.addEventListener('sitzy:show_demo_ui_changed', handleToggle)
        return () => window.removeEventListener('sitzy:show_demo_ui_changed', handleToggle)
    }, [])

    return (
        <AuthProvider>
            <div className="layout-wrapper">
                <main className="layout-main">
                    <div className="min-h-16 pt-[env(safe-area-inset-top)]">
                        <Navigation />
                    </div>    
                {children ?? <Outlet />}
                </main>
                <InstallPrompt />
                
                <SurveyChecklistWidget />

                {isDev && showDemoUI && (
                    <div 
                        className="fixed bottom-4 right-4 z-[9999] bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-amber-600 animate-pulse pointer-events-none select-none"
                        title="Tento banner lze skrýt v Nastavení -> Vývojářské nástroje"
                    >
                        Vývoj / Test Mode
                    </div>
                )}
            </div>
        </AuthProvider>
    )
}
