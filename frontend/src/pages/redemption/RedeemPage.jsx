import { useState, useEffect, useContext } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from '@/components/shared'
import { transactionAPI } from '@/api/transactions'
import { Gift, Coins, AlertCircle, CheckCircle, QrCode, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthContext } from '@/context/AuthContext'

const RedeemPage = () => {
  const { user, refreshUser } = useContext(AuthContext)
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [redemptionResult, setRedemptionResult] = useState(null)
  const [pendingRedemptions, setPendingRedemptions] = useState([])
  const [loadingPending, setLoadingPending] = useState(true)

  useEffect(() => {
    loadPendingRedemptions()
  }, [])

  const loadPendingRedemptions = async () => {
    setLoadingPending(true)
    try {
      const response = await transactionAPI.getMyTransactions({ type: 'redemption' })
      const transactions = response.results || response || []
      
      // Filter to only pending (unprocessed) redemptions
      const pending = transactions.filter(tx => 
        tx.type === 'redemption' && !tx.processedAt
      )
      setPendingRedemptions(pending)
    } catch (err) {
      console.error('Failed to load pending redemptions:', err)
      setPendingRedemptions([])
    } finally {
      setLoadingPending(false)
    }
  }

  const availablePoints = user?.points || 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const redemptionAmount = parseInt(amount)
    if (!redemptionAmount || redemptionAmount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }
    if (redemptionAmount > availablePoints) {
      setError('Insufficient points')
      setLoading(false)
      return
    }

    try {
      const result = await transactionAPI.createRedemption(redemptionAmount, remark)
      setRedemptionResult(result)
      setSuccess(true)
      // Refresh user data to update points balance in navbar
      await refreshUser()
      // Refresh pending redemptions list
      loadPendingRedemptions()
    } catch (err) {
      console.error('Redemption error:', err)
      setError(err.message || 'Redemption request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setAmount('')
    setRemark('')
    setSuccess(false)
    setError('')
    setRedemptionResult(null)
  }

  return (
    <div>
      <PageHeader 
        title="Redeem Points" 
        subtitle="Request a redemption for your points"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Redeem Points' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redemption Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                New Redemption
              </CardTitle>
              <span className="text-sm text-gray-500">
                Available: <span className="font-semibold text-rewardly-blue">{availablePoints.toLocaleString()} pts</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {success && redemptionResult ? (
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Redemption Created!</h3>
                <p className="text-gray-600 mb-4">
                  Your redemption request for {amount} points has been submitted.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Show the QR code below to a cashier to process your redemption.
                </p>
                
                <QRCodeDisplay
                  value={`redemption:${redemptionResult.id}`}
                  title="Redemption QR Code"
                  subtitle={`Transaction #${redemptionResult.id}`}
                  size={160}
                />
                
                <Button onClick={handleReset} variant="outline" className="mt-4">
                  Create Another Redemption
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Coins className="h-4 w-4 inline mr-1" />
                    Points to Redeem
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      max={availablePoints}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent pr-12"
                      disabled={loading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                      pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Points will be converted to store credit or cash equivalent
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remark (optional)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add a note for this redemption"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none"
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Create Redemption Request'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Pending Redemptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-rewardly-blue border-t-transparent" />
              </div>
            ) : pendingRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending redemptions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRedemptions.map((redemption) => (
                  <div 
                    key={redemption.id} 
                    className="p-4 border border-gray-200 rounded-lg hover:border-rewardly-blue transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-500">#{redemption.id}</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{Math.abs(redemption.amount)} points</p>
                        <p className="text-xs text-gray-500">
                          {new Date(redemption.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/redemption/${redemption.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <QrCode className="h-4 w-4" />
                          Show QR
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RedeemPage
