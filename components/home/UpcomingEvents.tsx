'use client'

import { useState, useEffect } from 'react'
import { getEvents, Event } from '@/lib/api'
import { Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function UpcomingEvents() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const result = await getEvents('published')
                if (result.success && result.data) {
                    const now = new Date()
                    const upcoming = result.data
                        .filter(e => new Date(e.date) > now)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 3)
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

    if (loading) {
        return <div className="text-center py-4">Loading events...</div>
    }

    if (events.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center text-gray-500">
                    No upcoming events found.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">Calendar View</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {events.map((event) => (
                        <div key={event.id} className="block hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-16 text-center bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-100 dark:border-red-900/30">
                                        <span className="block text-xs font-bold text-red-600 uppercase tracking-wide">
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                                        </span>
                                        <span className="block text-xl font-bold text-gray-900 dark:text-white">
                                            {new Date(event.date).getDate()}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600">{event.title}</h3>
                                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                                {event.category || 'Event'}
                                            </span>
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Clock className="h-4 w-4 mr-2" />
                                                {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <MapPin className="h-4 w-4 mr-2" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
