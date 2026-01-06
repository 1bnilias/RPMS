'use client'

import { useState, useEffect } from 'react'
import { getNews, News } from '@/lib/api'
import Link from 'next/link'
import { TrendingUp, Award, FileText } from 'lucide-react'

const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
        case 'research': return TrendingUp
        case 'achievement': return Award
        default: return FileText
    }
}

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'research': return { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' }
        case 'achievement': return { color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' }
        case 'policy': return { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' }
        default: return { color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
    }
}

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState<News[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const result = await getNews('published')
                if (result.success && result.data) {
                    setNewsItems(result.data.slice(0, 3)) // Show top 3
                }
            } catch (error) {
                console.error('Failed to fetch news:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    if (loading) {
        return <div className="text-center py-4">Loading news...</div>
    }

    if (newsItems.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center text-gray-500">
                    No news available.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">View All</button>
            </div>

            <div className="grid gap-6">
                {newsItems.map((item) => {
                    const Icon = getCategoryIcon(item.category)
                    const { color, bgColor } = getCategoryColor(item.category)

                    return (
                        <div key={item.id} className="block group">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group-hover:border-red-200 dark:group-hover:border-red-900">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${bgColor}`}>
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bgColor} ${color}`}>
                                                {item.category}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                                            {item.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
