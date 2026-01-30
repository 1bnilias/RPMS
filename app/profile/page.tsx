'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/api'
import { User as UserIcon, Mail, Calendar, Shield, Edit2, Save, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Header from '@/components/Header'

export default function ProfilePage() {
    const { user, loading, refreshUser, logout } = useAuth()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar: '',
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        } else if (user) {
            setFormData({
                name: user.name,
                bio: user.bio || '',
                avatar: user.avatar || '',
            })
        }
    }, [user, loading, router])

    const handleSave = async () => {
        setSaving(true)
        setMessage({ type: '', text: '' })
        try {
            const result = await updateProfile({
                ...formData,
                preferences: user?.preferences
            })
            if (result.success) {
                await refreshUser()
                setIsEditing(false)
                setMessage({ type: 'success', text: 'Profile updated successfully' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update profile' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setSaving(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header user={user} title={user.name} onLogout={logout} />
            <div className="max-w-3xl mx-auto py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Back
                        </button>
                        <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                            <button
                                onClick={() => router.push('/settings')}
                                className="flex items-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-2 sm:px-3 py-2 rounded-md transition-colors border border-gray-300 dark:border-gray-600 hover:border-red-600 dark:hover:border-red-400 flex-1 sm:flex-initial justify-center"
                            >
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Settings
                            </button>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-md transition-colors flex-1 sm:flex-initial justify-center"
                                >
                                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {message.text && (
                            <div className={`p-3 sm:p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                            {/* Avatar Section */}
                            <div className="flex-shrink-0 flex flex-col items-center space-y-3 sm:space-y-4">
                                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    {user.avatar ? (
                                        <Image
                                            src={user.avatar}
                                            alt={user.name}
                                            width={128}
                                            height={128}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="h-16 w-16 text-gray-400" />
                                    )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                  ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                            user.role === 'coordinator' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'}`}>
                                    {user.role}
                                </span>
                            </div>

                            {/* Details Section */}
                            <div className="flex-grow space-y-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                                            <textarea
                                                rows={4}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL</label>
                                            <input
                                                type="text"
                                                value={formData.avatar}
                                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                                placeholder="https://example.com/avatar.jpg"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm sm:text-base hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                                            <div className="flex items-center text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {user.email}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">About</h3>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {user.bio || 'No bio provided yet.'}
                                            </p>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
