import { useParams, Link, useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, Users, Clock, Coins, User, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { eventAPI } from '@/api/events'
import { useAuth } from '@/context/AuthContext'

const EventDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [isRsvped, setIsRsvped] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)

  // Detect route context for proper navigation
  const isManagerRoute = location.pathname.startsWith('/manager/')
  const isOrganizerRoute = location.pathname.startsWith('/organizer/')
  
  const backLink = isManagerRoute ? '/manager/events' : isOrganizerRoute ? '/organizer/events' : '/events'
  const backLabel = isManagerRoute ? 'Manage Events' : isOrganizerRoute ? 'My Events' : 'Events'

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await eventAPI.getById(id)
      setEvent(response)
      setIsRsvped(response.isRsvped || response.userRsvp || false)
      
      // Check if current user is an organizer of this event
      const organizers = response.organizers || []
      const userIsOrganizer = organizers.some(org => org.utorid === user?.utorid)
      setIsOrganizer(userIsOrganizer)
    } catch (err) {
      console.error('Failed to load event:', err)
      setError(err.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async () => {
    setRsvpLoading(true)
    try {
      if (isRsvped) {
        await eventAPI.cancelRsvp(id)
        setIsRsvped(false)
      } else {
        await eventAPI.rsvp(id)
        setIsRsvped(true)
      }
      // Reload event to get updated guest count
      await loadEvent()
    } catch (err) {
      console.error('Failed to update RSVP:', err)
      alert(err.message || 'Failed to update RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error || 'Event not found'}</p>
        <Link to={backLink}>
          <Button variant="outline">Back to {backLabel}</Button>
        </Link>
      </div>
    )
  }

  const startTime = event.startsAt || event.startTime
  const endTime = event.endsAt || event.endTime
  const numGuests = event.numGuests || event.guestCount || 0
  const pointsAwarded = event.pointsAwarded || event.pointsPool || 0
  const pointsRemain = event.pointsRemain || event.pointsPool || 0
  const organizers = event.organizers || []

  const isUpcoming = new Date(startTime) > new Date()
  const isFull = event.capacity && numGuests >= event.capacity

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Build breadcrumbs based on context
  const breadcrumbs = isManagerRoute
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Manager' },
        { label: 'Events', href: '/manager/events' },
        { label: event.name }
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Events', href: '/events' },
        { label: event.name }
      ]

  return (
    <div>
      <PageHeader 
        title={event.name}
        subtitle="Event details"
        breadcrumbs={breadcrumbs}
        actions={
          <Link to={backLink}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {backLabel}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Event Details</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isUpcoming 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isUpcoming ? 'Upcoming' : 'Past Event'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">{event.description || 'No description provided'}</p>
            </div>

            <hr />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Time
                </label>
                <p className="text-gray-900">{formatDateTime(startTime)}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </label>
                <p className="text-gray-900">{formatDateTime(endTime)}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <p className="text-gray-900">{event.location}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance
                </label>
                <p className="text-gray-900">
                  {numGuests} attending
                  {event.capacity && ` / ${event.capacity} capacity`}
                </p>
                {isFull && (
                  <p className="text-orange-600 text-sm">This event is full</p>
                )}
              </div>
            </div>

            <hr />

            {organizers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizers</h3>
                <div className="flex flex-wrap gap-3">
                  {organizers.map((org) => (
                    <div key={org.id || org.utorid} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-rewardly-light-blue flex items-center justify-center">
                        <User className="h-4 w-4 text-rewardly-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{org.name || org.utorid}</p>
                        <p className="text-xs text-gray-500">@{org.utorid || org.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Points Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="h-16 w-16 rounded-full bg-rewardly-light-blue flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-rewardly-blue" />
                </div>
                <p className="text-4xl font-bold text-rewardly-blue">+{pointsAwarded}</p>
                <p className="text-gray-500 mt-1">Points for attending</p>
              </div>
              
              {isManagerRoute && (
                <div className="border-t pt-4 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points Remaining</span>
                    <span className="font-medium">{pointsRemain.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4 text-sm text-gray-500 text-center">
                <p>Points will be awarded after the event</p>
              </div>
            </CardContent>
          </Card>

          {isUpcoming && !isManagerRoute && (
            <Card>
              <CardContent className="pt-6">
                {isOrganizer ? (
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-semibold text-blue-700 mb-2">You're an Organizer</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Organizers manage this event and cannot RSVP as guests.
                    </p>
                    <Link to={`/organizer/events/${id}/edit`}>
                      <Button className="w-full">
                        Manage Event
                      </Button>
                    </Link>
                  </div>
                ) : isRsvped ? (
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-semibold text-green-700 mb-2">You're going!</p>
                    <p className="text-sm text-gray-500 mb-4">
                      We'll see you at the event
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleRsvp}
                      disabled={rsvpLoading}
                    >
                      {rsvpLoading ? 'Cancelling...' : 'Cancel RSVP'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {isFull 
                        ? 'This event is currently full. You can join the waitlist.'
                        : 'Reserve your spot at this event!'}
                    </p>
                    <Button 
                      className="w-full"
                      onClick={handleRsvp}
                      disabled={rsvpLoading || isFull}
                    >
                      {rsvpLoading ? 'Processing...' : isFull ? 'Join Waitlist' : 'RSVP Now'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isManagerRoute && (
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Link to={`/manager/events/${id}/edit`} className="block">
                  <Button variant="outline" className="w-full">Edit Event</Button>
                </Link>
                <Link to={`/manager/events/${id}/attendees`} className="block">
                  <Button variant="outline" className="w-full">Manage Attendees</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetail
