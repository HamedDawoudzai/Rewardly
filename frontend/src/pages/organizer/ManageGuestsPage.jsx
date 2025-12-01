import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus, AlertCircle, CheckCircle, Calendar, MapPin, Coins } from 'lucide-react'
import { eventAPI } from '@/api/events'

const ManageGuestsPage = () => {
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [utorid, setUtorid] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const eventData = await eventAPI.getById(id)
      setEvent(eventData)
      setGuests(eventData.guests || [])
    } catch (err) {
      console.error('Failed to load event:', err)
      setError('Failed to load event. You may not have permission to manage this event.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = async (e) => {
    e.preventDefault()
    if (!utorid.trim()) {
      setError('Please enter a UTORid')
      return
    }

    setAdding(true)
    setError('')
    setSuccess('')

    try {
      await eventAPI.addGuest(id, utorid.trim())
      setSuccess(`Successfully added ${utorid} as a guest!`)
      setUtorid('')
      // Reload event to get updated guest list
      await loadEvent()
    } catch (err) {
      setError(err.message || 'Failed to add guest')
    } finally {
      setAdding(false)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isEventEnded = event && new Date(event.endsAt || event.endTime) < new Date()

  if (loading) {
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
          title="Manage Guests" 
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Events', href: '/organizer/events' },
            { label: 'Manage Guests' }
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
        title="Manage Guests" 
        subtitle={event.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Event Organizer' },
          { label: 'My Events', href: '/organizer/events' },
          { label: 'Manage Guests' }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(event.startsAt || event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {guests.length} guests
                {event.capacity && ` / ${event.capacity} capacity`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-rewardly-blue font-medium">
              <Coins className="h-4 w-4" />
              <span>{(event.pointsRemain || 0).toLocaleString()} pts remaining</span>
            </div>

            {isEventEnded && (
              <div className="p-3 bg-gray-100 rounded-lg text-gray-600 text-center mt-4">
                This event has ended
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Guest Form & Guest List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Guest Form */}
          {!isEventEnded && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-5 w-5" />
                  Add Guest
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    {success}
                  </div>
                )}

                <form onSubmit={handleAddGuest} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={utorid}
                      onChange={(e) => setUtorid(e.target.value)}
                      placeholder="Enter UTORid (e.g., johndoe1)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                      disabled={adding}
                    />
                  </div>
                  <Button type="submit" disabled={adding || !utorid.trim()}>
                    {adding ? 'Adding...' : 'Add Guest'}
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  Add a user to this event by their UTORid. They will be added as a confirmed guest.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Guest List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Guest List ({guests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guests.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Guests Yet"
                  description="No one has RSVP'd or been added to this event yet."
                />
              ) : (
                <div className="divide-y">
                  {guests.map((guest) => (
                    <div key={guest.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{guest.name}</p>
                        <p className="text-sm text-gray-500">@{guest.utorid}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ManageGuestsPage

