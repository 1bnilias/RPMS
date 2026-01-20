'use client'

import { useState, useEffect } from 'react'
import { Users, MessageSquare, Send, X, FileText, Download, Bell, CheckCircle, AlertCircle } from 'lucide-react'
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
  const [selectedAuthor, setSelectedAuthor] = useState<Paper | null>(null)
  const [showAuthorModal, setShowAuthorModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'reviewed' | 'validated'>('reviewed')

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
        // Get all papers with their reviews
        const papersWithReviews = papersResult.data.map((paper: Paper) => {
          const paperReviews = reviewsResult.data?.filter((review: Review) =>
            review.paper_id === paper.id
          ) || []

          return {
            ...paper,
            reviews: paperReviews
          }
        })

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

  // Categorize papers by status
  const pendingPapers = papers.filter(paper =>
    paper.status === 'submitted' || paper.status === 'under_review' || paper.status === 'recommended_for_publication'
  )
  const approvedPapers = papers.filter(paper => paper.status === 'approved')
  const rejectedPapers = papers.filter(paper => paper.status === 'rejected')

  const handlePublicationDecision = async (paperId: string, status: 'approved' | 'rejected' | 'published') => {
    const paper = papers.find(p => p.id === paperId)
    if (!paper) return

    try {
      const result = await updatePaper(paperId, {
        ...paper,
        status: status
      })

      if (result.success) {
        // Refresh the papers list to show updated status
        fetchData()
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

            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('reviewed')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'reviewed'
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                Reviewed Papers
              </button>
              <button
                onClick={() => setActiveTab('validated')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'validated'
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                Validated Papers
              </button>
            </div>

            {/* Content Area */}
            {activeTab === 'reviewed' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-yellow-600">Pending Approval ({pendingPapers.length})</h2>
                </div>
                <div className="p-6">
                  {pendingPapers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No papers pending approval</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingPapers.map(paper => (
                        <div
                          key={paper.id}
                          id={`paper-${paper.id}`}
                          onClick={() => setSelectedPaper(paper)}
                          className="border dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold dark:text-white group-hover:text-red-600 transition-colors">{paper.title}</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAuthor(paper)
                                  setShowAuthorModal(true)
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:underline transition-colors text-left"
                              >
                                Author: {paper.author_name || 'Unknown'}
                              </button>
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
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-blue-600">Validated Papers</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">PI Name</th>
                        <th className="p-4">Institution</th>
                        <th className="p-4">Fiscal Year</th>
                        <th className="p-4">Budget</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {papers.filter(p => p.pi_name || p.institution_code).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">No validated papers found.</td>
                        </tr>
                      ) : (
                        papers.filter(p => p.pi_name || p.institution_code).map(paper => (
                          <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="p-4 font-medium text-gray-900 dark:text-white">{paper.title}</td>
                            <td className="p-4">{paper.pi_name || '-'}</td>
                            <td className="p-4">{paper.institution_code || '-'}</td>
                            <td className="p-4">{paper.fiscal_year || '-'}</td>
                            <td className="p-4">{paper.allocated_budget ? paper.allocated_budget.toLocaleString() : '-'}</td>
                            <td className="p-4 capitalize">{paper.status.replace(/_/g, ' ')}</td>
                            <td className="p-4">
                              <button
                                onClick={() => setSelectedPaper(paper)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6 sticky top-6">
            {/* Contact Editor Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-red-600" />
                  Contact Editor
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Send instructions or feedback to reviewers</p>
              </div>
              <div className="p-6">
                <form onSubmit={contactEditor} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-red-500" />
                      Select Paper (Required)
                    </label>
                    <select
                      value={editorContactForm.paperId}
                      onChange={(e) => setEditorContactForm({ ...editorContactForm, paperId: e.target.value })}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      required
                    >
                      <option value="">Choose a paper...</option>
                      {papers.map(paper => (
                        <option key={paper.id} value={paper.id}>
                          {paper.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      Message will be sent to the editor who reviewed this paper
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-red-500" />
                      Message to Editor
                    </label>
                    <textarea
                      value={editorContactForm.message}
                      onChange={(e) => setEditorContactForm({ ...editorContactForm, message: e.target.value })}
                      rows={4}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                      placeholder="Enter your message to the editor..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-600 transition-all flex items-center justify-center font-bold shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send to Editor
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Approved Papers Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-green-600">Approved Papers ({approvedPapers.length})</h2>
                </div>
                <div className="p-6">
                  {approvedPapers.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No approved papers</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvedPapers.map(paper => (
                        <div
                          key={paper.id}
                          onClick={() => setSelectedPaper(paper)}
                          className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 rounded-lg p-4 transition-all duration-300 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{paper.title}</h3>
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>{paper.author_name || 'Unknown'}</span>
                              <span>{new Date(paper.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected Papers Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-red-600">Rejected Papers ({rejectedPapers.length})</h2>
                </div>
                <div className="p-6">
                  {rejectedPapers.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No rejected papers</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rejectedPapers.map(paper => (
                        <div
                          key={paper.id}
                          onClick={() => setSelectedPaper(paper)}
                          className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg p-4 transition-all duration-300 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{paper.title}</h3>
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>{paper.author_name || 'Unknown'}</span>
                              <span>{new Date(paper.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  <button
                    onClick={() => {
                      setSelectedAuthor(selectedPaper)
                      setShowAuthorModal(true)
                    }}
                    className="hover:text-red-600 hover:underline transition-colors"
                  >
                    <span className="font-medium">Author:</span> {selectedPaper.author_name}
                  </button>
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

              {/* Research Details Section */}
              {(selectedPaper.pi_name || selectedPaper.institution_code) && (
                <div className="border-t dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Research Project Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 border-b dark:border-gray-600 pb-1">Project Identification</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500 dark:text-gray-400">Institution Code:</span> <span className="dark:text-gray-200">{selectedPaper.institution_code || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Fiscal Year:</span> <span className="dark:text-gray-200">{selectedPaper.fiscal_year || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Research Type:</span> <span className="dark:text-gray-200">{selectedPaper.research_type || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Completion Status:</span> <span className="dark:text-gray-200">{selectedPaper.completion_status || '-'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 border-b dark:border-gray-600 pb-1">Principal Investigator</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="dark:text-gray-200">{selectedPaper.pi_name || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Gender:</span> <span className="dark:text-gray-200">{selectedPaper.pi_gender || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Co-Investigators:</span> <span className="dark:text-gray-200">{selectedPaper.co_investigators || '-'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 border-b dark:border-gray-600 pb-1">Budget & Funding</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500 dark:text-gray-400">Allocated Budget:</span> <span className="dark:text-gray-200">{selectedPaper.allocated_budget?.toLocaleString() || '0'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">External Budget:</span> <span className="dark:text-gray-200">{selectedPaper.external_budget?.toLocaleString() || '0'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">NRF Fund:</span> <span className="dark:text-gray-200">{selectedPaper.nrf_fund?.toLocaleString() || '0'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 border-b dark:border-gray-600 pb-1">Outcomes</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500 dark:text-gray-400">Benefited Industry:</span> <span className="dark:text-gray-200">{selectedPaper.benefited_industry || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Produced Prototype:</span> <span className="dark:text-gray-200">{selectedPaper.produced_prototype || '-'}</span></p>
                        <p><span className="text-gray-500 dark:text-gray-400">Submitted to Incubator:</span> <span className="dark:text-gray-200">{selectedPaper.submitted_to_incubator || '-'}</span></p>
                      </div>
                    </div>
                  </div>
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
                    handlePublicationDecision(selectedPaper.id, 'rejected')
                    setSelectedPaper(null)
                  }}
                  className="px-6 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handlePublicationDecision(selectedPaper.id, 'approved')
                    setSelectedPaper(null)
                  }}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handlePublicationDecision(selectedPaper.id, 'published')
                    setSelectedPaper(null)
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Author Detail Modal */}
      {showAuthorModal && selectedAuthor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xl">
                  {selectedAuthor.author_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAuthor.author_name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAuthor.author_email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthorModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author Type</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_author_type || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_author_category || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Rank</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_academic_rank || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qualification</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_qualification || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employment Type</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_employment_type || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Year</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedAuthor.author_academic_year || 'N/A'}</p>
                </div>
              </div>

              {selectedAuthor.author_bio && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedAuthor.author_bio}</p>
                </div>
              )}

              <div className="pt-6 border-t dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowAuthorModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hello ${selectedAuthor.author_name}, I am contacting you regarding your paper "${selectedAuthor.title}".`)
                    window.location.href = `/chat?userId=${selectedAuthor.author_id}&message=${message}`
                  }}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Author
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
