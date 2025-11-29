import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight, Coins, Award } from 'lucide-react'

const MyEventsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - events where user is an organizer
  const myEvents = [
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
    },
    {
      id: 3,
      name: 'Study Group: Finals Prep',
      description: 'Group study session for final exams. All subjects welcome.',
      location: 'Library Room 202',
      startTime: '2025-12-05T13:00:00Z',
      endTime: '2025-12-05T18:00:00Z',
      capacity: 30,
      numGuests: 12,
      pointsRemain: 1500,
      pointsAwarded: 30,
    },
  ]

  const isUpcoming = (event) => new Date(event.startTime) > new Date()

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

  return (
    <div>
      <PageHeader 
        title="My Events" 
        subtitle="Events you are organizing"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Event Organizer' },
          { label: 'My Events' }
        ]}
      />

      {myEvents.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="No Events"
              description="You are not organizing any events at the moment."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {myEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isUpcoming(event) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming(event) ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(event.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{event.numGuests}{event.capacity ? ` / ${event.capacity}` : ''} guests</span>
                        </div>
                        <div className="flex items-center gap-2 text-rewardly-blue font-medium">
                          <Coins className="h-4 w-4" />
                          <span>{event.pointsRemain.toLocaleString()} pts remaining</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Link to={`/organizer/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 w-full">
                          <ArrowRight className="h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${event.id}/award`}>
                        <Button size="sm" className="gap-1 w-full">
                          <Award className="h-4 w-4" />
                          Award Points
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={1}
            totalItems={myEvents.length}
            itemsPerPage={10}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default MyEventsPage

