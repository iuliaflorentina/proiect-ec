import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAuth } from '@/context/AuthContext'
import { Outlet } from 'react-router-dom'

export function Layout() {
    const { isAdmin } = useAuth()

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            {!isAdmin && <Footer />}
        </div>
    )
}
