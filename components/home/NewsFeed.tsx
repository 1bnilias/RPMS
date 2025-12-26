'use client'

import { newsItems } from '@/lib/mockData'
import Link from 'next/link'

export default function NewsFeed() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">View All</button>
            </div>

            <div className="grid gap-6">
                {newsItems.map((item) => (
                    <Link href={`/news/${item.id}`} key={item.id} className="block group">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group-hover:border-red-200 dark:group-hover:border-red-900">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.bgColor} ${item.color}`}>
                                            {item.category}
                                        </span>
                                        <span className="text-sm text-gray-500">{item.date}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
