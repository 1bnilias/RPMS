'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Send, X, Users, Newspaper, Calendar as CalendarIcon, MapPin } from 'lucide-react'
import { likePost, addComment, getComments, getEngagementStats, getPostLikes, Comment, EngagementStats } from '@/lib/api'
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
    image_url?: string
    video_url?: string
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
    image_url,
    video_url,
    created_at,
    onShare
}: SocialPostProps) {
    const [stats, setStats] = useState<EngagementStats | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [loading, setLoading] = useState(false)
    const [liking, setLiking] = useState(false)
    const [showLikesModal, setShowLikesModal] = useState(false)
    const [likesList, setLikesList] = useState<any[]>([])
    const [loadingLikes, setLoadingLikes] = useState(false)

    useEffect(() => {
        loadEngagementData()
    }, [id, type])

    const loadEngagementData = async () => {
        try {
            const result = await getEngagementStats(type, id)
            if (result.success && result.data) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Failed to load engagement data:', error)
        }
    }

    const loadComments = async () => {
        try {
            const result = await getComments(type, id)
            if (result.success && result.data) {
                setComments(result.data.comments || [])
            } else {
                setComments([])
            }
        } catch (error) {
            console.error('Failed to load comments:', error)
            setComments([])
        }
    }

    const loadLikes = async () => {
        setLoadingLikes(true)
        setShowLikesModal(true)
        try {
            const result = await getPostLikes(type, id)
            if (result.success && result.data) {
                setLikesList(result.data.likes || [])
            }
        } catch (error) {
            console.error('Failed to load likes:', error)
        } finally {
            setLoadingLikes(false)
        }
    }

    const handleLike = async () => {
        if (liking) return
        setLiking(true)
        try {
            const result = await likePost(type, id)
            if (result.success && result.data && stats) {
                setStats({
                    ...stats,
                    user_liked: result.data.liked,
                    likes_count: result.data.liked ? stats.likes_count + 1 : stats.likes_count - 1
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
            const result = await addComment(type, id, commentText)
            if (result.success && result.data) {
                setComments([result.data.comment, ...(comments || [])])
                setCommentText('')
                if (stats) {
                    setStats({ ...stats, comments_count: stats.comments_count + 1 })
                }
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-xl flex flex-col">
            {/* Media Header */}
            {(image_url || video_url) && (
                <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {video_url ? (
                        <video
                            src={video_url}
                            className="w-full h-full object-cover"
                            controls
                        />
                    ) : (
                        <img
                            src={image_url}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                    )}
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                            {category || (type === 'news' ? 'News' : 'Event')}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                            {title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {type === 'news' ? 'News Post' : 'Event'}
                            </span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>

                {summary && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                        {summary}
                    </p>
                )}

                {type === 'event' && (date || location) && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 mb-4">
                        {date && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <CalendarIcon className="w-4 h-4 text-red-500" />
                                <span className="font-medium">
                                    {new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}
                        {location && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span>{location}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Engagement Stats */}
            {stats && (
                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={loadLikes}
                            className="hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                            <span className="font-bold">{stats.likes_count}</span>
                            <span>{stats.likes_count === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        <button
                            onClick={toggleComments}
                            className="hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                            <span className="font-bold">{stats.comments_count}</span>
                            <span>{stats.comments_count === 1 ? 'Comment' : 'Comments'}</span>
                        </button>
                    </div>
                    {stats.shares_count > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="font-bold">{stats.shares_count}</span>
                            <span>{stats.shares_count === 1 ? 'Share' : 'Shares'}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-around">
                    <button
                        onClick={handleLike}
                        disabled={liking}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${stats?.user_liked
                            ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${stats?.user_liked ? 'fill-current' : ''}`} />
                        <span className="font-bold text-sm">Like</span>
                    </button>

                    <button
                        onClick={toggleComments}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">Comment</span>
                    </button>

                    <button
                        onClick={onShare}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-bold text-sm">Share</span>
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800">
                    <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim() || loading}
                            className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {comments.length === 0 ? (
                            <p className="text-center text-gray-500 py-4 text-sm italic">No comments yet. Be the first to comment!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs flex-shrink-0">
                                        {comment.user_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-4 py-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{comment.user_name}</span>
                                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Likes Modal */}
            {showLikesModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                                Liked by
                            </h3>
                            <button onClick={() => setShowLikesModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                            {loadingLikes ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : likesList.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No likes yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {likesList.map((like) => (
                                        <div key={like.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                                                {like.user_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 dark:text-white">{like.user_name}</p>
                                                <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
