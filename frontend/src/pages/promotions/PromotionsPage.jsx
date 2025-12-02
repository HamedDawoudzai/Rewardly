import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, EmptyState } from '@/components/shared'
import { Link, useSearchParams } from 'react-router-dom'
import { Megaphone, Calendar, Tag, ArrowRight, Percent } from 'lucide-react'
import { promotionAPI } from '@/api/promotions'

const ITEMS_PER_PAGE = 4

const PromotionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(page) || page < 1 ? 1 : page
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promotions, setPromotions] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Update URL when page changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (currentPage === 1) {
      params.delete('page')
    } else {
      params.set('page', currentPage.toString())
    }
    setSearchParams(params, { replace: true })
  }, [currentPage, setSearchParams])

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

    // Compute pagination manually
    setTotalItems(total)
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


  const isActive = (promo) => {
    const now = new Date()
    const start = new Date(promo.startTime)
    const end = promo.endTime ? new Date(promo.endTime) : null
    return now >= start && (!end || now <= end)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
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

      {error && (
        <Card className="mb-4">
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

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
                        {new Date(promo.startTime).toLocaleDateString()} 
                        {promo.endTime && ` - ${new Date(promo.endTime).toLocaleDateString()}`}
                        {!promo.endTime && ' - No end date'}
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
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}

export default PromotionsPage
