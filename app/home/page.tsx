'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, User, signOut } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { UserCircle, LogOut } from 'lucide-react'
import WelcomeHero from '@/components/home/WelcomeHero'
import NewsFeed from '@/components/home/NewsFeed'
import UpcomingEvents from '@/components/home/UpcomingEvents'

export default function HomePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser()
            if (currentUser) {
                setUser(currentUser)
            } else {
                router.push('/login')
            }
            setLoading(false)
        }
        checkAuth()
    }, [router])

    const handleLogout = async () => {
        await signOut()
        setUser(null)
        router.push('/')
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with Profile */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-red-600">RPMS</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <UserCircle className="h-6 w-6" />
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-gray-500 capitalize">({user.role})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-5 w-5 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <WelcomeHero user={user} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: News Feed (Takes up 2/3 space on large screens) */}
                    <div className="lg:col-span-2">
                        <NewsFeed />
                    </div>

                    {/* Right Column: Upcoming Events (Takes up 1/3 space) */}
                    <div className="lg:col-span-1">
                        <UpcomingEvents />
                    </div>
                </div>

            </main>
        </div>
    )
}
