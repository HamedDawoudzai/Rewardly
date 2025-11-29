import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Eye, AlertTriangle, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AllTransactionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - will be replaced with real API calls
  const transactions = [
    { id: 1, type: 'purchase', amount: 150, userId: 'john_doe', createdBy: 'cashier1', suspicious: false, createdAt: '2025-11-28T10:30:00Z' },
    { id: 2, type: 'transfer', amount: 50, userId: 'jane_smith', createdBy: 'john_doe', suspicious: false, createdAt: '2025-11-27T15:45:00Z' },
    { id: 3, type: 'redemption', amount: -500, userId: 'bob_wilson', createdBy: 'bob_wilson', suspicious: true, createdAt: '2025-11-26T09:00:00Z' },
    { id: 4, type: 'event', amount: 200, userId: 'alice_johnson', createdBy: 'manager1', suspicious: false, createdAt: '2025-11-25T14:00:00Z' },
    { id: 5, type: 'adjustment', amount: -100, userId: 'charlie_brown', createdBy: 'admin', suspicious: false, createdAt: '2025-11-24T11:30:00Z' },
  ]

  const getTypeStyles = (type) => {
    const styles = {
      purchase: 'bg-green-100 text-green-700 border-green-200',
      transfer: 'bg-blue-100 text-blue-700 border-blue-200',
      redemption: 'bg-orange-100 text-orange-700 border-orange-200',
      event: 'bg-purple-100 text-purple-700 border-purple-200',
      adjustment: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return styles[type] || styles.adjustment
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-500">#{value}</span>
          {row.suspicious && (
            <AlertTriangle className="h-4 w-4 text-red-500" title="Suspicious" />
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getTypeStyles(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'userId',
      label: 'User',
      render: (value) => (
        <Link to={`/manager/users?search=${value}`} className="font-medium text-rewardly-blue hover:underline">
          @{value}
        </Link>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-gray-600'}`}>
          {value > 0 ? '+' : ''}{value} pts
        </span>
      )
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (value) => (
        <span className="text-gray-500">@{value}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (
        <span className="text-gray-500 text-sm">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <Link to={`/manager/transactions/${row.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {!row.suspicious && (
            <Button variant="ghost" size="sm" className="gap-1 text-orange-500 hover:text-orange-700">
              <Flag className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="transfer">Transfer</option>
          <option value="redemption">Redemption</option>
          <option value="event">Event</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
        <input
          type="text"
          placeholder="UTORid"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
        <input
          type="text"
          placeholder="UTORid"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Suspicious</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All</option>
          <option value="true">Suspicious Only</option>
          <option value="false">Not Suspicious</option>
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
        title="All Transactions" 
        subtitle="View and manage all transactions in the system"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Transactions' }
        ]}
      />

      <DataTable
        columns={columns}
        data={transactions}
        searchable={true}
        searchPlaceholder="Search transactions..."
        pagination={true}
        currentPage={currentPage}
        totalPages={5}
        totalItems={50}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No transactions found"
      />
    </div>
  )
}

export default AllTransactionsPage

