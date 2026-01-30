'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
    const { user, loading, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading chat...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="h-screen h-[100svh] h-[100dvh] w-full max-w-[100vw] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
            <div className="flex-shrink-0 w-full max-w-full">
                <Header user={user} title="Messages" onLogout={logout} />
            </div>
            <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col p-0">
                <div className="w-full h-full flex-1 overflow-hidden relative">
                    <ChatInterface currentUser={user} />
                </div>
            </main>
        </div>
    )
}
