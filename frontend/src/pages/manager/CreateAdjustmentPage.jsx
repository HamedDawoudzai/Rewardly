import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sliders, User, Hash, Link2, FileText, AlertCircle, CheckCircle, Plus, Minus, Info } from 'lucide-react'
import { adminTransactionAPI } from '@/api/transactions'

const CreateAdjustmentPage = () => {
  const [searchParams] = useSearchParams()
  
  // Pre-fill from URL parameters
  const [formData, setFormData] = useState({
    utorid: searchParams.get('utorid') || '',
    amount: '',
    relatedId: searchParams.get('relatedId') || '',
    remark: ''
  })
  
  // Track if this was pre-filled from a related transaction
  const isRelatedTransaction = searchParams.get('relatedId') !== null
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
    
    const amount = parseInt(formData.amount)
    if (isNaN(amount) || amount === 0) {
      setError('Please enter a valid non-zero amount')
      setLoading(false)
      return
    }

    try {
      const payload = {
        utorid: formData.utorid.trim(),
        amount: amount,
        remark: formData.remark.trim() || null
      }
      
      // Only include relatedId if provided
      if (formData.relatedId.trim()) {
        const relatedId = parseInt(formData.relatedId)
        if (isNaN(relatedId) || relatedId <= 0) {
          setError('Related Transaction ID must be a valid positive number')
          setLoading(false)
          return
        }
        payload.relatedId = relatedId
      }

      const response = await adminTransactionAPI.createAdjustment(payload)
      
      setResult({
        id: response.id,
        amount: amount,
        user: formData.utorid,
        relatedId: formData.relatedId || null
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to create adjustment')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ utorid: '', amount: '', relatedId: '', remark: '' })
    setSuccess(false)
    setError('')
    setResult(null)
  }

  const amount = parseInt(formData.amount) || 0
  const isPositive = amount > 0
  const isNegative = amount < 0

  return (
    <div>
      <PageHeader 
        title="Create Adjustment" 
        subtitle="Create a points adjustment for a user's account"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Create Adjustment' }
        ]}
      />

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              New Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  result?.amount > 0 ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <CheckCircle className={`h-8 w-8 ${
                    result?.amount > 0 ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Adjustment Created!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Successfully adjusted points for <span className="font-medium">{result?.user}</span>
                </p>
                
                <div className={`rounded-lg p-4 mb-6 ${
                  result?.amount > 0 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : 'bg-orange-50 dark:bg-orange-900/20'
                }`}>
                  <p className={`text-3xl font-bold ${
                    result?.amount > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {result?.amount > 0 ? '+' : ''}{result?.amount} pts
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transaction ID: #{result?.id}
                  </p>
                  {result?.relatedId && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Related to Transaction #{result?.relatedId}
                    </p>
                  )}
                </div>
                
                <Button onClick={handleReset}>
                  Create Another Adjustment
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

                {isRelatedTransaction && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    Creating adjustment for transaction #{searchParams.get('relatedId')}
                  </div>
                )}

                {/* User UTORid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    User UTORid <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.utorid}
                    onChange={(e) => setFormData({ ...formData, utorid: e.target.value })}
                    placeholder="Enter user's UTORid"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="h-4 w-4 inline mr-1" />
                    Points Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g., 100 or -50"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        isPositive 
                          ? 'border-green-300 dark:border-green-600' 
                          : isNegative 
                            ? 'border-orange-300 dark:border-orange-600' 
                            : 'border-gray-300 dark:border-gray-600'
                      }`}
                      disabled={loading}
                    />
                    {amount !== 0 && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        isPositive ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isPositive ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Positive value adds points, negative value deducts points
                  </p>
                  {amount !== 0 && (
                    <p className={`text-sm mt-1 font-medium ${
                      isPositive ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      User will {isPositive ? 'receive' : 'lose'} {Math.abs(amount)} points
                    </p>
                  )}
                </div>

                {/* Related Transaction ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Link2 className="h-4 w-4 inline mr-1" />
                    Related Transaction ID <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.relatedId}
                    onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                    placeholder="e.g., 1234"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If this adjustment is related to a specific transaction (e.g., a correction)
                  </p>
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Remark <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Reason for this adjustment..."
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
                  {loading ? 'Creating Adjustment...' : 'Create Adjustment'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreateAdjustmentPage

