import { Outlet } from 'react-router'
import Navigation from './Navigation'
import type { ReactNode } from 'react'

interface LayoutProps {
    children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="layout-wrapper">
            <main className="layout-main">
                <div className="h-16 pt-[env(safe-area-inset-top)]">
                    <Navigation />
                </div>    
                {children ?? <Outlet />}
            </main>
        </div>
    )
}
