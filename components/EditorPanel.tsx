'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Upload, Edit, Clock, X, MessageSquare, Send, Newspaper, Plus } from 'lucide-react'
import { User, Paper, Review, News, getPapers, getReviews, createReview, updatePaper, updatePaperDetails, uploadFile, recommendPaperForPublication, sendMessage, getAdminUser, createNotification, getNews, createNews, updateNews, deleteNews, publishNews } from '@/lib/api'
import Header from './Header'

interface EditorPanelProps {
  user: User
  onLogout: () => void
}

export default function EditorPanel({ user, onLogout }: EditorPanelProps) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null)
  const [editForm, setEditForm] = useState({ title: '', abstract: '', file: null as File | null })
  const [reviewData, setReviewData] = useState({ rating: 5, comments: '', recommendation: 'accept' as const })
  const [feedbackForm, setFeedbackForm] = useState({ paperId: '', message: '' })
  const [adminContactForm, setAdminContactForm] = useState({ paperId: '', message: '' })
  const [adminUserId, setAdminUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Paper Details Submission State
  const [detailsPaper, setDetailsPaper] = useState<Paper | null>(null)
  const [detailsForm, setDetailsForm] = useState({
    institution_code: '',
    publication_isced_band: '',
    publication_title_amharic: '',
    title: '',
    publication_date: '',
    publication_type: '',
    journal_type: '',
    journal_name: '',
    indigenous_knowledge: false
  })

  // News state
  const [news, setNews] = useState<News[]>([])
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Research'
  })

  useEffect(() => {
    fetchData()
    fetchAdminUser()
  }, [])

  const fetchData = async () => {
    try {
      const papersResult = await getPapers()
      const reviewsResult = await getReviews()
      const newsResult = await getNews()

      if (papersResult.success && papersResult.data) {
        // Filter submitted papers (don't filter out reviewed ones)
        const submittedPapers = papersResult.data.filter((paper: Paper) =>
          paper.status === 'submitted' || paper.status === 'under_review' || paper.status === 'recommended_for_publication'
        )
        setPapers(submittedPapers)
      }

      if (reviewsResult.success && reviewsResult.data) {
        setReviews(reviewsResult.data)
      }

      if (newsResult.success && newsResult.data) {
        setNews(newsResult.data)
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }
  const fetchAdminUser = async () => {
    try {
      const result = await getAdminUser()
      if (result.success && result.data) {
        setAdminUserId(result.data.id)
      }
    } catch (error) {
      console.error('Failed to fetch admin user:', error)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPaper && reviewData.rating && reviewData.comments) {
      try {
        const reviewDataSubmit = {
          paper_id: selectedPaper.id,
          reviewer_id: user.id,
          rating: reviewData.rating,
          comments: reviewData.comments,
          recommendation: reviewData.recommendation
        }

        const result = await createReview(reviewDataSubmit)
        if (result.success) {
          // Update papers list to remove reviewed paper
          setPapers(papers.filter(p => p.id !== selectedPaper.id))
          setSelectedPaper(null)
          setReviewData({ rating: 5, comments: '', recommendation: 'accept' })
        }
      } catch (error) {
        console.error('Failed to submit review:', error)
      }
    }
  }

  const handleEditClick = (paper: Paper) => {
    setEditingPaper(paper)
    setEditForm({ title: paper.title, abstract: paper.abstract || '', file: null })
  }

  const handleDetailsClick = (paper: Paper) => {
    setDetailsPaper(paper)
    setDetailsForm({
      institution_code: paper.institution_code || '',
      publication_isced_band: paper.publication_isced_band || '',
      publication_title_amharic: paper.publication_title_amharic || '',
      title: paper.title || '',
      publication_date: paper.publication_date ? new Date(paper.publication_date).toISOString().split('T')[0] : '',
      publication_type: paper.publication_type || '',
      journal_type: paper.journal_type || '',
      journal_name: paper.journal_name || '',
      indigenous_knowledge: paper.indigenous_knowledge || false
    })
  }

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detailsPaper) return

    try {
      const updates = {
        ...detailsForm,
        title: detailsForm.title,
        status: detailsPaper.status,
        publication_date: detailsForm.publication_date ? new Date(detailsForm.publication_date).toISOString() : undefined
      }

      const result = await updatePaperDetails(detailsPaper.id, updates)
      if (result.success && result.data) {
        setPapers(papers.map(p => p.id === detailsPaper.id ? result.data! : p))
        setDetailsPaper(null)
        alert('Paper details updated successfully!')
      } else {
        alert('Failed to update paper details: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to update paper details:', error)
      alert('Failed to update paper details')
    }
  }

  const handleUpdatePaper = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPaper) return

    try {
      let fileUrl = editingPaper.file_url
      if (editForm.file) {
        const uploadResult = await uploadFile(editForm.file)
        if (uploadResult.success && uploadResult.data) {
          fileUrl = uploadResult.data.url
        }
      }

      const updates = {
        title: editForm.title,
        abstract: editForm.abstract,
        file_url: fileUrl,
        status: editingPaper.status
      }

      const result = await updatePaper(editingPaper.id, updates)
      if (result.success && result.data) {
        setPapers(papers.map(p => p.id === editingPaper.id ? result.data! : p))
        setEditingPaper(null)
      }
    } catch (error) {
      console.error('Failed to update paper:', error)
    }
  }



  const sendFeedbackToAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackForm.paperId || !feedbackForm.message) return

    try {
      const paper = papers.find(p => p.id === feedbackForm.paperId)
      if (!paper) return

      await sendMessage(
        paper.author_id,
        `Feedback on "${paper.title}": ${feedbackForm.message}`
      )

      setFeedbackForm({ paperId: '', message: '' })
      alert('Feedback sent to author successfully!')
    } catch (error) {
      console.error('Failed to send feedback:', error)
      alert('Failed to send feedback')
    }
  }

  const contactAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminContactForm.message) return

    try {
      let targetAdminId = adminUserId

      // If admin ID is missing, try to fetch it again
      if (!targetAdminId) {
        const adminResult = await getAdminUser()
        if (adminResult.success && adminResult.data) {
          targetAdminId = adminResult.data.id
          setAdminUserId(targetAdminId)
        } else {
          alert('Admin user not available. Please try again later.')
          return
        }
      }

      let messageContent = `Editor Message: ${adminContactForm.message}`
      let paperId: string | undefined = undefined

      // If a paper is selected, include paper info
      if (adminContactForm.paperId) {
        const paper = papers.find(p => p.id === adminContactForm.paperId)
        if (paper) {
          messageContent = `Editor Message regarding "${paper.title}": ${adminContactForm.message}`
          paperId = paper.id
        }
      }

      // Create notification for admin
      const result = await createNotification(
        targetAdminId,
        messageContent,
        paperId
      )

      if (result.success) {
        setAdminContactForm({ paperId: '', message: '' })
        alert('Notification sent to admin successfully!')
      } else {
        alert('Failed to send notification: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to contact admin:', error)
      alert('Failed to send notification to admin')
    }
  }

  const getPaperStatus = (paper: Paper) => {
    const existingReview = reviews.find(r => r.paper_id === paper.id && r.reviewer_id === user.id)
    return existingReview ? 'reviewed' : 'pending'
  }

  const getExistingReview = (paper: Paper) => {
    return reviews.find(r => r.paper_id === paper.id && r.reviewer_id === user.id)
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'accept': return 'bg-green-100 text-green-800'
      case 'minor_revision': return 'bg-yellow-100 text-yellow-800'
      case 'major_revision': return 'bg-orange-100 text-orange-800'
      case 'reject': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRecommendation = (recommendation: string) => {
    return recommendation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // News handlers
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createNews(newsForm)
      if (result.success && result.data) {
        setNews([result.data, ...news])
        setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
        setShowNewsForm(false)
      }
    } catch (error) {
      console.error('Failed to create news:', error)
    }
  }

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNews) return

    try {
      const result = await updateNews(editingNews.id, newsForm)
      if (result.success && result.data) {
        setNews(news.map(n => n.id === editingNews.id ? result.data! : n))
        setEditingNews(null)
        setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
        setShowNewsForm(false)
      }
    } catch (error) {
      console.error('Failed to update news:', error)
    }
  }

  const handlePublishNews = async (id: string) => {
    try {
      const result = await publishNews(id)
      if (result.success && result.data) {
        setNews(news.map(n => n.id === id ? result.data! : n))
      }
    } catch (error) {
      console.error('Failed to publish news:', error)
    }
  }

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news post?')) return

    try {
      const result = await deleteNews(id)
      if (result.success) {
        setNews(news.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete news:', error)
    }
  }

  const handleEditNewsClick = (newsItem: News) => {
    setEditingNews(newsItem)
    setNewsForm({
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category
    })
    setShowNewsForm(true)
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading editor panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} title="Editor Panel" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600">Papers for Review</h2>
              </div>
              <div className="p-6">
                {papers.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No papers assigned for review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {papers.map(paper => {
                      const status = getPaperStatus(paper)
                      const existingReview = getExistingReview(paper)

                      return (
                        <div key={paper.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold dark:text-white">{paper.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Author: {paper.author_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Email: {paper.author_email || 'Unknown'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted: {new Date(paper.created_at).toLocaleDateString()}</p>
                              {paper.abstract && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{paper.abstract}</p>
                              )}
                              {paper.publication_id && (
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-2">Publication ID: {paper.publication_id}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${status === 'reviewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </span>
                          </div>

                          {existingReview && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-medium dark:text-white">Rating: {existingReview.rating}/5</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{existingReview.comments}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${getRecommendationColor(existingReview.recommendation)}`}>
                                  {formatRecommendation(existingReview.recommendation)}
                                </span>
                              </div>
                            </div>
                          )}



                          <div className="mt-3 flex space-x-2">
                            {status === 'pending' && (
                              <button
                                onClick={() => setSelectedPaper(paper)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Review
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(paper)}
                              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDetailsClick(paper)}
                              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors text-sm flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Edit Details
                            </button>
                            {paper.file_url && (
                              <a
                                href={paper.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 sticky top-24">
            {selectedPaper && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-red-600">Review: {selectedPaper.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Author: {selectedPaper.author_name || 'Unknown'}</p>
                </div>
                <div className="p-6">
                  {selectedPaper.abstract && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Abstract</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">{selectedPaper.abstract}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating (1-5)
                      </label>
                      <select
                        id="rating"
                        value={reviewData.rating}
                        onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommendation
                      </label>
                      <select
                        id="recommendation"
                        value={reviewData.recommendation}
                        onChange={(e) => setReviewData({ ...reviewData, recommendation: e.target.value as any })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="accept">Recommend Acceptance</option>
                        <option value="minor_revision">Minor Revision</option>
                        <option value="major_revision">Major Revision</option>
                        <option value="reject">Recommend Rejection</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comments
                      </label>
                      <textarea
                        id="comments"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md min-h-[120px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        value={reviewData.comments}
                        onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                        placeholder="Provide detailed feedback..."
                        required
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Submit Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPaper(null)}
                        className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Feedback for Author Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Send Feedback to Author
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={sendFeedbackToAuthor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Paper
                    </label>
                    <select
                      value={feedbackForm.paperId}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, paperId: e.target.value })}
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Feedback Message
                    </label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Enter your feedback for the author..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Admin Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Admin
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={contactAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Paper (Optional)
                    </label>
                    <select
                      value={adminContactForm.paperId}
                      onChange={(e) => setAdminContactForm({ ...adminContactForm, paperId: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="">General message (no specific paper)</option>
                      {papers.map(paper => (
                        <option key={paper.id} value={paper.id}>
                          {paper.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message to Admin
                    </label>
                    <textarea
                      value={adminContactForm.message}
                      onChange={(e) => setAdminContactForm({ ...adminContactForm, message: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Enter your message to the admin..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Admin
                  </button>
                </form>
              </div>
            </div>

            {/* News Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-semibold text-red-600">News Management</h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNews(null)
                      setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
                      setShowNewsForm(true)
                    }}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
              <div className="p-6">
                {news.length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No news posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map(item => (
                      <div key={item.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full font-medium">
                                {item.category}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.status === 'published'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                }`}>
                                {item.status === 'published' ? '✓ Posted' : '○ Draft'}
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 line-clamp-1">{item.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{item.summary}</p>
                          </div>
                          <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                            {item.status !== 'published' && (
                              <button
                                onClick={() => handlePublishNews(item.id)}
                                className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded hover:bg-green-700 transition-colors font-medium"
                              >
                                Post
                              </button>
                            )}
                            <button
                              onClick={() => handleEditNewsClick(item)}
                              className="flex-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNews(item.id)}
                              className="flex-1 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                            >
                              Delete
                            </button>
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

      {/* Modals */}
      {editingPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">Edit Paper</h2>
              <button onClick={() => setEditingPaper(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdatePaper} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Abstract</label>
                  <textarea
                    value={editForm.abstract}
                    onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
                    rows={6}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Revised Version</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setEditForm({ ...editForm, file })
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingPaper(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Paper Details Modal */}
      {detailsPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">Publication Details: {detailsPaper.title}</h2>
              <button onClick={() => setDetailsPaper(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateDetails} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Institution Code</label>
                  <select
                    value={detailsForm.institution_code}
                    onChange={(e) => setDetailsForm({ ...detailsForm, institution_code: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  >
                    <option value="">Select Institution</option>
                    <option value="SMU">St. Mary's University (SMU)</option>
                    {/* Add more options as needed */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication ID</label>
                  <input
                    type="text"
                    value={detailsPaper.publication_id || 'Auto-generated upon save'}
                    disabled
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-500 rounded-md cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">ID will be generated automatically if empty.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ISCED Band</label>
                  <select
                    value={detailsForm.publication_isced_band}
                    onChange={(e) => setDetailsForm({ ...detailsForm, publication_isced_band: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  >
                    <option value="">Select Band</option>
                    <option value="Band 1">Band 1</option>
                    <option value="Band 2">Band 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication Title (English)</label>
                  <input
                    type="text"
                    value={detailsForm.title}
                    onChange={(e) => setDetailsForm({ ...detailsForm, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="Enter English Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication Title (Amharic)</label>
                  <input
                    type="text"
                    value={detailsForm.publication_title_amharic}
                    onChange={(e) => setDetailsForm({ ...detailsForm, publication_title_amharic: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="Enter Amharic Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication Date</label>
                  <input
                    type="date"
                    value={detailsForm.publication_date}
                    onChange={(e) => setDetailsForm({ ...detailsForm, publication_date: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication Type</label>
                  <select
                    value={detailsForm.publication_type}
                    onChange={(e) => setDetailsForm({ ...detailsForm, publication_type: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="Journal Article">Journal Article</option>
                    <option value="Conference Proceeding">Conference Proceeding</option>
                    <option value="Book Chapter">Book Chapter</option>
                    <option value="Thesis">Thesis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal Type</label>
                  <select
                    value={detailsForm.journal_type}
                    onChange={(e) => setDetailsForm({ ...detailsForm, journal_type: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  >
                    <option value="">Select Journal Type</option>
                    <option value="International">International</option>
                    <option value="National">National</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal Name</label>
                  <input
                    type="text"
                    value={detailsForm.journal_name}
                    onChange={(e) => setDetailsForm({ ...detailsForm, journal_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="Enter Journal Name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detailsForm.indigenous_knowledge}
                      onChange={(e) => setDetailsForm({ ...detailsForm, indigenous_knowledge: e.target.checked })}
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Indigenous Knowledge</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setDetailsPaper(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* News Form Modal */}
      {showNewsForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">
                {editingNews ? 'Edit News Post' : 'Create News Post'}
              </h2>
              <button
                onClick={() => {
                  setShowNewsForm(false)
                  setEditingNews(null)
                  setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter news title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="Research">Research</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Policy">Policy</option>
                    <option value="Event">Event</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newsForm.summary}
                    onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Brief summary (will be shown in the news feed)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    rows={8}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Full news content"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewsForm(false)
                      setEditingNews(null)
                      setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
                    }}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    {editingNews ? 'Update News' : 'Create News'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
