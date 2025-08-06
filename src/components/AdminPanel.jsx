import React, { useState } from 'react'
import { Users } from 'lucide-react'

function AdminPanel({ user, onLogout }) {
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. John Smith', email: 'author@smu.edu', role: 'author' },
    { id: 2, name: 'Dr. Sarah Johnson', email: 'editor@smu.edu', role: 'editor' },
    { id: 3, name: 'Event Coordinator', email: 'coordinator@smu.edu', role: 'coordinator' }
  ])
  const [pendingPapers, setPendingPapers] = useState([
    { id: 1, title: 'Machine Learning in Healthcare', author: 'Dr. John Smith', score: 8, feedback: 'Excellent research' },
    { id: 2, title: 'Quantum Computing Applications', author: 'Dr. Jane Doe', score: 7, feedback: 'Good methodology' }
  ])

  const handleApproval = (paperId, approved) => {
    setPendingPapers(papers => papers.filter(paper => paper.id !== paperId))
    // In real app, this would update the database and create IP archive entry
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">RPMS - Admin Panel</h1>
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

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-red-600">User Management</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2">
                        <button className="text-sm border border-gray-300 px-3 py-1 rounded-md mr-2 hover:bg-gray-50 transition-colors">
                          Edit
                        </button>
                        <button className="text-sm border border-red-300 text-red-600 px-3 py-1 rounded-md hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-red-600">Paper Approval</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingPapers.map(paper => (
                <div key={paper.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{paper.title}</h3>
                      <p className="text-sm text-gray-600">Author: {paper.author}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-sm"><strong>Review Score:</strong> {paper.score}/10</p>
                    <p className="text-sm"><strong>Feedback:</strong> {paper.feedback}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproval(paper.id, true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleApproval(paper.id, false)}
                      className="border border-red-600 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
