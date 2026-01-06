'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from 'lucide-react'
import { User, Event, getEvents, createEvent, updateEvent, deleteEvent, publishEvent } from '@/lib/api'
import Header from './Header'

interface CoordinatorDashboardProps {
  user: User
  onLogout: () => void
}

export default function CoordinatorDashboard({ user, onLogout }: CoordinatorDashboardProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState({ title: '', description: '', category: 'Other', date: '', location: '' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  const fetchEvents = useCallback(async () => {
    try {
      const result = await getEvents()
      if (result.success && result.data) {
        // Filter events for current coordinator
        const coordinatorEvents = result.data.filter((event: Event) =>
          event.coordinator_id === user.id
        )
        setEvents(coordinatorEvents)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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
    </div>
  )
}
