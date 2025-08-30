import { Outlet } from 'react-router'
import Navigation from './Navigation'
import type { ReactNode } from 'react'

interface LayoutProps {
    children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div>
            <main>
                <div className="h-16">
                    <Navigation />
                </div>    
                {children ?? <Outlet />}
            </main>
        </div>
    )
}
