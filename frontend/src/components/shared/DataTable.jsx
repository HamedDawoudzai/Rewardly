import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import Pagination from './Pagination'

const DataTable = ({ 
  columns = [], 
  data = [], 
  loading = false,
  emptyMessage = 'No data found',
  searchable = true,
  searchPlaceholder = 'Search...',
  sortable = true,
  pagination = true,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onSort,
  onSearch,
  filters,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [showFilters, setShowFilters] = useState(false)

  const handleSort = (columnKey) => {
    if (!sortable) return
    
    const direction = 
      sortConfig.key === columnKey && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc'
    
    setSortConfig({ key: columnKey, direction })
    onSort?.(columnKey, direction)
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch?.(value)
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-rewardly-blue" />
      : <ArrowDown className="h-4 w-4 text-rewardly-blue" />
  }

  // Client-side sorting when no onSort handler is provided
  const sortedData = useMemo(() => {
    // If there's an onSort callback, assume server-side sorting and don't sort locally
    if (onSort || !sortConfig.key) {
      return data
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1

      // Handle dates
      if (sortConfig.key === 'createdAt' || sortConfig.key.includes('At') || sortConfig.key.includes('date')) {
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortConfig.direction === 'asc' 
            ? aDate.getTime() - bDate.getTime() 
            : bDate.getTime() - aDate.getTime()
        }
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig, onSort])

  // Client-side search filtering when no onSearch handler is provided
  const filteredData = useMemo(() => {
    if (onSearch || !searchTerm.trim()) {
      return sortedData
    }

    const term = searchTerm.toLowerCase()
    return sortedData.filter(row => {
      return columns.some(col => {
        const value = row[col.key]
        if (value == null) return false
        return String(value).toLowerCase().includes(term)
      })
    })
  }, [sortedData, searchTerm, columns, onSearch])

  const displayData = filteredData

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Search and Filter Bar */}
      {(searchable || filters) && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      onSearch?.('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </div>
            )}
            
            {filters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && filters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable !== false && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-rewardly-blue border-t-transparent" />
                    <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}

export default DataTable
