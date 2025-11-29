import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight, Coins } from 'lucide-react'

const EventsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - will be replaced with real API calls
  const events = [
    {
      id: 1,
      name: 'Tech Workshop: React Basics',
      description: 'Learn the fundamentals of React.js in this hands-on workshop.',
      location: 'Room BA1234',
      startTime: '2025-12-01T14:00:00Z',
      endTime: '2025-12-01T17:00:00Z',
      capacity: 50,
      numGuests: 35,
      pointsRemain: 5000,
      pointsAwarded: 100,
      published: true
    },
    {
      id: 2,
      name: 'Holiday Party',
      description: 'Celebrate the holiday season with fellow students! Food, games, and prizes.',
      location: 'Great Hall',
      startTime: '2025-12-15T18:00:00Z',
      endTime: '2025-12-15T22:00:00Z',
      capacity: 200,
      numGuests: 150,
      pointsRemain: 10000,
      pointsAwarded: 50,
      published: true
    },
    {
      id: 3,
      name: 'Career Fair',
      description: 'Meet top employers and explore career opportunities.',
      location: 'Student Center',
      startTime: '2025-12-10T10:00:00Z',
      endTime: '2025-12-10T16:00:00Z',
      capacity: null,
      numGuests: 89,
      pointsRemain: 8000,
      pointsAwarded: 75,
      published: true
    },
    {
      id: 4,
      name: 'Study Group: Finals Prep',
      description: 'Group study session for final exams. All subjects welcome.',
      location: 'Library Room 202',
      startTime: '2025-12-05T13:00:00Z',
      endTime: '2025-12-05T18:00:00Z',
      capacity: 30,
      numGuests: 12,
      pointsRemain: 1500,
      pointsAwarded: 30,
      published: true
    },
  ]

  const isUpcoming = (event) => {
    return new Date(event.startTime) > new Date()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div>
      <PageHeader 
        title="Events" 
        subtitle="Browse and RSVP to upcoming events"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Events' }
        ]}
      />

      {events.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="No Events Available"
              description="There are no published events at the moment. Check back later!"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className={`h-2 ${isUpcoming(event) ? 'bg-rewardly-blue' : 'bg-gray-300'}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isUpcoming(event) 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isUpcoming(event) ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {event.numGuests} attending
                        {event.capacity && ` / ${event.capacity} capacity`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 font-medium text-rewardly-blue">
                      <Coins className="h-4 w-4 flex-shrink-0" />
                      <span>Earn up to {event.pointsAwarded} points</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Link to={`/events/${event.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1 p-0">
                        View Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    {isUpcoming(event) && (
                      <Button size="sm">
                        RSVP
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={2}
            totalItems={events.length}
            itemsPerPage={4}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default EventsPage

