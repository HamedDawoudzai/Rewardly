import { useState, useContext } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { transactionAPI } from '@/api/transactions'
import { Send, User, Coins, AlertCircle, CheckCircle } from 'lucide-react'
import { AuthContext } from '@/context/AuthContext'

const TransferPage = () => {
  const { user, refreshUser } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    recipientId: '',
    amount: '',
    remark: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [transferResult, setTransferResult] = useState(null)

  const availablePoints = user?.points || 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    const recipientId = parseInt(formData.recipientId)
    const amount = parseInt(formData.amount)
    
    if (!recipientId || isNaN(recipientId)) {
      setError('Please enter a valid recipient User ID')
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
      const result = await transactionAPI.transferPoints(recipientId, amount, formData.remark)
      setTransferResult(result)
      setSuccess(true)
      // Refresh user data to update points balance in navbar
      await refreshUser()
    } catch (err) {
      console.error('Transfer error:', err)
      setError(err.message || 'Transfer failed. Please check the recipient ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ recipientId: '', amount: '', remark: '' })
    setSuccess(false)
    setError('')
    setTransferResult(null)
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Available: <span className="font-semibold text-rewardly-blue dark:text-rewardly-light-blue">{availablePoints.toLocaleString()} pts</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Transfer Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Successfully sent {formData.amount} points
                </p>
                {transferResult && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Transaction ID: #{transferResult.id}
                  </p>
                )}
                <Button onClick={handleReset}>
                  Make Another Transfer
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
                    Recipient User ID
                  </label>
                  <input
                    type="number"
                    value={formData.recipientId}
                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                    placeholder="Enter recipient's User ID"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={loading}
                    min="1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get the User ID by scanning their QR code
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      disabled={loading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      pts
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remark (optional)
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Add a note for this transfer"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
