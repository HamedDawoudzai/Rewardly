import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { DataTable } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Plus, Edit2, Trash2, CheckCircle, XCircle, Download } from 'lucide-react'
import { promotionAPI } from '@/api/promotions'
import { exportAPI } from '@/api/exports'
import ConfirmModal from '@/components/modals/ConfirmModal'

const ITEMS_PER_PAGE = 10

const PromotionsManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promotions, setPromotions] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [exporting, setExporting] = useState(false)
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAPI.downloadPromotions()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export promotions. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (searchTerm) params.set('search', searchTerm)
    
    setSearchParams(params, { replace: true })
  }, [currentPage, searchTerm, setSearchParams])

  useEffect(() => {
    loadPromotions()
  }, [currentPage])

const loadPromotions = async () => {
  setLoading(true)
  setError('')

  try {
    const response = await promotionAPI.getAll({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    })

    // Backend returns: { count, results }
    const data = response.results || []
    const total = response.count || data.length

    setPromotions(data)
    setTotalItems(total)

    // Your API does NOT return totalPages, so compute it manually
    setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)))
  } catch (err) {
    console.error('Failed to load promotions:', err)
    setError(err.message || 'Failed to load promotions')
    setPromotions([])
    setTotalPages(1)
    setTotalItems(0)
  } finally {
    setLoading(false)
  }
}

  // Open delete confirmation modal
  const openDeleteModal = (promotion) => {
    setPromotionToDelete(promotion)
    setDeleteModalOpen(true)
  }

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setPromotionToDelete(null)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!promotionToDelete) return
    
    setDeleting(true)
    try {
      await promotionAPI.delete(promotionToDelete.id)
      await loadPromotions()
      closeDeleteModal()
    } catch (err) {
      console.error('Failed to delete promotion:', err)
      setError(err.message || 'Failed to delete promotion')
    } finally {
      setDeleting(false)
    }
  }

  const isActive = (promo) => {
    const now = new Date()
    const start = new Date(promo.startTime)
    const end = promo.endTime ? new Date(promo.endTime) : null
    return now >= start && (!end || now <= end)
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
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
      key: 'startTime',
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'endTime',
      label: 'End Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'No end date'
    },
    {
      key: 'active',
      label: 'Status',
      render: (_, row) => (
        isActive(row) ? (
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-500 hover:text-red-700"
            onClick={() => openDeleteModal(row)}
          >
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Link to="/manager/promotions/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Promotion
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={promotions}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search promotions..."
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        emptyMessage="No promotions found"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${promotionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Promotion"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default PromotionsManagementPage
