'use client'

import { useState, useEffect } from 'react'
import { getNews, News } from '@/lib/api'
import SocialPost from '@/components/SocialPost'
import ShareModal from '@/components/ShareModal'

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState<News[]>([])
    const [loading, setLoading] = useState(true)
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<{ id: string; type: 'news' | 'event'; title: string } | null>(null)

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const result = await getNews('published')
                if (result.success && result.data) {
                    setNewsItems(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch news:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchNews()
    }, [])

    const handleShare = (id: string, title: string) => {
        setSelectedPost({ id, type: 'news', title })
        setShareModalOpen(true)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (newsItems.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No news available yet.</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Check back soon for updates!</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {newsItems.length} {newsItems.length === 1 ? 'post' : 'posts'}
                    </span>
                </div>

                <div className="space-y-4">
                    {newsItems.map((item) => (
                        <SocialPost
                            key={item.id}
                            id={item.id}
                            type="news"
                            title={item.title}
                            summary={item.summary}
                            content={item.content}
                            category={item.category}
                            created_at={item.created_at}
                            onShare={() => handleShare(item.id, item.title)}
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
