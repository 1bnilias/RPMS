'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, FileText, Edit, X, Newspaper, Plus, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { User, Event, Paper, News, getEvents, createEvent, updateEvent, deleteEvent, publishEvent, getPapers, updatePaperDetails, getNews, createNews, updateNews, deleteNews, publishNews } from '@/lib/api'
import Header from './Header'

interface CoordinatorDashboardProps {
  user: User
  onLogout: () => void
}

export default function CoordinatorDashboard({ user, onLogout }: CoordinatorDashboardProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState({ title: '', description: '', category: 'Other', date: '', location: '' })

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

  const [selectedAuthor, setSelectedAuthor] = useState<Paper | null>(null)
  const [showAuthorModal, setShowAuthorModal] = useState(false)

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const fetchData = useCallback(async () => {
    try {
      const [eventsResult, papersResult, newsResult] = await Promise.all([
        getEvents(),
        getPapers(),
        getNews()
      ])

      if (eventsResult.success && eventsResult.data) {
        const coordinatorEvents = eventsResult.data.filter((event: Event) =>
          event.coordinator_id === user.id
        )
        setEvents(coordinatorEvents)
      }

      if (papersResult.success && papersResult.data) {
        // Filter to show only approved papers
        const approvedPapers = papersResult.data.filter((paper: Paper) =>
          paper.status === 'approved'
        )
        setPapers(approvedPapers)
      }

      if (newsResult.success && newsResult.data) {
        setNews(newsResult.data)
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newEvent.title && newEvent.date) {
      const dateObj = new Date(newEvent.date)
      if (isNaN(dateObj.getTime())) {
        alert('Invalid date selected')
        return
      }

      try {
        const eventData = {
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
          date: dateObj.toISOString(),
          location: newEvent.location,
          coordinator_id: user.id
        }

        const result = await createEvent(eventData)
        if (result.success && result.data) {
          setEvents([result.data, ...events])
          setNewEvent({ title: '', description: '', category: 'Other', date: '', location: '' })
          setShowEventForm(false)
        }
      } catch (error) {
        console.error('Failed to create event:', error)
      }
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvent && newEvent.title && newEvent.date) {
      const dateObj = new Date(newEvent.date)
      if (isNaN(dateObj.getTime())) {
        alert('Invalid date selected')
        return
      }

      try {
        const result = await updateEvent(editingEvent.id, {
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
          date: dateObj.toISOString(),
          location: newEvent.location
        })

        if (result.success && result.data) {
          setEvents(events.map(event =>
            event.id === editingEvent.id ? result.data! : event
          ))
          setEditingEvent(null)
          setNewEvent({ title: '', description: '', category: 'Other', date: '', location: '' })
          setShowEventForm(false)
        }
      } catch (error) {
        console.error('Failed to update event:', error)
      }
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const result = await deleteEvent(eventId)
      if (result.success) {
        setEvents(events.filter(event => event.id !== eventId))
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const handlePublishEvent = async (eventId: string) => {
    try {
      const result = await publishEvent(eventId)
      if (result.success && result.data) {
        setEvents(events.map(event =>
          event.id === eventId ? result.data! : event
        ))
      }
    } catch (error) {
      console.error('Failed to publish event:', error)
    }
  }

  const handleCreateFromPaper = (paper: Paper, type: 'event' | 'news') => {
    if (type === 'event') {
      setNewEvent({
        title: paper.title,
        description: paper.abstract || '',
        category: 'Conference',
        date: '',
        location: ''
      })
      setShowEventForm(true)
    } else {
      setNewsForm({
        title: paper.title,
        summary: paper.abstract ? paper.abstract.substring(0, 150) + '...' : '',
        content: paper.abstract || '',
        category: 'Research'
      })
      setShowNewsForm(true)
    }
  }

  const startEditEvent = (event: Event) => {
    setEditingEvent(event)
    const dateStr = new Date(event.date).toISOString().slice(0, 16)

    setNewEvent({
      title: event.title,
      description: event.description || '',
      category: event.category || 'Other',
      date: dateStr,
      location: event.location || ''
    })
    setShowEventForm(true)
  }

  const cancelForm = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    setNewEvent({ title: '', description: '', category: 'Other', date: '', location: '' })
  }

  const getEventStatus = (eventDate: string) => {
    const today = new Date()
    const event = new Date(eventDate)

    if (event < today) return 'past'
    if (event.toDateString() === today.toDateString()) return 'today'
    return 'upcoming'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'past': return 'bg-gray-100 text-gray-800'
      case 'today': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} title="Coordinator Dashboard" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-red-600">Events</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              >
                <option value="All">All Categories</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Thesis Defense">Thesis Defense</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={() => setShowEventForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Create Event
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pb-0">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">Total Events</p>
                  <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100">{events.length}</h3>
                </div>
                <div className="p-2 bg-blue-200 dark:bg-blue-800/50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">Upcoming</p>
                  <h3 className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {events.filter(e => new Date(e.date) > new Date()).length}
                  </h3>
                </div>
                <div className="p-2 bg-green-200 dark:bg-green-800/50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Past Events</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {events.filter(e => new Date(e.date) <= new Date()).length}
                  </h3>
                </div>
                <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No events created yet</p>
                <button
                  onClick={() => setShowEventForm(true)}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  Create your first event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events
                  .filter(event => {
                    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
                    const matchesCategory = filterCategory === 'All' || event.category === filterCategory
                    return matchesSearch && matchesCategory
                  })
                  .map(event => {
                    const status = getEventStatus(event.date)
                    return (
                      <div key={event.id} className="group bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">{event.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[10px] font-semibold tracking-wide uppercase text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                                {event.category || 'Other'}
                              </span>
                              <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md ${event.status === 'published'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                {event.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-3 mb-4 flex-grow">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2.5 text-gray-400" />
                            {formatDate(event.date)}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <span className="w-4 h-4 mr-2.5 flex items-center justify-center text-gray-400">📍</span>
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t dark:border-gray-700 mt-auto">
                          {event.status !== 'published' && (
                            <button
                              onClick={() => handlePublishEvent(event.id)}
                              className="flex-1 text-xs font-medium bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => startEditEvent(event)}
                            className="flex-1 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="flex-1 text-xs font-medium border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* News Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-red-600">News & Updates</h2>
            <button
              onClick={() => setShowNewsForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Post News
            </button>
          </div>
          <div className="p-6">
            {news.length === 0 ? (
              <div className="text-center py-8">
                <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No news posted yet</p>
                <button
                  onClick={() => setShowNewsForm(true)}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  Create your first news post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map(item => (
                  <div key={item.id} className="group bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">{item.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] font-semibold tracking-wide uppercase text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                            {item.category || 'General'}
                          </span>
                          <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md ${item.status === 'published'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                            {item.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4 flex-grow">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t dark:border-gray-700 mt-auto">
                      {item.status !== 'published' && (
                        <button
                          onClick={() => handlePublishNews(item.id)}
                          className="flex-1 text-xs font-medium bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleEditNewsClick(item)}
                        className="flex-1 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="flex-1 text-xs font-medium border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Papers Section - Create News/Event from Paper */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-red-600">Papers Ready for Promotion</h2>
            <p className="text-sm text-gray-500 mt-1">Create events or news posts based on submitted papers.</p>
          </div>
          <div className="p-6">
            {papers.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No papers available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map(paper => (
                  <div key={paper.id} id={`paper-${paper.id}`} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-semibold dark:text-white text-lg">{paper.title}</h3>
                        <button
                          onClick={() => {
                            setSelectedAuthor(paper)
                            setShowAuthorModal(true)
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:underline transition-colors text-left"
                        >
                          Author: {paper.author_name || 'Unknown'}
                        </button>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            {paper.status.replace(/_/g, ' ')}
                          </span>
                          {paper.publication_id && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                              ID: {paper.publication_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleCreateFromPaper(paper, 'event')}
                          className="flex-1 md:flex-none bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Create Event
                        </button>
                        <button
                          onClick={() => handleCreateFromPaper(paper, 'news')}
                          className="flex-1 md:flex-none bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <Newspaper className="w-4 h-4 mr-2" />
                          Post News
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-red-600">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button onClick={cancelForm} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
                  <div>
                    <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title
                    </label>
                    <input
                      id="eventTitle"
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Enter event title"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      id="eventCategory"
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Conference">Conference</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Thesis Defense">Thesis Defense</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date & Time
                    </label>
                    <input
                      id="eventDate"
                      type="datetime-local"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      id="eventLocation"
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Enter event location"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="eventDescription"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Enter event description"
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* News Modal */}
        {showNewsForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Research">Research</option>
                      <option value="Academic">Academic</option>
                      <option value="Event">Event</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Summary
                    </label>
                    <textarea
                      value={newsForm.summary}
                      onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      rows={6}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewsForm(false)
                        setEditingNews(null)
                        setNewsForm({ title: '', summary: '', content: '', category: 'Research' })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
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
    </div>
  )
}
