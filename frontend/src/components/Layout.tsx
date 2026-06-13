import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import Navigation from './Navigation'
import type { ReactNode } from 'react'
import InstallPrompt from '../utils/InstallPrompt'
import { AuthProvider } from '../hooks/useAuth';

interface LayoutProps {
    children?: ReactNode
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
                    <div className="h-16 pt-[env(safe-area-inset-top)]">
                        <Navigation />
                    </div>    
                {children ?? <Outlet />}
                </main>
                <InstallPrompt />
                
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
