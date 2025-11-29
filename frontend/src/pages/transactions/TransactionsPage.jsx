import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Eye, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TransactionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    type: '',
    relatedId: '',
    promotionId: '',
    amount: '',
    operator: 'gte'
  })

  // Mock data - will be replaced with real API calls
  const transactions = [
    { id: 1, type: 'purchase', amount: 150, createdBy: 'cashier1', relatedId: 'user123', remark: 'Coffee purchase', createdAt: '2025-11-28T10:30:00Z' },
    { id: 2, type: 'transfer', amount: -50, createdBy: 'self', relatedId: 'john_doe', remark: 'Sent to friend', createdAt: '2025-11-27T15:45:00Z' },
    { id: 3, type: 'redemption', amount: -500, createdBy: 'self', relatedId: null, remark: 'Redemption request', createdAt: '2025-11-26T09:00:00Z' },
    { id: 4, type: 'event', amount: 200, createdBy: 'manager1', relatedId: 'event_42', remark: 'Workshop attendance', createdAt: '2025-11-25T14:00:00Z' },
    { id: 5, type: 'adjustment', amount: 100, createdBy: 'admin', relatedId: 'tx_99', remark: 'Correction for previous error', createdAt: '2025-11-24T11:30:00Z' },
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
      render: (value) => (
        <span className="font-mono text-gray-500">#{value}</span>
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
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-gray-600'}`}>
          {value > 0 ? '+' : ''}{value} pts
        </span>
      )
    },
    {
      key: 'relatedId',
      label: 'Related To',
      render: (value) => value || <span className="text-gray-400">—</span>
    },
    {
      key: 'remark',
      label: 'Description',
      render: (value) => (
        <span className="text-gray-600 truncate max-w-xs block">{value || '—'}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (
        <span className="text-gray-500 text-sm">
          {new Date(value).toLocaleDateString()} {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <Link to={`/transactions/${row.id}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
      )
    }
  ]

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
        >
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="transfer">Transfer</option>
          <option value="redemption">Redemption</option>
          <option value="event">Event</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Related ID</label>
        <input
          type="text"
          value={filters.relatedId}
          onChange={(e) => setFilters({ ...filters, relatedId: e.target.value })}
          placeholder="User ID or Event ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <div className="flex gap-2">
          <select
            value={filters.operator}
            onChange={(e) => setFilters({ ...filters, operator: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
          >
            <option value="gte">≥</option>
            <option value="lte">≤</option>
          </select>
          <input
            type="number"
            value={filters.amount}
            onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
            placeholder="Amount"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
          />
        </div>
      </div>
      <div className="flex items-end">
        <Button 
          variant="outline" 
          onClick={() => setFilters({ type: '', relatedId: '', promotionId: '', amount: '', operator: 'gte' })}
          className="w-full"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader 
        title="Transactions" 
        subtitle="View your transaction history"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
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
        totalPages={3}
        totalItems={25}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No transactions found"
      />
    </div>
  )
}

export default TransactionsPage

