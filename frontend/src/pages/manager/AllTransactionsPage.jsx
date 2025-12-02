import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, AlertTriangle, Flag, FlagOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminTransactionAPI } from '@/api/transactions'

const ITEMS_PER_PAGE = 10

const AllTransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState(() => ({
    type: searchParams.get('type') || '',
    name: searchParams.get('name') || '',
    createdBy: searchParams.get('createdBy') || '',
    suspicious: searchParams.get('suspicious') || ''
  }))

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (searchTerm) params.set('search', searchTerm)
    if (filters.type) params.set('type', filters.type)
    if (filters.name) params.set('name', filters.name)
    if (filters.createdBy) params.set('createdBy', filters.createdBy)
    if (filters.suspicious) params.set('suspicious', filters.suspicious)
    
    setSearchParams(params, { replace: true })
  }, [currentPage, searchTerm, filters, setSearchParams])

  useEffect(() => {
    loadTransactions()
  }, [currentPage, filters])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }
      
      // Add filters if they have values
      if (filters.type) params.type = filters.type
      if (filters.name) params.name = filters.name
      if (filters.createdBy) params.createdBy = filters.createdBy
      if (filters.suspicious !== '') params.suspicious = filters.suspicious
      
      const response = await adminTransactionAPI.getAll(params)
      
      // Transform data to match expected format
      const transformedData = (response.results || []).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount || tx.earned || tx.redeemed || tx.sent || 0,
        spent: tx.spent || null,
        userId: tx.utorid || tx.sender || 'Unknown',
        createdBy: tx.createdBy || 'System',
        suspicious: tx.suspicious || false,
        createdAt: tx.createdAt,
        status: tx.status,
        remark: tx.remark
      }))
      
      setTransactions(transformedData)
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE))
      setTotalItems(response.count || 0)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlagSuspicious = async (transactionId, currentSuspicious) => {
    try {
      await adminTransactionAPI.toggleSuspicious(transactionId, !currentSuspicious)
      // Reload transactions to reflect the change
      loadTransactions()
    } catch (error) {
      console.error('Failed to toggle suspicious flag:', error)
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
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-1 ${row.suspicious ? 'text-green-500 hover:text-green-700' : 'text-orange-500 hover:text-orange-700'}`}
            onClick={() => handleFlagSuspicious(row.id, row.suspicious)}
            title={row.suspicious ? 'Remove suspicious flag' : 'Mark as suspicious'}
          >
            {row.suspicious ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
          </Button>
        </div>
      )
    }
  ]

  const filterPanel = (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select 
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value })
            setCurrentPage(1)
            setSearchTerm('')
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
        <input
          type="text"
          value={filters.name}
          onChange={(e) => {
            setFilters({ ...filters, name: e.target.value })
            setCurrentPage(1)
          }}
          placeholder="Name or UTORid"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
        <input
          type="text"
          value={filters.createdBy}
          onChange={(e) => {
            setFilters({ ...filters, createdBy: e.target.value })
            setCurrentPage(1)
          }}
          placeholder="UTORid"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Suspicious</label>
        <select 
          value={filters.suspicious}
          onChange={(e) => {
            setFilters({ ...filters, suspicious: e.target.value })
            setCurrentPage(1)
            setSearchTerm('')
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All</option>
          <option value="true">Suspicious Only</option>
          <option value="false">Not Suspicious</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setFilters({ type: '', name: '', createdBy: '', suspicious: '' })
            setCurrentPage(1)
            setSearchTerm('')
          }}
        >
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
        loading={loading}
        searchable={true}
        searchPlaceholder="Search transactions..."
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        filters={filterPanel}
        emptyMessage="No transactions found"
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

export default AllTransactionsPage
