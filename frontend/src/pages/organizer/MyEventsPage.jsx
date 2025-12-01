import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState, DataTable } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Coins, Award, Edit, UserPlus, Eye, Clock } from 'lucide-react'
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
      const response = await eventAPI.getMyOrganizedEvents({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })
      
      const transformedEvents = (response.results || []).map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startsAt || event.startTime,
        endTime: event.endsAt || event.endTime,
        capacity: event.capacity,
        numGuests: event.guests?.length || event.numGuests || 0,
        guests: event.guests || [],
        pointsRemain: event.pointsRemain || 0,
        pointsAwarded: event.pointsAwarded || 0,
        published: event.published || false
      }))
      
      setEvents(transformedEvents)
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))
      setTotalItems(response.count || 0)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const isUpcoming = (startTime) => new Date(startTime) > new Date()
  const isPast = (endTime) => new Date(endTime) < new Date()

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

  const getStatusBadge = (event) => {
    if (!event.published) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Draft</span>
    }
    if (isPast(event.endTime)) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Ended</span>
    }
    if (isUpcoming(event.startTime)) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Upcoming</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">In Progress</span>
  }

  const columns = [
    {
      key: 'name',
      label: 'Event',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {row.location}
          </div>
        </div>
      )
    },
    {
      key: 'startTime',
      label: 'Date & Time',
      render: (value, row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-700">
            <Calendar className="h-3 w-3" />
            {formatDateTime(value)}
          </div>
          <div className="flex items-center gap-1 text-gray-500 mt-1">
            <Clock className="h-3 w-3" />
            to {formatDateTime(row.endTime)}
          </div>
        </div>
      )
    },
    {
      key: 'numGuests',
      label: 'Guests',
      render: (value, row) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Users className="h-4 w-4" />
          <span>{value}{row.capacity ? ` / ${row.capacity}` : ''}</span>
        </div>
      )
    },
    {
      key: 'pointsRemain',
      label: 'Points',
      render: (value, row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-rewardly-blue font-medium">
            <Coins className="h-4 w-4" />
            {value.toLocaleString()} remaining
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {row.pointsAwarded.toLocaleString()} awarded
          </div>
        </div>
      )
    },
    {
      key: 'published',
      label: 'Status',
      render: (_, row) => getStatusBadge(row)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/organizer/events/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/organizer/events/${row.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit Event">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/organizer/events/${row.id}/guests`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Manage Guests">
              <UserPlus className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/organizer/events/${row.id}/award`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Award className="h-4 w-4" />
              Award
            </Button>
          </Link>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="My Events" 
        subtitle={`Events you are organizing (${totalItems} total)`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Event Organizer' },
          { label: 'My Events' }
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="No Events Assigned"
              description="You are not assigned as an organizer for any events. A manager can assign you as an organizer."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={events}
                loading={loading}
              />
            </CardContent>
          </Card>

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
