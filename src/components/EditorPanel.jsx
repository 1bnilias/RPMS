import React, { useState } from 'react'
import { FileText } from 'lucide-react'

function EditorPanel({ user, onLogout }) {
  const [assignedPapers, setAssignedPapers] = useState([
    { id: 1, title: 'Machine Learning in Healthcare', author: 'Dr. John Smith', submissionDate: '2024-01-15', reviewed: false },
    { id: 2, title: 'Quantum Computing Applications', author: 'Dr. Jane Doe', submissionDate: '2024-01-12', reviewed: true, score: 8, feedback: 'Excellent research methodology' }
  ])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [reviewData, setReviewData] = useState({ score: '', feedback: '' })

  const handleSubmitReview = (e) => {
    e.preventDefault()
    if (selectedPaper && reviewData.score && reviewData.feedback) {
      setAssignedPapers(papers => papers.map(paper => 
        paper.id === selectedPaper.id 
          ? { ...paper, reviewed: true, score: parseInt(reviewData.score), feedback: reviewData.feedback }
          : paper
      ))
      setSelectedPaper(null)
      setReviewData({ score: '', feedback: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">RPMS - Editor Panel</h1>
              <p className="text-red-100">Welcome, {user.name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-white text-red-600 bg-white rounded-md hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-red-600">Assigned Papers</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {assignedPapers.map(paper => (
                  <div key={paper.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{paper.title}</h3>
                        <p className="text-sm text-gray-600">Author: {paper.author}</p>
                        <p className="text-sm text-gray-600">Submitted: {paper.submissionDate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        paper.reviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {paper.reviewed ? 'Reviewed' : 'Pending'}
                      </span>
                    </div>
                    {paper.reviewed && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm"><strong>Score:</strong> {paper.score}/10</p>
                        <p className="text-sm"><strong>Feedback:</strong> {paper.feedback}</p>
                      </div>
                    )}
                    {!paper.reviewed && (
                      <button 
                        onClick={() => setSelectedPaper(paper)}
                        className="mt-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Review Paper
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedPaper && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-red-600">Review: {selectedPaper.title}</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                      Score (1-10)
                    </label>
                    <select
                      id="score"
                      value={reviewData.score}
                      onChange={(e) => setReviewData({...reviewData, score: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select score</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num.toString()}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback
                    </label>
                    <textarea
                      id="feedback"
                      className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                      placeholder="Provide detailed feedback..."
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
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
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
    </div>
  )
}

export default EditorPanel
