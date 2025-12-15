'use client'

import { useParams, useRouter } from 'next/navigation'
import { newsItems } from '@/lib/mockData'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Tag } from 'lucide-react'

export default function NewsDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)
    const newsItem = newsItems.find(item => item.id === id)

    if (!newsItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">News Item Not Found</h1>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className={`h-48 ${newsItem.bgColor.replace('/30', '')} flex items-center justify-center`}>
                    <newsItem.icon className={`h-24 w-24 ${newsItem.color}`} />
                </div>

                <div className="p-8">
                    <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>

                    <div className="flex items-center gap-4 mb-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${newsItem.bgColor} ${newsItem.color}`}>
                            {newsItem.category}
                        </span>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            {newsItem.date}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        {newsItem.title}
                    </h1>

                    <div
                        className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: newsItem.content }}
                    />
                </div>
            </div>
        </div>
    )
}
