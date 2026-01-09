'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, FileText, Edit, X } from 'lucide-react'
import { User, Event, Paper, getEvents, createEvent, updateEvent, deleteEvent, publishEvent, getPapers, updatePaperDetails } from '@/lib/api'
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

  // Paper Validation State
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

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const fetchData = useCallback(async () => {
    try {
      const [eventsResult, papersResult] = await Promise.all([
        getEvents(),
        getPapers()
      ])

      if (eventsResult.success && eventsResult.data) {
        // Filter events for current coordinator
        const coordinatorEvents = eventsResult.data.filter((event: Event) =>
          event.coordinator_id === user.id
        )
        setEvents(coordinatorEvents)
      }

      if (papersResult.success && papersResult.data) {
        // Coordinator sees papers that are recommended for publication or submitted?
        // Assuming they see all papers to validate details, or specifically those ready for validation.
        // Let's show papers that have some details filled or are in 'recommended_for_publication' status.
        setPapers(papersResult.data)
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
        }
      } catch (error) {
        console.error('Failed to update event:', error)
      }
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
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
        alert('Paper details validated/updated successfully!')
      } else {
        alert('Failed to update paper details: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to update paper details:', error)
      alert('Failed to update paper details')
    }
  }

  const startEditEvent = (event: Event) => {
    setEditingEvent(event)
    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pb-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Events</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{events.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Upcoming</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {events.filter(e => new Date(e.date) > new Date()).length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300">Past</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {events.filter(e => new Date(e.date) <= new Date()).length}
              </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                  .filter(event => {
                    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
                    const matchesCategory = filterCategory === 'All' || event.category === filterCategory
                    return matchesSearch && matchesCategory
                  })
                  .map(event => {
                    const status = getEventStatus(event.date)
                    return (
                      <div key={event.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg dark:text-white">{event.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full inline-block">
                                {event.category || 'Other'}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${event.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {event.status === 'published' ? 'Posted' : 'Draft'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-3">
                          <p className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(event.date)}
                          </p>
                          {event.location && (
                            <p className="flex items-center">
                              <span className="w-4 h-4 mr-2">📍</span>
                              {event.location}
                            </p>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{event.description}</p>
                        )}

                        <div className="flex space-x-2">
                          {event.status !== 'published' && (
                            <button
                              onClick={() => handlePublishEvent(event.id)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                            >
                              Post
                            </button>
                          )}
                          <button
                            onClick={() => startEditEvent(event)}
                            className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-sm border border-red-300 text-red-600 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
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



        {/* Papers Validation Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-red-600">Papers to Validate</h2>
          </div>
          <div className="p-6">
            {papers.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No papers assigned for validation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map(paper => (
                  <div key={paper.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold dark:text-white">{paper.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Author: {paper.author_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Submitted: {new Date(paper.created_at).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${paper.publication_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {paper.publication_id ? 'Details Added' : 'Pending Details'}
                          </span>
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
                      <button
                        onClick={() => handleDetailsClick(paper)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Validate Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paper Details Modal */}
        {detailsPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-red-600">Validate Publication Details: {detailsPaper.title}</h2>
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
                      Save & Validate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEventForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-red-600">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
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
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
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
    </div >
  )
}
