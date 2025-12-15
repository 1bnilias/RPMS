'use client'

import { useParams, useRouter } from 'next/navigation'
import { events } from '@/lib/mockData'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, MapPin, Tag } from 'lucide-react'

export default function EventDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)
    const event = events.find(item => item.id === id)

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-red-600 h-32 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-white opacity-50" />
                </div>

                <div className="p-8">
                    <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>

                    <div className="flex flex-wrap gap-4 mb-8">
                        <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            <Calendar className="h-5 w-5 mr-2 text-red-600" />
                            <span className="font-medium">{event.date}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            <Clock className="h-5 w-5 mr-2 text-red-600" />
                            <span className="font-medium">{event.time}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            <MapPin className="h-5 w-5 mr-2 text-red-600" />
                            <span className="font-medium">{event.location}</span>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {event.title}
                    </h1>

                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-6">
                        {event.type}
                    </span>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">About this Event</h3>
                        <div dangerouslySetInnerHTML={{ __html: event.description }} />
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                            Register for Event
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
