import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag, Percent, Users, DollarSign } from 'lucide-react'

const PromotionDetail = () => {
  const { id } = useParams()

  // Mock data - will be replaced with real API call
  const promotion = {
    id: parseInt(id),
    name: 'Double Points Monday',
    description: 'Earn 2x points on all purchases every Monday! This promotion is automatically applied to all eligible purchases.',
    type: 'automatic',
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    minSpending: 10,
    rate: 2,
    points: null,
    usageCount: 156
  }

  const isActive = () => {
    const now = new Date()
    const start = new Date(promotion.startDate)
    const end = promotion.endDate ? new Date(promotion.endDate) : null
    return now >= start && (!end || now <= end)
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive() 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isActive() ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
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
                  {new Date(promotion.startDate).toLocaleDateString()} - {' '}
                  {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'No end date'}
                </p>
              </div>
              
              {promotion.minSpending && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Minimum Spending
                  </label>
                  <p className="text-gray-900">${promotion.minSpending}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Times Used
                </label>
                <p className="text-gray-900">{promotion.usageCount} times</p>
              </div>
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
                  <p className="text-4xl font-bold text-rewardly-blue">{promotion.rate}x</p>
                  <p className="text-gray-500 mt-1">Points Multiplier</p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-rewardly-blue">+{promotion.points}</p>
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

