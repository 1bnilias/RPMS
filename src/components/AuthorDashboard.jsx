import React, { useState } from 'react'
import { BookOpen } from 'lucide-react'

function AuthorDashboard({ user, onLogout }) {
  const [papers, setPapers] = useState([
    { id: 1, title: 'Machine Learning in Healthcare', status: 'Under Review', submissionDate: '2024-01-15' },
    { id: 2, title: 'Sustainable Energy Solutions', status: 'Approved', submissionDate: '2024-01-10' }
  ])
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Paper "Machine Learning in Healthcare" is under review', timestamp: '2024-01-16 10:30' }
  ])
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [newPaper, setNewPaper] = useState({ title: '', keywords: '', file: null })

  const handleSubmitPaper = (e) => {
    e.preventDefault()
    if (newPaper.title && newPaper.keywords && newPaper.file) {
      const paper = {
        id: papers.length + 1,
        title: newPaper.title,
        status: 'Submitted',
        submissionDate: new Date().toISOString().split('T')[0]
      }
      setPapers([...papers, paper])
      setNotifications([...notifications, {
        id: notifications.length + 1,
        message: `Paper "${newPaper.title}" submitted successfully`,
        timestamp: new Date().toLocaleString()
      }])
      setNewPaper({ title: '', keywords: '', file: null })
      setShowSubmissionForm(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">RPMS - Author Dashboard</h1>
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

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">My Papers</h2>
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Submit New Paper
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {papers.map(paper => (
                  <div key={paper.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{paper.title}</h3>
                        <p className="text-sm text-gray-600">Submitted: {paper.submissionDate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(paper.status)}`}>
                        {paper.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showSubmissionForm && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-red-600">Submit New Paper</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmitPaper} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Paper Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={newPaper.title}
                      onChange={(e) => setNewPaper({...newPaper, title: e.target.value})}
                      placeholder="Enter paper title"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input
                      id="keywords"
                      type="text"
                      value={newPaper.keywords}
                      onChange={(e) => setNewPaper({...newPaper, keywords: e.target.value})}
                      placeholder="Enter keywords (comma separated)"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload PDF
                    </label>
                    <input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewPaper({...newPaper, file: e.target.files[0]})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Submit Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubmissionForm(false)}
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

        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-red-600">Notifications</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div key={notification.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthorDashboard
