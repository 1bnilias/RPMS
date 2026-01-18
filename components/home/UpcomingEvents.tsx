'use client'

import { useState, useEffect } from 'react'
import { getEvents, Event } from '@/lib/api'
import SocialPost from '@/components/SocialPost'
import ShareModal from '@/components/ShareModal'

export default function UpcomingEvents() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<{ id: string; type: 'news' | 'event'; title: string } | null>(null)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const result = await getEvents('published')
                if (result.success && result.data) {
                    const now = new Date()
                    const upcoming = result.data
                        .filter(e => new Date(e.date) > now)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    setEvents(upcoming)
                }
            } catch (error) {
                console.error('Failed to fetch events:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchEvents()
    }, [])

    const handleShare = (id: string, title: string) => {
        setSelectedPost({ id, type: 'event', title })
        setShareModalOpen(true)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No upcoming events.</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Check back soon!</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {events.length} {events.length === 1 ? 'event' : 'events'}
                    </span>
                </div>

                <div className="space-y-4">
                    {events.map((event) => (
                        <SocialPost
                            key={event.id}
                            id={event.id}
                            type="event"
                            title={event.title}
                            summary={event.description}
                            category={event.category}
                            date={event.date}
                            location={event.location}
                            created_at={event.created_at}
                            onShare={() => handleShare(event.id, event.title)}
                        />
                    ))}
                </div>
            </div>

            {/* Share Modal */}
            {selectedPost && (
                <ShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    postType={selectedPost.type}
                    postId={selectedPost.id}
                    postTitle={selectedPost.title}
                />
            )}
        </>
    )
}
