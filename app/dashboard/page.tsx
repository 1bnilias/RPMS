'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, User, signOut } from '@/lib/api'
import AdminPanel from '@/components/AdminPanel'
import EditorPanel from '@/components/EditorPanel'
import AuthorDashboard from '@/components/AuthorDashboard'
import CoordinatorDashboard from '@/components/CoordinatorDashboard'

export default function DashboardPage() {
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
        return null // Will redirect in useEffect
    }

    return (
        <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {user.role === 'author' && <AuthorDashboard user={user} onLogout={handleLogout} />}
            {user.role === 'admin' && <AdminPanel user={user} onLogout={handleLogout} />}
            {user.role === 'editor' && <EditorPanel user={user} onLogout={handleLogout} />}
            {user.role === 'coordinator' && <CoordinatorDashboard user={user} onLogout={handleLogout} />}
        </main>
    )
}
