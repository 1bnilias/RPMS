'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import AuthorDashboard from '@/components/AuthorDashboard'
import EditorPanel from '@/components/EditorPanel'
import CoordinatorDashboard from '@/components/CoordinatorDashboard'
import AdminPanel from '@/components/AdminPanel'

export default function Home() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center p-4">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-500 dark:to-orange-400 tracking-tight">
              Welcome to RPMS
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 font-medium">
              Research and Publication Management System
            </p>
            <div className="pt-2">
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-semibold">
                Saint Mary's University
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 w-full sm:w-auto">
              Login
            </Link>
            <Link href="/signup" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg hover:border-red-500 dark:hover:border-red-500 transition-all duration-200 w-full sm:w-auto">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user.role === 'author' && <AuthorDashboard user={user} onLogout={logout} />}
      {user.role === 'editor' && <EditorPanel user={user} onLogout={logout} />}
      {user.role === 'coordinator' && <CoordinatorDashboard user={user} onLogout={logout} />}
      {user.role === 'admin' && <AdminPanel user={user} onLogout={logout} />}
    </main>
  )
}
