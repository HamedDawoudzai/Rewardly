import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Eye, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

const PromotionsManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data
  const promotions = [
    { id: 1, name: 'Double Points Monday', type: 'automatic', rate: 2, points: null, startDate: '2025-11-01', endDate: '2025-12-31', active: true },
    { id: 2, name: 'Welcome Bonus', type: 'one-time', rate: null, points: 500, startDate: '2025-01-01', endDate: '2025-12-31', active: true },
    { id: 3, name: 'Holiday Special', type: 'automatic', rate: 3, points: null, startDate: '2025-12-01', endDate: '2025-12-25', active: false },
    { id: 4, name: 'Referral Reward', type: 'one-time', rate: null, points: 200, startDate: '2025-11-01', endDate: null, active: true },
  ]

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          value === 'automatic' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'reward',
      label: 'Reward',
      render: (_, row) => (
        <span className="font-medium text-rewardly-blue">
          {row.rate ? `${row.rate}x multiplier` : `+${row.points} pts`}
        </span>
      )
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'No end date'
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        value ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <XCircle className="h-4 w-4" /> Inactive
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
          <Link to={`/manager/promotions/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/manager/promotions/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Manage Promotions" 
        subtitle="Create and manage promotional campaigns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Promotions' }
        ]}
        actions={
          <Link to="/manager/promotions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Promotion
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={promotions}
        searchable={true}
        searchPlaceholder="Search promotions..."
        pagination={true}
        currentPage={currentPage}
        totalPages={2}
        totalItems={promotions.length}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        emptyMessage="No promotions found"
      />
    </div>
  )
}

export default PromotionsManagementPage

