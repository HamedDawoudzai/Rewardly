import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link } from 'react-router-dom'
import { Megaphone, Calendar, Tag, ArrowRight, Percent } from 'lucide-react'

const PromotionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)

  // Mock data - will be replaced with real API calls
  const promotions = [
    {
      id: 1,
      name: 'Double Points Monday',
      description: 'Earn 2x points on all purchases every Monday!',
      type: 'automatic',
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      minSpending: 10,
      rate: 2,
      points: null
    },
    {
      id: 2,
      name: 'Welcome Bonus',
      description: 'Get 500 bonus points when you make your first purchase!',
      type: 'one-time',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      minSpending: 5,
      rate: null,
      points: 500
    },
    {
      id: 3,
      name: 'Holiday Special',
      description: 'Celebrate the season with 3x points on purchases over $50!',
      type: 'automatic',
      startDate: '2025-12-01T00:00:00Z',
      endDate: '2025-12-25T23:59:59Z',
      minSpending: 50,
      rate: 3,
      points: null
    },
    {
      id: 4,
      name: 'Referral Reward',
      description: 'Both you and your friend get 200 points when they sign up!',
      type: 'one-time',
      startDate: '2025-11-01T00:00:00Z',
      endDate: null,
      minSpending: null,
      rate: null,
      points: 200
    },
  ]

  const isActive = (promo) => {
    const now = new Date()
    const start = new Date(promo.startDate)
    const end = promo.endDate ? new Date(promo.endDate) : null
    return now >= start && (!end || now <= end)
  }

  return (
    <div>
      <PageHeader 
        title="Promotions" 
        subtitle="View available promotions and earn bonus points"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Promotions' }
        ]}
      />

      {promotions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Megaphone}
              title="No Promotions Available"
              description="There are no active promotions at the moment. Check back later!"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {promotions.map((promo) => (
              <Card key={promo.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        promo.type === 'automatic' 
                          ? 'bg-purple-100' 
                          : 'bg-green-100'
                      }`}>
                        {promo.rate ? (
                          <Percent className={`h-5 w-5 ${
                            promo.type === 'automatic' ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <Tag className={`h-5 w-5 ${
                            promo.type === 'automatic' ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{promo.name}</CardTitle>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isActive(promo) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive(promo) ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{promo.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(promo.startDate).toLocaleDateString()} 
                        {promo.endDate && ` - ${new Date(promo.endDate).toLocaleDateString()}`}
                        {!promo.endDate && ' - No end date'}
                      </span>
                    </div>
                    
                    {promo.minSpending && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Tag className="h-4 w-4" />
                        <span>Min. spending: ${promo.minSpending}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 font-medium text-rewardly-blue">
                      {promo.rate ? (
                        <span>{promo.rate}x points multiplier</span>
                      ) : (
                        <span>+{promo.points} bonus points</span>
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/promotions/${promo.id}`}>
                    <Button variant="ghost" size="sm" className="mt-4 gap-1 p-0">
                      View Details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={2}
            totalItems={promotions.length}
            itemsPerPage={4}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default PromotionsPage

