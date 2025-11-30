import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag, Percent, Users, DollarSign } from 'lucide-react'
import { promotionAPI } from '@/api/promotions'

const PromotionDetail = () => {
  const { id } = useParams()
  const [promotion, setPromotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPromotion = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await promotionAPI.getById(id)
        setPromotion(data)
      } catch (err) {
        console.error('Failed to load promotion:', err)
        // Backend returns 404 for missing promotions
        setError(err.message || 'Failed to load promotion')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPromotion()
    }
  }, [id])

  const isActive = () => {
    if (!promotion) return false
    const now = new Date()
    const start = new Date(promotion.startTime)
    const end = promotion.endTime ? new Date(promotion.endTime) : null
    return now >= start && (!end || now <= end)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  if (error || !promotion) {
    return (
      <div>
        <PageHeader 
          title="Promotion not found"
          subtitle="The promotion you are looking for does not exist or is inactive."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Promotions', href: '/promotions' },
            { label: 'Not found' }
          ]}
          actions={
            <Link to="/promotions">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Promotions
              </Button>
            </Link>
          }
        />
        {error && (
          <Card className="mt-4">
            <CardContent>
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title={promotion.name}
        subtitle="Promotion details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Promotions', href: '/promotions' },
          { label: promotion.name }
        ]}
        actions={
          <Link to="/promotions">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Promotions
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Promotion Details</CardTitle>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive()
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isActive() ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-600">{promotion.description}</p>
            </div>

            <hr />

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Promotion Type
                </label>
                <p className="text-gray-900 capitalize">{promotion.type}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Duration
                </label>
                <p className="text-gray-900">
                  {new Date(promotion.startTime).toLocaleDateString()} -{' '}
                  {promotion.endTime
                    ? new Date(promotion.endTime).toLocaleDateString()
                    : 'No end date'}
                </p>
              </div>

              {promotion.minSpending != null && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Minimum Spending
                  </label>
                  <p className="text-gray-900">${promotion.minSpending}</p>
                </div>
              )}

              {promotion.usageCount != null && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Times Used
                  </label>
                  <p className="text-gray-900">{promotion.usageCount} times</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reward Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-rewardly-light-blue flex items-center justify-center mx-auto mb-4">
                <Percent className="h-8 w-8 text-rewardly-blue" />
              </div>
              {promotion.rate ? (
                <>
                  <p className="text-4xl font-bold text-rewardly-blue">
                    {promotion.rate}x
                  </p>
                  <p className="text-gray-500 mt-1">Points Multiplier</p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-rewardly-blue">
                    +{promotion.points}
                  </p>
                  <p className="text-gray-500 mt-1">Bonus Points</p>
                </>
              )}
            </div>

            <div className="border-t pt-4 mt-4 text-sm text-gray-500">
              <p>
                {promotion.type === 'automatic'
                  ? 'This promotion is automatically applied to eligible purchases.'
                  : 'This is a one-time promotion that can be used once per user.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PromotionDetail
