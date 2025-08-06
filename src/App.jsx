import React, { useState, useEffect } from 'react'
import './App.css'
import LoginPage from './components/LoginPage'
import AuthorDashboard from './components/AuthorDashboard'
import EditorPanel from './components/EditorPanel'
import AdminPanel from './components/AdminPanel'
import CoordinatorDashboard from './components/CordinatorDashboard'

// Mock Firebase auth simulation
const mockUsers = {
  'author@smu.edu': { role: 'author', name: 'Dr. John Smith', id: 'auth1' },
  'editor@smu.edu': { role: 'editor', name: 'Dr. Sarah Johnson', id: 'edit1' },
  'admin@smu.edu': { role: 'admin', name: 'Admin User', id: 'admin1' },
  'coordinator@smu.edu': { role: 'coordinator', name: 'Event Coordinator', id: 'coord1' }
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (email, password, selectedRole) => {
    const user = mockUsers[email]
    if (user && user.role === selectedRole && password === 'password123') {
      setCurrentUser(user)
      localStorage.setItem('currentUser', JSON.stringify(user))
      return { success: true }
    } else {
      return { success: false, error: 'Invalid credentials or role mismatch' }
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  switch (currentUser.role) {
    case 'author':
      return <AuthorDashboard user={currentUser} onLogout={handleLogout} />
    case 'editor':
      return <EditorPanel user={currentUser} onLogout={handleLogout} />
    case 'admin':
      return <AdminPanel user={currentUser} onLogout={handleLogout} />
    case 'coordinator':
      return <CoordinatorDashboard user={currentUser} onLogout={handleLogout} />
    default:
      return <div>Invalid role</div>
  }
}

export default App
