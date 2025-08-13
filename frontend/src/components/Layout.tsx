import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'
import type { ReactNode } from 'react'

interface LayoutProps {
    children?: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div>
            <main>
                <Navigation />
                {children ?? <Outlet />}
            </main>
        </div>
    )
}
