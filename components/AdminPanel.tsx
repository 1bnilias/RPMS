'use client'

import { useState, useEffect } from 'react'
import { Users, MessageSquare, Send, X, FileText, Download, Bell, CheckCircle } from 'lucide-react'
import { User, Paper, Review, Notification, getPapers, getReviews, updatePaper, sendMessage, uploadFile, getNotifications, markNotificationRead } from '@/lib/api'
import Header from './Header'

interface AdminPanelProps {
  user: User
  onLogout: () => void
}

interface PaperWithReviews extends Paper {
  reviews: Review[]
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const [papers, setPapers] = useState<PaperWithReviews[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedPaper, setSelectedPaper] = useState<PaperWithReviews | null>(null)
  const [editorContactForm, setEditorContactForm] = useState({ paperId: '', message: '' })

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Handle hash navigation for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash && hash.startsWith('#paper-')) {
        const paperId = hash.replace('#paper-', '')
        const element = document.getElementById(`paper-${paperId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-red-500')
          setTimeout(() => element.classList.remove('ring-2', 'ring-red-500'), 3000)
        }
      }
    }

    // Check on mount and when papers load
    if (!loading && papers.length > 0) {
      handleHashChange()
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [loading, papers])

  const fetchData = async () => {
    try {
      const papersResult = await getPapers()
      const reviewsResult = await getReviews()

      if (papersResult.success && papersResult.data) {
        // Get papers that are ready for admin approval (have reviews)
        const papersWithReviews = papersResult.data.map((paper: Paper) => {
          const paperReviews = reviewsResult.data?.filter((review: Review) =>
            review.paper_id === paper.id
          ) || []

          return {
            ...paper,
            reviews: paperReviews
          }
        }).filter((paper: PaperWithReviews) =>
          (paper.status === 'submitted' || paper.status === 'under_review' || paper.status === 'recommended_for_publication')
        )

        setPapers(papersWithReviews)
      }

      const notificationsResult = await getNotifications()
      if (notificationsResult.success && notificationsResult.data) {
        setNotifications(notificationsResult.data)
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublicationDecision = async (paperId: string, publish: boolean) => {
    try {
      const result = await updatePaper(paperId, {
        status: publish ? 'published' : 'rejected'
      })

      if (result.success) {
        setPapers(papers.filter(paper => paper.id !== paperId))
      }
    } catch (error) {
      console.error('Failed to update paper status:', error)
    }
  }

  const getAverageScore = (reviews: Review[]) => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getRecommendationSummary = (reviews: Review[]) => {
    const counts = reviews.reduce((acc, review) => {
      acc[review.recommendation] = (acc[review.recommendation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .map(([rec, count]) => `${count} ${rec.replace(/_/g, ' ')}`)
      .join(', ')
  }

  const contactEditor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editorContactForm.message) return

    try {
      let messageContent = `Admin Message: ${editorContactForm.message}`

      // If a paper is selected, include paper info and send to the editor who reviewed it
      if (editorContactForm.paperId) {
        const paper = papers.find(p => p.id === editorContactForm.paperId)
        if (paper && paper.reviews.length > 0) {
          const editorId = paper.reviews[0].reviewer_id
          messageContent = `Admin Message regarding "${paper.title}": ${editorContactForm.message}`

          const result = await sendMessage(editorId, messageContent)

          if (result.success) {
            setEditorContactForm({ paperId: '', message: '' })
            alert('Message sent to editor successfully!')
            return
          }
        }
      }

      alert('Please select a paper to contact its editor')
    } catch (error) {
      console.error('Failed to contact editor:', error)
      alert('Failed to send message to editor')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.paper_id) {
      const paper = papers.find(p => p.id === notification.paper_id)
      if (paper) {
        setSelectedPaper(paper)
      }
    }

    if (!notification.is_read) {
      try {
        const result = await markNotificationRead(notification.id)
        if (result.success) {
          setNotifications(notifications.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          ))
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read)
      await Promise.all(unread.map(n => markNotificationRead(n.id)))
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} title="Admin Panel" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600">System Overview</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Papers</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{papers.length}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Ready for approval</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-900/50">
                    <h3 className="font-medium text-green-900 dark:text-green-100">Avg Review Score</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {papers.length > 0 ? getAverageScore(papers.flatMap(p => p.reviews)) : '0'}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">Across all papers</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900/50">
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">Total Reviews</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {papers.reduce((acc, paper) => acc + paper.reviews.length, 0)}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Completed reviews</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600">Paper Approval</h2>
              </div>
              <div className="p-6">
                {papers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No papers pending approval</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {papers.map(paper => (
                      <div
                        key={paper.id}
                        id={`paper-${paper.id}`}
                        onClick={() => setSelectedPaper(paper)}
                        className="border dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold dark:text-white group-hover:text-red-600 transition-colors">{paper.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Author: {paper.author_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Submitted: {new Date(paper.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {paper.reviews.length} Review{paper.reviews.length !== 1 ? 's' : ''}
                            </span>
                            <p className="text-lg font-bold text-blue-600">
                              {paper.reviews.length > 0 ? `${getAverageScore(paper.reviews)}/5` : 'No Rating'}
                            </p>
                          </div>
                        </div>

                        {paper.abstract && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{paper.abstract}</p>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <p className="text-sm font-medium mb-2 dark:text-white">Review Summary:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {paper.reviews.length > 0 ? getRecommendationSummary(paper.reviews) : 'No reviews submitted yet.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Editor Section */}
          </div>

          <div className="space-y-6 sticky top-6">
            {/* Notifications Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-red-600 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </h2>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="p-6">
                {notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${notification.is_read
                          ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                          : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 ring-1 ring-red-100 dark:ring-red-900/20'
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                            {notification.message}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-red-600 rounded-full mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Editor Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Editor
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={contactEditor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Paper (Required)
                    </label>
                    <select
                      value={editorContactForm.paperId}
                      onChange={(e) => setEditorContactForm({ ...editorContactForm, paperId: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      required
                    >
                      <option value="">Choose a paper...</option>
                      {papers.map(paper => (
                        <option key={paper.id} value={paper.id}>
                          {paper.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Message will be sent to the editor who reviewed this paper
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message to Editor
                    </label>
                    <textarea
                      value={editorContactForm.message}
                      onChange={(e) => setEditorContactForm({ ...editorContactForm, message: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Enter your message to the editor..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Editor
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paper Details Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-red-600">Paper Details</h2>
              <button onClick={() => setSelectedPaper(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">{selectedPaper.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Author:</span> {selectedPaper.author_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedPaper.author_email}</p>
                  <p><span className="font-medium">Submitted:</span> {new Date(selectedPaper.created_at).toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span> <span className="capitalize">{selectedPaper.status.replace(/_/g, ' ')}</span></p>
                </div>
              </div>

              {selectedPaper.abstract && (
                <div>
                  <h4 className="font-semibold dark:text-white mb-2">Abstract</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg leading-relaxed">
                    {selectedPaper.abstract}
                  </p>
                </div>
              )}

              {selectedPaper.file_url && (
                <div>
                  <h4 className="font-semibold dark:text-white mb-2">Manuscript</h4>
                  <a
                    href={selectedPaper.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Paper
                  </a>
                </div>
              )}

              <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold dark:text-white mb-4">Reviews & Ratings</h4>
                {selectedPaper.reviews.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">No reviews submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedPaper.reviews.map((review, index) => (
                      <div key={review.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-red-600">Reviewer {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium dark:text-white">Rating: {review.rating}/5</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${review.recommendation === 'accept' ? 'bg-green-100 text-green-800' :
                              review.recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                              {review.recommendation.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.comments}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    handlePublicationDecision(selectedPaper.id, false)
                    setSelectedPaper(null)
                  }}
                  className="px-6 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium"
                >
                  Reject Paper
                </button>
                <button
                  onClick={() => {
                    handlePublicationDecision(selectedPaper.id, true)
                    setSelectedPaper(null)
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Publish Paper
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
