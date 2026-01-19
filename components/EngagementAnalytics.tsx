'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'
import { getEngagementStats, EngagementStats } from '@/lib/api'

interface EngagementAnalyticsProps {
    posts: Array<{ id: string; title: string; type: 'news' | 'event' }>
}

export default function EngagementAnalytics({ posts }: EngagementAnalyticsProps) {
    const [stats, setStats] = useState<Map<string, EngagementStats>>(new Map())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAllStats()
        // Poll for updates every 30 seconds
        const interval = setInterval(loadAllStats, 30000)
        return () => clearInterval(interval)
    }, [posts])

    const loadAllStats = async () => {
        const newStats = new Map<string, EngagementStats>()

        for (const post of posts) {
            try {
                const result = await getEngagementStats(post.type, post.id)
                if (result.success && result.data) {
                    newStats.set(post.id, result.data)
                }
            } catch (error) {
                console.error(`Failed to load stats for ${post.id}:`, error)
            }
        }

        setStats(newStats)
        setLoading(false)
    }

    const getTotalEngagement = () => {
        let totalLikes = 0
        let totalComments = 0
        let totalShares = 0

        stats.forEach((stat) => {
            totalLikes += stat.likes_count
            totalComments += stat.comments_count
            totalShares += stat.shares_count
        })

        return { totalLikes, totalComments, totalShares }
    }

    const getMostEngagedPost = () => {
        let maxEngagement = 0
        let mostEngagedPost: { id: string; title: string; engagement: number } | null = null

        posts.forEach((post) => {
            const postStats = stats.get(post.id)
            if (postStats) {
                const engagement = postStats.likes_count + postStats.comments_count + postStats.shares_count
                if (engagement > maxEngagement) {
                    maxEngagement = engagement
                    mostEngagedPost = { id: post.id, title: post.title, engagement }
                }
            }
        })

        return mostEngagedPost
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const { totalLikes, totalComments, totalShares } = getTotalEngagement()
    const mostEngaged = getMostEngagedPost()

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Engagement Overview</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Updates every 30s</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Likes */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Likes</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalLikes}</p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>

                    {/* Total Comments */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Comments</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalComments}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Total Shares */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Shares</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalShares}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                                <Share2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Most Engaged Post */}
                {mostEngaged && mostEngaged.engagement > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Most Engaged Post</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{mostEngaged.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mostEngaged.engagement} total interactions</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Individual Post Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Post Performance</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {posts.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No posts to display</p>
                    ) : (
                        posts.map((post) => {
                            const postStats = stats.get(post.id)
                            if (!postStats) return null

                            const totalEngagement = postStats.likes_count + postStats.comments_count + postStats.shares_count

                            return (
                                <div key={post.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{post.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{post.type}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-2">
                                            {totalEngagement} total
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                            <Heart className="w-3 h-3" />
                                            <span>{postStats.likes_count}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                            <MessageCircle className="w-3 h-3" />
                                            <span>{postStats.comments_count}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <Share2 className="w-3 h-3" />
                                            <span>{postStats.shares_count}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
