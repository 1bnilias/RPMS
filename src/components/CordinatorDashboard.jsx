import React, { useState } from 'react'
import { Calendar } from 'lucide-react'

function CoordinatorDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([
    { id: 1, title: 'Annual Research Symposium', startDate: '2024-03-15', endDate: '2024-03-17', venue: 'Main Auditorium', participants: 45 },
    { id: 2, title: 'AI Workshop', startDate: '2024-02-20', endDate: '2024-02-20', venue: 'Tech Lab', participants: 25 }
  ])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', startDate: '', endDate: '', venue: '' })

  const handleCreateEvent = (e) => {
    e.preventDefault()
    if (newEvent.title && newEvent.startDate && newEvent.endDate && newEvent.venue) {
      const event = {
        id: events.length + 1,
        ...newEvent,
        participants: 0
      }
      setEvents([...events, event])
      setNewEvent({ title: '', startDate: '', endDate: '', venue: '' })
      setShowEventForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">RPMS - Event Coordinator</h1>
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
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-red-600">Events</h2>
            <button
              onClick={() => setShowEventForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Create Event
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(event => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold mb-2">{event.title}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Start:</strong> {event.startDate}</p>
                    <p><strong>End:</strong> {event.endDate}</p>
                    <p><strong>Venue:</strong> {event.venue}</p>
                    <p><strong>Participants:</strong> {event.participants}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showEventForm && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-red-600">Create New Event</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    id="eventTitle"
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Enter event title"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue
                  </label>
                  <input
                    id="venue"
                    type="text"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})}
                    placeholder="Enter venue"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
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
  )
}

export default CoordinatorDashboard
