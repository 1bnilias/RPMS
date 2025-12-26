'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BookOpen } from 'lucide-react'
import { User, Paper, createPaper, getPapers, uploadFile } from '@/lib/api'
import Header from './Header'

interface AuthorDashboardProps {
  user: User
  onLogout: () => void
}

export default function AuthorDashboard({ user, onLogout }: AuthorDashboardProps) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [newPaper, setNewPaper] = useState<{ title: string, abstract: string, type: string, file: File | null }>({ title: '', abstract: '', type: 'Research Paper', file: null })
  const [loading, setLoading] = useState(true)
  const submissionFormRef = useRef<HTMLDivElement>(null)

  const fetchPapers = useCallback(async () => {
    try {
      const result = await getPapers()
      if (result.success && result.data) {
        // Filter papers for current author
        const authorPapers = result.data.filter((paper: any) =>
          paper.author_id === user.id
        )
        setPapers(authorPapers)
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchPapers()
  }, [fetchPapers])

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
        type: newPaper.type
      }

      const result = await createPaper(paperData)
      if (result.success && result.data) {
        setPapers([result.data, ...papers])
        setNewPaper({ title: '', abstract: '', type: 'Research Paper', file: null })
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

      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">My Papers</h2>
              <button
                onClick={() => {
                  setShowSubmissionForm(true)
                  setTimeout(() => {
                    submissionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Submit New Paper
              </button>
            </div>
            <div className="p-6">
              {papers.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No papers submitted yet</p>
                  <button
                    onClick={() => {
                      setShowSubmissionForm(true)
                      setTimeout(() => {
                        submissionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
                    }}
                    className="mt-4 text-red-600 hover:text-red-700 font-medium"
                  >
                    Submit your first paper
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {papers.map(paper => (
                    <div key={paper.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold dark:text-white">{paper.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Created: {new Date(paper.created_at).toLocaleDateString()}</p>
                          {paper.abstract && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{paper.abstract}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(paper.status)}`}>
                          {formatStatus(paper.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showSubmissionForm && (
            <div ref={submissionFormRef} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600">Submit New Paper</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmitPaper} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paper Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={newPaper.title}
                      onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                      placeholder="Enter paper title"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Abstract
                    </label>
                    <textarea
                      id="abstract"
                      value={newPaper.abstract}
                      onChange={(e) => setNewPaper({ ...newPaper, abstract: e.target.value })}
                      placeholder="Enter paper abstract"
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paper Type
                    </label>
                    <select
                      id="type"
                      value={newPaper.type}
                      onChange={(e) => setNewPaper({ ...newPaper, type: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Research Paper">Research Paper</option>
                      <option value="Thesis">Thesis</option>
                      <option value="Review">Review</option>
                      <option value="Case Study">Case Study</option>
                      <option value="Methodology">Methodology</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paper File (PDF, DOC, DOCX)
                    </label>
                    <input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setNewPaper({ ...newPaper, file })
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Create Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubmissionForm(false)}
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirm Submission</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to submit this paper? Please verify all details and the attached file before proceeding.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
