import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, User, DollarSign, FileText, AlertCircle, CheckCircle, Tag, Check, Loader2 } from 'lucide-react'
import { adminTransactionAPI } from '@/api/transactions'
import { promotionAPI } from '@/api/promotions'

const CreateTransactionPage = () => {
  const [formData, setFormData] = useState({
    utorid: '',
    type: 'purchase',
    spent: '',
    remark: ''
  })
  const [selectedPromotions, setSelectedPromotions] = useState([])
  const [promotions, setPromotions] = useState([])
  const [loadingPromotions, setLoadingPromotions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Fetch active promotions on component mount
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoadingPromotions(true)
        // Fetch promotions that have started but not ended
        const response = await promotionAPI.getAll({ started: true, limit: 100 })
        // Filter to only include active promotions (not ended)
        const now = new Date()
        const activePromotions = (response.results || []).filter(promo => {
          if (promo.endTime) {
            return new Date(promo.endTime) > now
          }
          return true
        })
        setPromotions(activePromotions)
      } catch (err) {
        console.error('Failed to fetch promotions:', err)
      } finally {
        setLoadingPromotions(false)
      }
    }
    fetchPromotions()
  }, [])

  const togglePromotion = (promotionId) => {
    setSelectedPromotions(prev => {
      if (prev.includes(promotionId)) {
        return prev.filter(id => id !== promotionId)
      } else {
        return [...prev, promotionId]
      }
    })
  }

  const calculateEstimatedPoints = () => {
    const spent = parseFloat(formData.spent) || 0
    if (spent <= 0) return 0

    // Base rate: 1 point per $0.25
    let basePoints = Math.round(spent / 0.25)
    let bonusPoints = 0

    // Add promotion bonuses
    selectedPromotions.forEach(promoId => {
      const promo = promotions.find(p => p.id === promoId)
      if (promo) {
        // Check minimum spending
        if (promo.minSpending && spent < promo.minSpending) {
          return
        }
        // Rate multiplier (additional points per dollar)
        if (promo.rate) {
          bonusPoints += Math.round(spent * 100 * promo.rate)
        }
        // Bonus points
        if (promo.points) {
          bonusPoints += promo.points
        }
      }
    })

    return basePoints + bonusPoints
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.utorid.trim()) {
      setError('Please enter a user UTORid')
      setLoading(false)
      return
    }
    if (!formData.spent || parseFloat(formData.spent) <= 0) {
      setError('Please enter a valid amount spent')
      setLoading(false)
      return
    }

    try {
      const response = await adminTransactionAPI.createPurchase({
        utorid: formData.utorid,
        spent: formData.spent,
        promotionIds: selectedPromotions,
        remark: formData.remark || null
      })
      
      setResult({
        points: response.earned || 0,
        spent: formData.spent,
        user: formData.utorid,
        promotionsApplied: selectedPromotions.length
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ utorid: '', type: 'purchase', spent: '', remark: '' })
    setSelectedPromotions([])
    setSuccess(false)
    setError('')
    setResult(null)
  }

  const estimatedPoints = calculateEstimatedPoints()

  return (
    <div>
      <PageHeader 
        title="Create Transaction" 
        subtitle="Record a new purchase transaction for a customer"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cashier' },
          { label: 'Create Transaction' }
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Transaction Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Successfully recorded transaction for <span className="font-medium">{result?.user}</span>
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">+{result?.points} pts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">earned from ${result?.spent} spent</p>
                  {result?.promotionsApplied > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {result?.promotionsApplied} promotion{result?.promotionsApplied > 1 ? 's' : ''} applied
                    </p>
                  )}
                </div>
                
                <Button onClick={handleReset}>
                  Create Another Transaction
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Customer UTORid
                  </label>
                  <input
                    type="text"
                    value={formData.utorid}
                    onChange={(e) => setFormData({ ...formData, utorid: e.target.value })}
                    placeholder="Enter or scan customer's UTORid"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can scan the customer's QR code or manually enter their UTORid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  >
                    <option value="purchase">Purchase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Amount Spent
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.spent}
                      onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                  </div>
                  {formData.spent && (
                    <p className="text-sm text-rewardly-blue dark:text-rewardly-light-blue mt-1">
                      Customer will earn ~{estimatedPoints} points
                      {selectedPromotions.length > 0 && (
                        <span className="text-green-600 dark:text-green-400"> (with promotions)</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Promotions Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Apply Promotions <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  
                  {loadingPromotions ? (
                    <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading promotions...
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      No active promotions available
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      {promotions.map(promo => {
                        const isSelected = selectedPromotions.includes(promo.id)
                        const meetsMinSpend = !promo.minSpending || (parseFloat(formData.spent) || 0) >= promo.minSpending
                        
                        return (
                          <button
                            key={promo.id}
                            type="button"
                            onClick={() => togglePromotion(promo.id)}
                            disabled={loading}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-rewardly-blue bg-rewardly-light-blue/50 dark:bg-rewardly-blue/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            } ${!meetsMinSpend && !isSelected ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {promo.name}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    promo.type === 'automatic' 
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                  }`}>
                                    {promo.type === 'automatic' ? 'Automatic' : 'One-time'}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  {promo.rate > 0 && (
                                    <span>+{(promo.rate * 100).toFixed(1)}% bonus</span>
                                  )}
                                  {promo.points > 0 && (
                                    <span>+{promo.points} bonus pts</span>
                                  )}
                                  {promo.minSpending > 0 && (
                                    <span className={!meetsMinSpend ? 'text-orange-600 dark:text-orange-400' : ''}>
                                      Min ${promo.minSpending.toFixed(2)}
                                      {!meetsMinSpend && ' (not met)'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                                isSelected 
                                  ? 'border-rewardly-blue bg-rewardly-blue' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  
                  {selectedPromotions.length > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      {selectedPromotions.length} promotion{selectedPromotions.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Remark (optional)
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Add a note for this transaction"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Create Transaction'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreateTransactionPage
