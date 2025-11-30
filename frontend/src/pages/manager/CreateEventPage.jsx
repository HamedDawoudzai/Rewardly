import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react'
import { eventAPI } from '@/api/events'

const CreateEventPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(isEditMode)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: '',
    published: false
  })

  useEffect(() => {
    if (isEditMode) {
      loadEvent()
    }
  }, [id])

  const loadEvent = async () => {
    setLoadingEvent(true)
    try {
      const event = await eventAPI.getById(id)
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16)
      }
      
      // Calculate total points from remaining + awarded
      const totalPoints = (event.pointsRemain || 0) + (event.pointsAwarded || 0);
      
      setFormData({
        name: event.name || '',
        description: event.description || '',
        location: event.location || '',
        startTime: formatDateForInput(event.startsAt || event.startTime),
        endTime: formatDateForInput(event.endsAt || event.endTime),
        capacity: event.capacity || '',
        points: totalPoints || event.pointsPool || '',
        published: event.published || false
      })
    } catch (err) {
      console.error('Failed to load event:', err)
      setError('Failed to load event')
    } finally {
      setLoadingEvent(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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
    if (!formData.startTime) {
      setError('Please select a start time')
      setLoading(false)
      return
    }
    if (!formData.endTime) {
      setError('Please select an end time')
      setLoading(false)
      return
    }
    if (!formData.points || parseInt(formData.points) < 1) {
      setError('Please enter a points pool (minimum 1)')
      setLoading(false)
      return
    }

    try {
      const eventData = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        points: formData.points ? parseInt(formData.points) : 100,
        published: formData.published
      }

      if (isEditMode) {
        await eventAPI.update(id, eventData)
      } else {
        await eventAPI.create(eventData)
      }
      
      navigate('/manager/events')
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} event`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title={isEditMode ? 'Edit Event' : 'Create Event'} 
        subtitle={isEditMode ? 'Update event details' : 'Create a new event'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Events', href: '/manager/events' },
          { label: isEditMode ? 'Edit' : 'Create' }
        ]}
        actions={
          <Link to="/manager/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
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
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Pool *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Total points available to award to attendees</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 text-rewardly-blue focus:ring-rewardly-blue border-gray-300 rounded"
                  disabled={loading || (isEditMode && formData.published)}
                />
                <div>
                  <label htmlFor="published" className="text-sm font-medium text-gray-700">
                    {isEditMode && formData.published 
                      ? 'Published (cannot be unpublished)' 
                      : 'Publish immediately (visible to all users)'}
                  </label>
                  {!formData.published && (
                    <p className="text-xs text-gray-500">Once published, this cannot be undone</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link to="/manager/events" className="flex-1">
                  <Button variant="outline" className="w-full" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreateEventPage
