'use client'

import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { getContacts, shareToMessage, Contact } from '@/lib/api'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    postType: 'news' | 'event'
    postId: string
    postTitle: string
}

export default function ShareModal({ isOpen, onClose, postType, postId, postTitle }: ShareModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [selectedContact, setSelectedContact] = useState<string>('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadContacts()
            setMessage(`Check out this ${postType}: ${postTitle}`)
        }
    }, [isOpen, postType, postTitle])

    const loadContacts = async () => {
        try {
            const contactsData = await getContacts()
            setContacts(contactsData)
        } catch (error) {
            console.error('Failed to load contacts:', error)
        }
    }

    const handleShare = async () => {
        if (!selectedContact || loading) return

        setLoading(true)
        try {
            await shareToMessage(postType, postId, selectedContact, message)
            setSuccess(true)
            setTimeout(() => {
                onClose()
                setSuccess(false)
                setSelectedContact('')
                setMessage('')
            }, 1500)
        } catch (error) {
            console.error('Failed to share:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share to Message</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">Shared successfully!</p>
                        </div>
                    ) : (
                        <>
                            {/* Select Contact */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Contact
                                </label>
                                <select
                                    value={selectedContact}
                                    onChange={(e) => setSelectedContact(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">Choose a contact...</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.name} ({contact.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Message Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Message (optional)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    placeholder="Add a personal message..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={!selectedContact || loading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? 'Sharing...' : 'Share'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
