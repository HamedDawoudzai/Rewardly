import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/utils/auth'
import { Send, User, Coins, AlertCircle, CheckCircle } from 'lucide-react'

const TransferPage = () => {
  const user = getUser()
  const [formData, setFormData] = useState({
    recipientId: '',
    amount: '',
    remark: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const availablePoints = user?.points || 1250

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    const amount = parseInt(formData.amount)
    if (!formData.recipientId.trim()) {
      setError('Please enter a recipient UTORid')
      setLoading(false)
      return
    }
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }
    if (amount > availablePoints) {
      setError('Insufficient points')
      setLoading(false)
      return
    }

    try {
      // TODO: API call to transfer points
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ recipientId: '', amount: '', remark: '' })
    setSuccess(false)
    setError('')
  }

  return (
    <div>
      <PageHeader 
        title="Transfer Points" 
        subtitle="Send points to another user"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Transfer Points' }
        ]}
      />

      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Transfer Points
              </CardTitle>
              <span className="text-sm text-gray-500">
                Available: <span className="font-semibold text-rewardly-blue">{availablePoints.toLocaleString()} pts</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfer Complete!</h3>
                <p className="text-gray-600 mb-6">
                  Successfully sent {formData.amount} points to {formData.recipientId}
                </p>
                <Button onClick={handleReset}>
                  Make Another Transfer
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
                    <User className="h-4 w-4 inline mr-1" />
                    Recipient UTORid
                  </label>
                  <input
                    type="text"
                    value={formData.recipientId}
                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                    placeholder="Enter recipient's UTORid"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can scan a QR code or manually enter the UTORid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Coins className="h-4 w-4 inline mr-1" />
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remark (optional)
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Add a note for this transfer"
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
                  {loading ? 'Processing...' : 'Send Points'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TransferPage

