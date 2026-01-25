'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, CheckCircle, Clock, AlertCircle, Bell, X, FileText, Plus, Calendar } from 'lucide-react'
import { User, Paper, Notification, createPaper, getPapers, uploadFile, getNotifications, markNotificationRead } from '@/lib/api'
import Header from './Header'

interface AuthorDashboardProps {
  user: User
  onLogout: () => void
}

export default function AuthorDashboard({ user, onLogout }: AuthorDashboardProps) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [newPaper, setNewPaper] = useState({
    title: '',
    abstract: '',
    type: 'Research Paper',
    publication_title_amharic: '',
    publication_isced_band: '1',
    publication_type: 'Journal Article',
    journal_type: 'International',
    journal_name: '',
    file: null as File | null
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await getPapers()
      if (result.success && result.data) {
        console.log('[AuthorDashboard] All papers from API:', result.data)
        console.log('[AuthorDashboard] Current user ID:', user.id)
        const authorPapers = result.data.filter((paper: any) =>
          paper.author_id === user.id
        )
        console.log('[AuthorDashboard] Filtered author papers:', authorPapers)
        setPapers(authorPapers)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle hash navigation for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash && hash.startsWith('#paper-')) {
        const paperId = hash.replace('#paper-', '')

        // Clear hash so it doesn't re-trigger
        window.history.replaceState(null, '', window.location.pathname + window.location.search)

        // Wait for render
        setTimeout(() => {
          const element = document.getElementById(`paper-${paperId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-2', 'ring-red-500')
            setTimeout(() => element.classList.remove('ring-2', 'ring-red-500'), 3000)
          }
        }, 100)
      }
    }

    // Check on mount and when papers load
    if (!loading && papers.length > 0) {
      handleHashChange()
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [loading, papers])

  const handleSubmitPaper = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPaper.title && newPaper.abstract && newPaper.file) {
      setShowConfirmation(true)
    }
  }

  const confirmSubmit = async () => {
    setShowConfirmation(false)
    try {
      // Upload file first
      const uploadResult = await uploadFile(newPaper.file)
      if (!uploadResult.success || !uploadResult.data) {
        console.error('Failed to upload file:', uploadResult.error)
        return
      }

      const paperData = {
        title: newPaper.title,
        abstract: newPaper.abstract,
        content: '',
        file_url: uploadResult.data.url,
        author_id: user.id,
        status: 'submitted' as const,
        type: newPaper.type,
        publication_title_amharic: newPaper.publication_title_amharic,
        publication_isced_band: newPaper.publication_isced_band,
        publication_type: newPaper.publication_type,
        journal_type: newPaper.journal_type,
        journal_name: newPaper.journal_name
      }

      const result = await createPaper(paperData)
      if (result.success && result.data) {
        setPapers([result.data, ...papers])
        setNewPaper({
          title: '',
          abstract: '',
          type: 'Research Paper',
          publication_title_amharic: '',
          publication_isced_band: '1',
          publication_type: 'Journal Article',
          journal_type: 'International',
          journal_name: '',
          file: null
        })
        setShowSubmissionForm(false)
      }
    } catch (error) {
      console.error('Failed to create paper:', error)
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'published': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} title="Author Dashboard" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Papers</p>
                <h3 className="text-2xl font-bold mt-1 dark:text-white">{papers.length}</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
                <h3 className="text-2xl font-bold mt-1 dark:text-white">
                  {papers.filter(p => p.status === 'published').length}
                </h3>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Under Review</p>
                <h3 className="text-2xl font-bold mt-1 dark:text-white">
                  {papers.filter(p => p.status === 'under_review' || p.status === 'submitted').length}
                </h3>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-red-600">My Papers</h2>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit New Paper
            </button>
          </div>
          <div className="p-6">
            {papers.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No papers submitted yet</p>
                <button
                  onClick={() => setShowSubmissionForm(true)}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  Submit your first paper
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map(paper => (
                  <div key={paper.id} id={`paper-${paper.id}`} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold dark:text-white">{paper.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(paper.created_at).toLocaleDateString()}
                          </p>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{paper.type || 'Research Paper'}</span>
                        </div>
                        {paper.abstract && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 line-clamp-2 leading-relaxed">{paper.abstract}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(paper.status)}`}>
                        {formatStatus(paper.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-red-600">Submit New Paper</h2>
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitPaper} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Publication Title (English)
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={newPaper.title}
                      onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                      placeholder="Enter the full title in English"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="title_amharic" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Publication Title (Amharic)
                    </label>
                    <input
                      id="title_amharic"
                      type="text"
                      value={newPaper.publication_title_amharic}
                      onChange={(e) => setNewPaper({ ...newPaper, publication_title_amharic: e.target.value })}
                      placeholder="የጽሁፉ ርዕስ በአማርኛ"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="abstract" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Abstract
                  </label>
                  <textarea
                    id="abstract"
                    value={newPaper.abstract}
                    onChange={(e) => setNewPaper({ ...newPaper, abstract: e.target.value })}
                    placeholder="Provide a brief summary of your research"
                    rows={4}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="journal_type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Journal Type
                    </label>
                    <select
                      id="journal_type"
                      value={newPaper.journal_type}
                      onChange={(e) => setNewPaper({ ...newPaper, journal_type: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    >
                      <option value="International">International</option>
                      <option value="National">National</option>
                      <option value="Local">Local</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pub_type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Publication Type
                    </label>
                    <select
                      id="pub_type"
                      value={newPaper.publication_type}
                      onChange={(e) => setNewPaper({ ...newPaper, publication_type: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    >
                      <option value="Journal Article">Journal Article</option>
                      <option value="Conference Paper">Conference Paper</option>
                      <option value="Book Chapter">Book Chapter</option>
                      <option value="Book">Book</option>
                      <option value="Thesis">Thesis</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="isced" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      ISCED Band
                    </label>
                    <select
                      id="isced"
                      value={newPaper.publication_isced_band}
                      onChange={(e) => setNewPaper({ ...newPaper, publication_isced_band: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    >
                      {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num.toString()}>Band {num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="journal_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Journal Name
                    </label>
                    <input
                      id="journal_name"
                      type="text"
                      value={newPaper.journal_name}
                      onChange={(e) => setNewPaper({ ...newPaper, journal_name: e.target.value })}
                      placeholder="Enter journal name"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="file" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Paper File (PDF, DOC, DOCX)
                    </label>
                    <div className="relative">
                      <input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setNewPaper({ ...newPaper, file })
                        }}
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="file"
                        className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-red-500 dark:hover:border-red-500 transition-all"
                      >
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {newPaper.file ? newPaper.file.name : 'Click to upload file'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-lg shadow-red-600/20"
                  >
                    Review Submission
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold">Confirm Submission</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to submit this paper? Please verify all details and the attached file before proceeding. This action will notify the editorial team.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={confirmSubmit}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-lg shadow-red-600/20"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
