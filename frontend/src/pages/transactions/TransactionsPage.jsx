import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { transactionAPI } from '@/api/transactions'

const TransactionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState({
    type: '',
    relatedId: '',
    promotionId: '',
    amount: '',
    operator: 'gte'
  })

  const itemsPerPage = 10

  useEffect(() => {
    loadTransactions()
  }, [currentPage, filters])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      // Build query params
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      }
      
      if (filters.type) params.type = filters.type
      if (filters.relatedId) params.relatedId = filters.relatedId
      if (filters.promotionId) params.promotionId = filters.promotionId
      if (filters.amount) {
        params.amount = filters.amount
        params.operator = filters.operator
      }

      const response = await transactionAPI.getMyTransactions(params)
      
      // Handle both paginated and non-paginated responses
      const txList = response.results || response || []
      const total = response.count || txList.length
      
      // Normalize transactions to have consistent 'amount' field
      const normalizedTx = txList.map(tx => {
        let amount = tx.amount || 0
        if (tx.type === 'transfer') {
          // Transfers sent by user are negative
          amount = -(tx.sent || 0)
        } else if (tx.type === 'redemption') {
          // Redemptions are always negative (points being spent)
          // Use redeemed if processed, otherwise use amount
          const redemptionAmount = tx.redeemed || tx.amount || 0
          amount = -Math.abs(redemptionAmount)
        }
        return { ...tx, amount }
      })
      
      setTransactions(normalizedTx)
      setTotalItems(total)
      setTotalPages(Math.ceil(total / itemsPerPage))
    } catch (error) {
      console.error('Failed to load transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

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
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
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
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm">—</span>
        try {
          const date = new Date(value)
          if (isNaN(date.getTime())) return <span className="text-gray-400 text-sm">—</span>
          return (
            <span className="text-gray-500 text-sm">
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        } catch {
          return <span className="text-gray-400 text-sm">—</span>
        }
      }
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
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value })
            setCurrentPage(1)
          }}
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
          onClick={() => {
            setFilters({ type: '', relatedId: '', promotionId: '', amount: '', operator: 'gte' })
            setCurrentPage(1)
          }}
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
        loading={loading}
        searchable={true}
        searchPlaceholder="Search transactions..."
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No transactions found"
      />
    </div>
  )
}

export default TransactionsPage
