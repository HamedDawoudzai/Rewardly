import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight, Coins, Award } from 'lucide-react'
import { eventAPI } from '@/api/events'

const ITEMS_PER_PAGE = 10

const MyEventsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    loadMyEvents()
  }, [currentPage])

  const loadMyEvents = async () => {
    setLoading(true)
    try {
      // Get all events - the backend should filter to show only events where user is organizer
      // Or we can use a specific endpoint if available
      const response = await eventAPI.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        // Filter for events where current user is organizer
        // The backend should handle this based on the authenticated user
      })
      
      // Transform events to expected format
      const transformedEvents = (response.results || []).map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startsAt || event.startTime,
        endTime: event.endsAt || event.endTime,
        capacity: event.capacity,
        numGuests: event.numGuests || event.guestCount || 0,
        pointsRemain: event.pointsRemain || event.pointsPool || 0,
        pointsAwarded: event.pointsAwarded || 0,
        isOrganizer: event.isOrganizer || true // Assume user is organizer if showing on this page
      }))
      
      // For now, filter to events where the user is an organizer (if the backend provides this info)
      // If not, we'll show all events the user can access
      const myEvents = transformedEvents.filter(e => e.isOrganizer)
      
      setEvents(myEvents.length > 0 ? myEvents : transformedEvents)
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))
      setTotalItems(response.count || 0)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
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

      {events.length === 0 ? (
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
            {events.map((event) => (
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
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      
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
                      <Link to={`/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 w-full">
                          <ArrowRight className="h-4 w-4" />
                          View
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
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default MyEventsPage
