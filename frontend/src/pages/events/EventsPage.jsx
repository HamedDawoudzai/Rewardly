import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, ArrowRight, Coins, CheckCircle, Shield } from 'lucide-react'
import { eventAPI } from '@/api/events'
import { useAuth } from '@/context/AuthContext'

const ITEMS_PER_PAGE = 4

const EventsPage = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [rsvpLoading, setRsvpLoading] = useState(null) // Track which event is being RSVP'd

  // Update URL when page changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (currentPage === 1) {
      params.delete('page')
    } else {
      params.set('page', currentPage.toString())
    }
    setSearchParams(params, { replace: true })
  }, [currentPage, setSearchParams])

  useEffect(() => {
    loadEvents()
  }, [currentPage])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const response = await eventAPI.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        published: true
      })
      
      setEvents(response.results || [])
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))
      setTotalItems(response.count || 0)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async (eventId) => {
    setRsvpLoading(eventId)
    try {
      await eventAPI.rsvp(eventId)
      // Reload events to get updated RSVP status
      await loadEvents()
    } catch (error) {
      console.error('Failed to RSVP:', error)
      alert(error.message || 'Failed to RSVP')
    } finally {
      setRsvpLoading(null)
    }
  }

  const handleCancelRsvp = async (eventId) => {
    setRsvpLoading(eventId)
    try {
      await eventAPI.cancelRsvp(eventId)
      await loadEvents()
    } catch (error) {
      console.error('Failed to cancel RSVP:', error)
      alert(error.message || 'Failed to cancel RSVP')
    } finally {
      setRsvpLoading(null)
    }
  }

  const isUpcoming = (event) => {
    return new Date(event.startsAt || event.startTime) > new Date()
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
            {events.map((event) => {
              const startTime = event.startsAt || event.startTime
              const endTime = event.endsAt || event.endTime
              const numGuests = event.numGuests || event.guestCount || 0
              const pointsAwarded = event.pointsAwarded || event.pointsPool || 0
              const isUserRsvped = event.isRsvped || event.userRsvp
              // Check if current user is an organizer for this event
              const organizers = event.organizers || []
              const isUserOrganizer = organizers.some(org => org.utorid === user?.utorid)
              
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className={`h-2 ${isUpcoming(event) ? 'bg-rewardly-blue' : 'bg-gray-300'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <div className="flex gap-2">
                        {isUserOrganizer && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Organizer
                          </span>
                        )}
                        {!isUserOrganizer && isUserRsvped && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> RSVP'd
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isUpcoming(event) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming(event) ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{formatDate(startTime)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {numGuests} attending
                          {event.capacity && ` / ${event.capacity} capacity`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 font-medium text-rewardly-blue">
                        <Coins className="h-4 w-4 flex-shrink-0" />
                        <span>Earn up to {pointsAwarded} points</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 p-0">
                          View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {isUpcoming(event) && !isUserOrganizer && (
                        isUserRsvped ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelRsvp(event.id)}
                            disabled={rsvpLoading === event.id}
                          >
                            {rsvpLoading === event.id ? 'Cancelling...' : 'Cancel RSVP'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleRsvp(event.id)}
                            disabled={rsvpLoading === event.id}
                          >
                            {rsvpLoading === event.id ? 'RSVP\'ing...' : 'RSVP'}
                          </Button>
                        )
                      )}
                      {isUpcoming(event) && isUserOrganizer && (
                        <Link to={`/organizer/events/${event.id}/edit`}>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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

export default EventsPage
