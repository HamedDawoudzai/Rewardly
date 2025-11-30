import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, Hash, AlertCircle, CheckCircle, Gift, User, Calendar } from 'lucide-react'
import { adminTransactionAPI } from '@/api/transactions'

const ProcessRedemptionPage = () => {
  const [redemptionId, setRedemptionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [redemption, setRedemption] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [processedResult, setProcessedResult] = useState(null)

  // Step 1: Look up the redemption
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

    const id = parseInt(redemptionId)
    if (isNaN(id)) {
      setError('Please enter a valid numeric ID')
      setLoading(false)
      return
    }

    try {
      // Use the new cashier-specific preview endpoint
      const response = await adminTransactionAPI.getRedemptionPreview(id)
      
      setRedemption({
        id: response.id,
        utorid: response.utorid,
        amount: response.amount,
        remark: response.remark,
        createdAt: response.createdAt
      })
    } catch (err) {
      const message = err.message || 'Failed to look up redemption'
      if (message.includes('not found')) {
        setError('Redemption not found. Please check the ID and try again.')
      } else if (message.includes('already been processed')) {
        setError('This redemption has already been processed.')
      } else if (message.includes('not a redemption')) {
        setError('This transaction is not a redemption request.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Process the redemption
  const handleProcess = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await adminTransactionAPI.processRedemption(redemption.id)
      
      setProcessedResult({
        id: response.id,
        utorid: response.utorid || redemption.utorid,
        amount: response.redeemed || redemption.amount
      })
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
    setProcessedResult(null)
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
                  placeholder="Enter redemption transaction ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                  disabled={loading || success || redemption}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the transaction ID from the customer's redemption QR code
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || success || redemption}
              >
                {loading && !redemption ? 'Looking up...' : 'Look Up Redemption'}
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

        {/* Redemption Preview (Step 2) */}
        {redemption && !success && (
          <Card>
            <CardHeader>
              <CardTitle>Redemption Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Transaction ID</label>
                  <p className="font-mono text-gray-900">#{redemption.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-4 w-4" /> Customer
                  </label>
                  <p className="text-gray-900 font-medium">@{redemption.utorid}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Requested
                  </label>
                  <p className="text-gray-900">
                    {new Date(redemption.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {redemption.remark && (
                <div>
                  <label className="text-sm text-gray-500">Remark</label>
                  <p className="text-gray-700 italic">"{redemption.remark}"</p>
                </div>
              )}

              <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{redemption.amount}</p>
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
                  {loading ? 'Processing...' : 'Confirm & Process'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {success && processedResult && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Redemption Processed!
                </h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-left">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Transaction ID:</div>
                    <div className="font-mono">#{processedResult.id}</div>
                    <div className="text-gray-500">Customer:</div>
                    <div className="font-medium">@{processedResult.utorid}</div>
                  </div>
                </div>
                
                <div className="bg-green-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Gift className="h-5 w-5 text-green-700" />
                  </div>
                  <p className="text-3xl font-bold text-green-700">{processedResult.amount} pts</p>
                  <p className="text-sm text-green-600">successfully redeemed</p>
                </div>
                
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
