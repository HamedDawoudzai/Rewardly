import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, User, DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { adminTransactionAPI } from '@/api/transactions'

const CreateTransactionPage = () => {
  const [formData, setFormData] = useState({
    utorid: '',
    type: 'purchase',
    spent: '',
    remark: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

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
        remark: formData.remark || null
      })
      
      setResult({
        points: response.earned || 0,
        spent: formData.spent,
        user: formData.utorid
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
    setSuccess(false)
    setError('')
    setResult(null)
  }

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

      <div className="max-w-xl mx-auto">
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
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Complete!</h3>
                <p className="text-gray-600 mb-4">
                  Successfully recorded transaction for <span className="font-medium">{result?.user}</span>
                </p>
                
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <p className="text-3xl font-bold text-green-600">+{result?.points} pts</p>
                  <p className="text-sm text-gray-500">earned from ${result?.spent} spent</p>
                </div>
                
                <Button onClick={handleReset}>
                  Create Another Transaction
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
                  <label className="block text-sm font-medium text-white mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Customer UTORid
                  </label>
                  <input
                    type="text"
                    value={formData.utorid}
                    onChange={(e) => setFormData({ ...formData, utorid: e.target.value })}
                    placeholder="Enter or scan customer's UTORid"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-white mt-1">
                    You can scan the customer's QR code or manually enter their UTORid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="purchase">Purchase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Amount Spent
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.spent}
                      onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                  {formData.spent && (
                    <p className="text-sm text-rewardly-blue mt-1">
                      Customer will earn ~{Math.round(parseFloat(formData.spent) / 0.25)} points
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Remark (optional)
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Add a note for this transaction"
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

