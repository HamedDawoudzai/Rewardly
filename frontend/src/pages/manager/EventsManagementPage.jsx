import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Eye, Plus, Edit2, Trash2, Users, CheckCircle, XCircle } from 'lucide-react'

const EventsManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data
  const events = [
    { id: 1, name: 'Tech Workshop: React Basics', location: 'Room BA1234', startTime: '2025-12-01T14:00:00Z', capacity: 50, numGuests: 35, published: true },
    { id: 2, name: 'Holiday Party', location: 'Great Hall', startTime: '2025-12-15T18:00:00Z', capacity: 200, numGuests: 150, published: true },
    { id: 3, name: 'Career Fair', location: 'Student Center', startTime: '2025-12-10T10:00:00Z', capacity: null, numGuests: 89, published: true },
    { id: 4, name: 'Draft Event', location: 'TBD', startTime: '2025-12-20T12:00:00Z', capacity: 30, numGuests: 0, published: false },
  ]

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
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
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
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Time</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Any</option>
          <option value="available">Has Availability</option>
          <option value="full">Full</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" className="w-full">
          Clear
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
        searchable={true}
        searchPlaceholder="Search events..."
        pagination={true}
        currentPage={currentPage}
        totalPages={2}
        totalItems={events.length}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No events found"
      />
    </div>
  )
}

export default EventsManagementPage

