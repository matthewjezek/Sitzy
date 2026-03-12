import { Outlet } from 'react-router'
import Navigation from './Navigation'
import type { ReactNode } from 'react'
import InstallPrompt from '../utils/InstallPrompt'
import { AuthProvider } from '../hooks/useAuth';

interface LayoutProps {
    children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
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
            </div>
        </AuthProvider>
    )
}
