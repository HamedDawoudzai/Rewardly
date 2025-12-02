import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Plus, Edit2, Trash2, Users, CheckCircle, XCircle } from 'lucide-react'
import { eventAPI } from '@/api/events'

const ITEMS_PER_PAGE = 10

const EventsManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState(() => ({
    published: searchParams.get('published') || '',
    started: searchParams.get('started') || '',
    ended: searchParams.get('ended') || ''
  }))

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (searchTerm) params.set('search', searchTerm)
    if (filters.published) params.set('published', filters.published)
    if (filters.started) params.set('started', filters.started)
    if (filters.ended) params.set('ended', filters.ended)
    
    setSearchParams(params, { replace: true })
  }, [currentPage, searchTerm, filters, setSearchParams])

  useEffect(() => {
    loadEvents()
  }, [currentPage, filters])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }
      
      // Add filters
      if (filters.published !== '') {
        params.published = filters.published
      }
      if (filters.started === 'upcoming') {
        params.started = 'false'
      } else if (filters.started === 'past') {
        params.ended = 'true'
      }
      
      const response = await eventAPI.getAll(params)
      
      // Transform data to match expected format
      // For managers, backend returns guests array; for regular users, numGuests
      const transformedData = (response.results || []).map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startsAt || event.startTime,
        endTime: event.endsAt || event.endTime,
        capacity: event.capacity,
        numGuests: event.guests?.length ?? event.numGuests ?? event.guestCount ?? 0,
        pointsRemain: event.pointsRemain || event.pointsPool || 0,
        pointsAwarded: event.pointsAwarded || 0,
        published: event.published
      }))
      
      setEvents(transformedData)
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))
      setTotalItems(response.count || 0)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      await eventAPI.delete(eventId)
      await loadEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert(error.message || 'Failed to delete event')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Event Name',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'location',
      label: 'Location',
    },
    {
      key: 'startTime',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span>
            {row.numGuests}{row.capacity ? ` / ${row.capacity}` : ''}
          </span>
        </div>
      )
    },
    {
      key: 'published',
      label: 'Status',
      render: (value) => (
        value ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <XCircle className="h-4 w-4" /> Draft
          </span>
        )
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <Link to={`/manager/events/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/manager/events/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/manager/events/${row.id}/attendees`}>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          value={filters.published}
          onChange={(e) => {
            setFilters({ ...filters, published: e.target.value })
            setCurrentPage(1)
            setSearchTerm('')
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <select 
          value={filters.started}
          onChange={(e) => {
            setFilters({ ...filters, started: e.target.value })
            setCurrentPage(1)
            setSearchTerm('')
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Time</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>
      <div className="md:col-span-2 flex items-end">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setFilters({ published: '', started: '', ended: '' })
            setCurrentPage(1)
            setSearchTerm('')
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader 
        title="Manage Events" 
        subtitle="Create and manage events"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Events' }
        ]}
        actions={
          <Link to="/manager/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search events..."
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No events found"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}

export default EventsManagementPage
