import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Megaphone, AlertCircle } from 'lucide-react'

const CreatePromotionPage = () => {
  const navigate = useNavigate()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Please enter a promotion name')
      setLoading(false)
      return
    }

    try {
      // TODO: API call to create promotion
      await new Promise(resolve => setTimeout(resolve, 1000))
      navigate('/manager/promotions')
    } catch (err) {
      setError(err.message || 'Failed to create promotion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Create Promotion" 
        subtitle="Create a new promotional campaign"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Promotions', href: '/manager/promotions' },
          { label: 'Create' }
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

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Promotion Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Double Points Monday"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the promotion..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading}
                >
                  <option value="automatic">Automatic (applies to all eligible purchases)</option>
                  <option value="one-time">One-time (each user can use once)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Spending ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minSpending}
                  onChange={(e) => setFormData({ ...formData, minSpending: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value, points: '' })}
                    placeholder="e.g., 2 for 2x"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading || formData.points}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OR Bonus Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value, rate: '' })}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading || formData.rate}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-4">
                Choose either a points multiplier OR a fixed bonus amount
              </p>

              <div className="flex gap-3 pt-4">
                <Link to="/manager/promotions" className="flex-1">
                  <Button variant="outline" className="w-full" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Promotion'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreatePromotionPage

