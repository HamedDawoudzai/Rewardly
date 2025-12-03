import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { promotionAPI } from '@/api/promotions'
import { ArrowLeft, Percent, Gift } from 'lucide-react'

const CreatePromotionPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bonusType, setBonusType] = useState('rate') // 'rate' or 'points'

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

        // Determine which bonus type was set
        const hasRate = data.rate && data.rate > 0
        const hasPoints = data.points && data.points > 0
        
        // Default to rate, but if only points is set, use points
        if (hasPoints && !hasRate) {
          setBonusType('points')
        } else {
          setBonusType('rate')
        }

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

  // Handle bonus type toggle
  const handleBonusTypeChange = (type) => {
    setBonusType(type)
    // Clear the other field when switching
    if (type === 'rate') {
      setFormData(prev => ({ ...prev, points: '' }))
    } else {
      setFormData(prev => ({ ...prev, rate: '' }))
    }
  }

  // ------------------------------------------------------------
  // SUBMIT HANDLER (CREATE OR EDIT)
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate that at least one bonus value is set
    if (bonusType === 'rate' && !formData.rate) {
      setError('Please enter a points multiplier value')
      setLoading(false)
      return
    }
    if (bonusType === 'points' && !formData.points) {
      setError('Please enter bonus points value')
      setLoading(false)
      return
    }

    // Build payload for backend - only include the selected bonus type
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      startTime: formData.startDate,
      endTime: formData.endDate || null,
      minSpending: formData.minSpending !== '' ? Number(formData.minSpending) : null,
      rate: bonusType === 'rate' && formData.rate !== '' ? Number(formData.rate) : null,
      points: bonusType === 'points' && formData.points !== '' ? Number(formData.points) : null
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
        className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm max-w-2xl"
      >
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Promotion Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none"
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Promotion Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
          >
            <option value="automatic">Automatic (applies to all eligible purchases)</option>
            <option value="one-time">One-time (each user can use once)</option>
          </select>
        </div>

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              required
              className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* MIN SPENDING */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum Spending ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.minSpending}
            onChange={(e) => updateField('minSpending', e.target.value)}
            placeholder="0.00"
            className="mt-1 p-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
          />
        </div>

        {/* BONUS TYPE TOGGLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Bonus Type <span className="text-red-500">*</span>
          </label>
          
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => handleBonusTypeChange('rate')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                bonusType === 'rate'
                  ? 'bg-rewardly-blue text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <Percent className="h-4 w-4" />
              Points Multiplier
            </button>
            <button
              type="button"
              onClick={() => handleBonusTypeChange('points')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                bonusType === 'points'
                  ? 'bg-rewardly-blue text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <Gift className="h-4 w-4" />
              Flat Bonus Points
            </button>
          </div>
        </div>

        {/* BONUS VALUE INPUT */}
        <div className="grid grid-cols-2 gap-4">
          {/* Points Multiplier */}
          <div className={bonusType !== 'rate' ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Points Multiplier
              {bonusType === 'rate' && <span className="text-red-500"> *</span>}
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => updateField('rate', e.target.value)}
                disabled={bonusType !== 'rate'}
                placeholder="e.g., 0.02 for 2%"
                className={`p-3 w-full border rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent ${
                  bonusType !== 'rate'
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Additional points per cent spent (e.g., 0.02 = 2% bonus)
            </p>
          </div>

          {/* Bonus Points */}
          <div className={bonusType !== 'points' ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bonus Points
              {bonusType === 'points' && <span className="text-red-500"> *</span>}
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => updateField('points', e.target.value)}
                disabled={bonusType !== 'points'}
                placeholder="e.g., 500"
                className={`p-3 w-full border rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent ${
                  bonusType !== 'points'
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Flat bonus points added to transaction
            </p>
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
