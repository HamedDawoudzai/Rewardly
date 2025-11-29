import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, Users, Clock, Coins, User, CheckCircle } from 'lucide-react'
import { useState } from 'react'

const EventDetail = () => {
  const { id } = useParams()
  const [isRsvped, setIsRsvped] = useState(false)

  // Mock data - will be replaced with real API call
  const event = {
    id: parseInt(id),
    name: 'Tech Workshop: React Basics',
    description: 'Learn the fundamentals of React.js in this hands-on workshop. We will cover components, state management, hooks, and best practices. This workshop is suitable for beginners with basic JavaScript knowledge. Laptops are required for the hands-on exercises.',
    location: 'Room BA1234, Bahen Centre',
    startTime: '2025-12-01T14:00:00Z',
    endTime: '2025-12-01T17:00:00Z',
    capacity: 50,
    numGuests: 35,
    pointsRemain: 5000,
    pointsAwarded: 100,
    published: true,
    organizers: [
      { id: 1, name: 'Jane Smith', utorid: 'smithj1' },
      { id: 2, name: 'John Doe', utorid: 'doej2' }
    ]
  }

  const isUpcoming = new Date(event.startTime) > new Date()
  const isFull = event.capacity && event.numGuests >= event.capacity

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

  const handleRsvp = () => {
    setIsRsvped(!isRsvped)
    // TODO: API call to RSVP
  }

  return (
    <div>
      <PageHeader 
        title={event.name}
        subtitle="Event details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Events', href: '/events' },
          { label: event.name }
        ]}
        actions={
          <Link to="/events">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
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
              <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            </div>

            <hr />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Time
                </label>
                <p className="text-gray-900">{formatDateTime(event.startTime)}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </label>
                <p className="text-gray-900">{formatDateTime(event.endTime)}</p>
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
                  {event.numGuests} attending
                  {event.capacity && ` / ${event.capacity} capacity`}
                </p>
                {isFull && (
                  <p className="text-orange-600 text-sm">This event is full</p>
                )}
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Organizers</h3>
              <div className="flex flex-wrap gap-3">
                {event.organizers.map((org) => (
                  <div key={org.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-rewardly-light-blue flex items-center justify-center">
                      <User className="h-4 w-4 text-rewardly-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-500">@{org.utorid}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <p className="text-4xl font-bold text-rewardly-blue">+{event.pointsAwarded}</p>
                <p className="text-gray-500 mt-1">Points for attending</p>
              </div>
              
              <div className="border-t pt-4 mt-4 text-sm text-gray-500 text-center">
                <p>Points will be awarded after the event</p>
              </div>
            </CardContent>
          </Card>

          {isUpcoming && (
            <Card>
              <CardContent className="pt-6">
                {isRsvped ? (
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
                    >
                      Cancel RSVP
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
                      disabled={isFull}
                    >
                      {isFull ? 'Join Waitlist' : 'RSVP Now'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetail

