'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Notification, getUnreadCount, getNotifications, markNotificationRead } from '@/lib/api'
import { User as UserIcon, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface HeaderProps {
    user: User
    title: string
    onLogout: () => void
}

export default function Header({ user, title, onLogout }: HeaderProps) {
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const notificationRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Fetch unread count and notifications initially
        fetchUnreadCount()
        fetchNotifications()

        // Poll every 10 seconds
        const interval = setInterval(() => {
            fetchUnreadCount()
            fetchNotifications()
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const result = await getUnreadCount()
            if (result.success && result.data) {
                setUnreadCount(result.data.count)
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error)
        }
    }

    const fetchNotifications = async () => {
        try {
            const result = await getNotifications()
            if (result.success && result.data) {
                setNotifications(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markNotificationRead(notification.id)
            fetchNotifications()
        }

        // Navigate to home page (which shows role-specific dashboard)
        if (notification.paper_id) {
            setShowNotifications(false)

            // If we are already on the home page, manually set the hash to trigger scrolling
            if (window.location.pathname === '/') {
                window.location.hash = `paper-${notification.paper_id}`
            } else {
                // Otherwise navigate to the page with the hash
                router.push(`/#paper-${notification.paper_id}`)
            }
        }
    }

    const unreadNotificationCount = notifications.filter(n => !n.is_read).length

    return (
        <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.push('/chat')}
                        className="relative text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Messages"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <div ref={notificationRef} className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Notifications"
                        >
                            <Bell className="w-6 h-6" />
                            {unreadNotificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                </span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                                <div className="p-4 border-b dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {unreadNotificationCount} unread, {notifications.length - unreadNotificationCount} read
                                    </p>
                                </div>
                                <div className="divide-y dark:divide-gray-700">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-3 transition-colors ${notification.paper_id ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                                                    } ${!notification.is_read ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                                                    }`}
                                            >
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
                            {user.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt={user.name}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <UserIcon className="h-5 w-5 text-gray-500" />
                            )}
                        </div>
                        <span className="font-medium">{user.name || 'User'}</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </header>
    )
}
