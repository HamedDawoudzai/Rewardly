import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, Hash, AlertCircle, CheckCircle, Gift, User } from 'lucide-react'

const ProcessRedemptionPage = () => {
  const [redemptionId, setRedemptionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [redemption, setRedemption] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLookup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setRedemption(null)

    if (!redemptionId.trim()) {
      setError('Please enter a redemption ID')
      setLoading(false)
      return
    }

    try {
      // TODO: API call to look up redemption
      await new Promise(resolve => setTimeout(resolve, 500))
      // Mock data
      setRedemption({
        id: redemptionId,
        userId: 'john_doe',
        userName: 'John Doe',
        amount: 500,
        status: 'pending',
        createdAt: '2025-11-28T10:30:00Z'
      })
    } catch (err) {
      setError('Redemption not found')
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async () => {
    setLoading(true)
    setError('')

    try {
      // TODO: API call to process redemption
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to process redemption')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setRedemptionId('')
    setRedemption(null)
    setSuccess(false)
    setError('')
  }

  return (
    <div>
      <PageHeader 
        title="Process Redemption" 
        subtitle="Process a customer's redemption request"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cashier' },
          { label: 'Process Redemption' }
        ]}
      />

      <div className="max-w-xl mx-auto space-y-6">
        {/* Lookup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Find Redemption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Redemption ID
                </label>
                <input
                  type="text"
                  value={redemptionId}
                  onChange={(e) => setRedemptionId(e.target.value)}
                  placeholder="Enter or scan redemption ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can scan the customer's redemption QR code or manually enter the ID
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || success}
              >
                {loading ? 'Looking up...' : 'Look Up Redemption'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redemption Details */}
        {redemption && !success && (
          <Card>
            <CardHeader>
              <CardTitle>Redemption Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Redemption ID</label>
                  <p className="font-mono text-gray-900">{redemption.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                      {redemption.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" /> Customer
                  </label>
                  <p className="text-gray-900">{redemption.userName}</p>
                  <p className="text-xs text-gray-500">@{redemption.userId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {new Date(redemption.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-center py-4 bg-rewardly-light-blue rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="h-6 w-6 text-rewardly-blue" />
                </div>
                <p className="text-3xl font-bold text-rewardly-blue">{redemption.amount}</p>
                <p className="text-gray-600">Points to redeem</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleProcess}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Process Redemption'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {success && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Redemption Processed!
                </h3>
                <p className="text-green-700 mb-4">
                  Successfully processed {redemption?.amount} points for {redemption?.userName}
                </p>
                <Button onClick={handleReset}>
                  Process Another Redemption
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProcessRedemptionPage

