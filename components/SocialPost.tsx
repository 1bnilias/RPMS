'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Send } from 'lucide-react'
import { likePost, addComment, getComments, getEngagementStats, Comment, EngagementStats } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface SocialPostProps {
    id: string
    type: 'news' | 'event'
    title: string
    summary?: string
    content?: string
    category?: string
    date?: string
    location?: string
    created_at: string
    onShare?: () => void
}

export default function SocialPost({
    id,
    type,
    title,
    summary,
    content,
    category,
    date,
    location,
    created_at,
    onShare
}: SocialPostProps) {
    const [stats, setStats] = useState<EngagementStats | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [loading, setLoading] = useState(false)
    const [liking, setLiking] = useState(false)

    useEffect(() => {
        loadEngagementData()
    }, [id, type])

    const loadEngagementData = async () => {
        try {
            const statsData = await getEngagementStats(type, id)
            setStats(statsData)
        } catch (error) {
            console.error('Failed to load engagement data:', error)
        }
    }

    const loadComments = async () => {
        try {
            const { comments: commentsData } = await getComments(type, id)
            setComments(commentsData)
        } catch (error) {
            console.error('Failed to load comments:', error)
        }
    }

    const handleLike = async () => {
        if (liking) return
        setLiking(true)
        try {
            const result = await likePost(type, id)
            // Update stats optimistically
            if (stats) {
                setStats({
                    ...stats,
                    user_liked: result.liked,
                    likes_count: result.liked ? stats.likes_count + 1 : stats.likes_count - 1
                })
            }
        } catch (error) {
            console.error('Failed to like post:', error)
        } finally {
            setLiking(false)
        }
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentText.trim() || loading) return

        setLoading(true)
        try {
            const { comment } = await addComment(type, id, commentText)
            setComments([comment, ...comments])
            setCommentText('')
            // Update comment count
            if (stats) {
                setStats({ ...stats, comments_count: stats.comments_count + 1 })
            }
        } catch (error) {
            console.error('Failed to add comment:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleComments = () => {
        if (!showComments && comments.length === 0) {
            loadComments()
        }
        setShowComments(!showComments)
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
            {/* Header */}
            <div className="p-6">
                {/* Category Badge */}
                {category && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-3">
                        {category}
                    </span>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {/* Summary/Content */}
                {summary && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                        {summary}
                    </p>
                )}

                {/* Event Details */}
                {type === 'event' && (
                    <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {date && (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">📅</span>
                                <span>{new Date(date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        )}
                        {location && (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">📍</span>
                                <span>{location}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
                </p>
            </div>

            {/* Engagement Bar */}
            {stats && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                            <span>{stats.likes_count} {stats.likes_count === 1 ? 'like' : 'likes'}</span>
                            <span>{stats.comments_count} {stats.comments_count === 1 ? 'comment' : 'comments'}</span>
                        </div>
                        {stats.shares_count > 0 && (
                            <span>{stats.shares_count} {stats.shares_count === 1 ? 'share' : 'shares'}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-2">
                <div className="flex items-center justify-around">
                    {/* Like Button */}
                    <button
                        onClick={(e) => {
                            handleLike()
                            // Trigger heartbeat animation
                            e.currentTarget.classList.add('animate-heartbeat')
                            setTimeout(() => e.currentTarget.classList.remove('animate-heartbeat'), 300)
                        }}
                        disabled={liking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${stats?.user_liked
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            } disabled:opacity-50`}
                    >
                        <Heart
                            className={`w-5 h-5 transition-smooth ${stats?.user_liked ? 'fill-current' : ''}`}
                        />
                        <span className="font-medium">Like</span>
                    </button>

                    {/* Comment Button */}
                    <button
                        onClick={toggleComments}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">Comment</span>
                    </button>

                    {/* Share Button */}
                    <button
                        onClick={onShare}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium">Share</span>
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 animate-slide-in-up">
                    {/* Comment Input */}
                    <form onSubmit={handleAddComment} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-smooth"
                                maxLength={1000}
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {comments.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                No comments yet. Be the first to comment!
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm flex-shrink-0">
                                            {comment.user_name?.charAt(0).toUpperCase() || '?'}
                                        </div>

                                        {/* Comment Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {comment.user_name || 'Anonymous'}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
