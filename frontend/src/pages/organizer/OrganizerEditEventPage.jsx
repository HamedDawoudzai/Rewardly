import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, AlertCircle, Info } from 'lucide-react'
import { eventAPI } from '@/api/events'

const OrganizerEditEventPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [event, setEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: ''
  })

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    setLoadingEvent(true)
    try {
      const eventData = await eventAPI.getById(id)
      setEvent(eventData)
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16)
      }
      
      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        location: eventData.location || '',
        startTime: formatDateForInput(eventData.startsAt || eventData.startTime),
        endTime: formatDateForInput(eventData.endsAt || eventData.endTime),
        capacity: eventData.capacity || ''
      })
    } catch (err) {
      console.error('Failed to load event:', err)
      setError('Failed to load event. You may not have permission to edit this event.')
    } finally {
      setLoadingEvent(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Please enter an event name')
      setLoading(false)
      return
    }
    if (!formData.location.trim()) {
      setError('Please enter a location')
      setLoading(false)
      return
    }

    try {
      // Organizers can only update name, description, location, and time (if event hasn't started)
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location,
      }

      // Only include time fields if event hasn't started
      const eventStarted = event && new Date(event.startsAt || event.startTime) <= new Date()
      if (!eventStarted) {
        if (formData.startTime) {
          updateData.startTime = new Date(formData.startTime).toISOString()
        }
        if (formData.endTime) {
          updateData.endTime = new Date(formData.endTime).toISOString()
        }
        if (formData.capacity) {
          updateData.capacity = parseInt(formData.capacity)
        }
      }

      await eventAPI.update(id, updateData)
      setSuccess('Event updated successfully!')
      setTimeout(() => navigate('/organizer/events'), 1500)
    } catch (err) {
      setError(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const eventStarted = event && new Date(event.startsAt || event.startTime) <= new Date()

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  if (!event) {
    return (
      <div>
        <PageHeader 
          title="Edit Event" 
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Events', href: '/organizer/events' },
            { label: 'Edit' }
          ]}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Event Not Found</h3>
            <p className="text-gray-600 mt-2">{error || 'Unable to load event details.'}</p>
            <Link to="/organizer/events">
              <Button className="mt-4">Back to My Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title="Edit Event" 
        subtitle={`Editing: ${event.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Event Organizer' },
          { label: 'My Events', href: '/organizer/events' },
          { label: 'Edit' }
        ]}
        actions={
          <Link to="/organizer/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        {/* Info banner about organizer permissions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Organizer Permissions</p>
            <p className="mt-1">As an organizer, you can edit the event name, description, and location. 
            {eventStarted 
              ? ' Since the event has started, you cannot change the date/time or capacity.'
              : ' You can also modify the date/time and capacity before the event starts.'}
            </p>
            <p className="mt-1">Points and publish status can only be changed by managers.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tech Workshop: React Basics"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Room BA1234, Bahen Centre"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time {eventStarted && <span className="text-gray-400">(locked)</span>}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent disabled:bg-gray-100"
                    disabled={loading || eventStarted}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time {eventStarted && <span className="text-gray-400">(locked)</span>}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent disabled:bg-gray-100"
                    disabled={loading || eventStarted}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity {eventStarted && <span className="text-gray-400">(locked)</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Unlimited"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent disabled:bg-gray-100"
                  disabled={loading || eventStarted}
                />
              </div>

              {/* Read-only info */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Event Info (Read-only)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Points Remaining:</span>
                    <span className="ml-2 font-medium text-rewardly-blue">
                      {(event.pointsRemain || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Points Awarded:</span>
                    <span className="ml-2 font-medium">
                      {(event.pointsAwarded || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 font-medium ${event.published ? 'text-green-600' : 'text-yellow-600'}`}>
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Guests:</span>
                    <span className="ml-2 font-medium">
                      {event.guests?.length || event.numGuests || 0}
                      {event.capacity && ` / ${event.capacity}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link to="/organizer/events" className="flex-1">
                  <Button variant="outline" className="w-full" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OrganizerEditEventPage

