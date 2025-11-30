import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { promotionAPI } from '@/api/promotions'
import { ArrowLeft } from 'lucide-react'

const CreatePromotionPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automatic',
    startDate: '',
    endDate: '',
    minSpending: '',
    rate: '',
    points: ''
  })

  // ------------------------------------------------------------
  // LOAD EXISTING PROMOTION IN EDIT MODE
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isEdit) return

    const loadPromotion = async () => {
      try {
        setLoading(true)
        const data = await promotionAPI.getById(id)

        setFormData({
          name: data.name || '',
          description: data.description || '',
          type: data.type === "onetime" ? "one-time" : data.type || "automatic",
          startDate: data.startTime?.split('T')[0] || '',
          endDate: data.endTime?.split('T')[0] || '',
          minSpending: data.minSpending ?? '',
          rate: data.rate ?? '',
          points: data.points ?? ''
        })
      } catch (err) {
        console.error('Failed to load promotion:', err)
        setError('Failed to load promotion details.')
      } finally {
        setLoading(false)
      }
    }

    loadPromotion()
  }, [isEdit, id])

  // ------------------------------------------------------------
  // HANDLE INPUT CHANGE
  // ------------------------------------------------------------
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ------------------------------------------------------------
  // SUBMIT HANDLER (CREATE OR EDIT)
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Build payload for backend
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      startTime: formData.startDate,
      endTime: formData.endDate || null,
      minSpending: formData.minSpending !== '' ? Number(formData.minSpending) : null,
      rate: formData.rate !== '' ? Number(formData.rate) : null,
      points: formData.points !== '' ? Number(formData.points) : null
    }

    try {
      if (isEdit) {
        await promotionAPI.update(id, payload)
      } else {
        await promotionAPI.create(payload)
      }

      navigate('/manager/promotions')
    } catch (err) {
      console.error('Failed to save promotion:', err)
      setError(err.message || 'Failed to save promotion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Promotion' : 'Create Promotion'}
        subtitle={isEdit ? 'Modify an existing promotional campaign' : 'Create a new promotional campaign'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Promotions', href: '/manager/promotions' },
          { label: isEdit ? 'Edit' : 'Create' }
        ]}
        actions={
          <Link to="/manager/promotions">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow-sm max-w-2xl"
      >
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium">Promotion Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="mt-1 p-3 w-full border rounded"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="mt-1 p-3 w-full border rounded h-24"
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-sm font-medium">Promotion Type *</label>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="mt-1 p-3 w-full border rounded"
          >
            <option value="automatic">Automatic (applies to all eligible purchases)</option>
            <option value="one-time">One-time (each user can use once)</option>
          </select>
        </div>

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              required
              className="mt-1 p-3 w-full border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className="mt-1 p-3 w-full border rounded"
            />
          </div>
        </div>

        {/* MIN SPENDING */}
        <div>
          <label className="block text-sm font-medium">Minimum Spending ($)</label>
          <input
            type="number"
            min="0"
            value={formData.minSpending}
            onChange={(e) => updateField('minSpending', e.target.value)}
            className="mt-1 p-3 w-full border rounded"
          />
        </div>

        {/* RATE & POINTS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Points Multiplier</label>
            <input
              type="number"
              min="0"
              value={formData.rate}
              onChange={(e) => updateField('rate', e.target.value)}
              className="mt-1 p-3 w-full border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">OR Bonus Points</label>
            <input
              type="number"
              min="0"
              value={formData.points}
              onChange={(e) => updateField('points', e.target.value)}
              className="mt-1 p-3 w-full border rounded"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? isEdit ? 'Saving...' : 'Creating...'
            : isEdit ? 'Save Changes' : 'Create Promotion'}
        </Button>
      </form>
    </div>
  )
}

export default CreatePromotionPage
