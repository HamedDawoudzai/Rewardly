import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Calendar, Hash, FileText, Tag, AlertTriangle, ArrowRight } from 'lucide-react'
import { transactionAPI } from '@/api/transactions'

const TransactionDetail = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTransaction()
  }, [id])

  const loadTransaction = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await transactionAPI.getById(id)
      if (!tx) {
        setError('Transaction not found')
      } else {
        setTransaction(tx)
      }
    } catch (err) {
      console.error('Failed to load transaction:', err)
      setError(err.message || 'Failed to load transaction')
    } finally {
      setLoading(false)
    }
  }

  const getTypeStyles = (type) => {
    const styles = {
      purchase: 'bg-green-100 text-green-700',
      transfer: 'bg-blue-100 text-blue-700',
      redemption: 'bg-orange-100 text-orange-700',
      event: 'bg-purple-100 text-purple-700',
      adjustment: 'bg-gray-100 text-gray-700',
    }
    return styles[type] || styles.adjustment
  }

  // Get the points amount based on transaction type
  const getPointsAmount = () => {
    if (!transaction) return 0
    
    if (transaction.type === 'transfer') {
      // Transfer uses 'sent' field - negative for sender
      return -(transaction.sent || 0)
    } else if (transaction.type === 'redemption') {
      // Redemption uses 'redeemed' (if processed) or 'amount' (if pending)
      return -(transaction.redeemed || transaction.amount || 0)
    }
    // Other types use 'amount'
    return transaction.amount || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Transaction not found'}</p>
        <Link to="/transactions">
          <Button variant="outline" className="mt-4">Back to Transactions</Button>
        </Link>
      </div>
    )
  }

  const pointsAmount = getPointsAmount()

  return (
    <div>
      <PageHeader 
        title={`Transaction #${id}`}
        subtitle="View transaction details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Transactions', href: '/transactions' },
          { label: `#${id}` }
        ]}
        actions={
          <Link to="/transactions">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction Details</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getTypeStyles(transaction.type)}`}>
                {transaction.type}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Transaction ID
                </label>
                <p className="text-gray-900 font-mono">#{transaction.id}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date & Time
                </label>
                <p className="text-gray-900">
                  {transaction.createdAt 
                    ? new Date(transaction.createdAt).toLocaleString() 
                    : 'Recently'}
                </p>
              </div>
              
              {/* Show sender/recipient for transfers */}
              {transaction.type === 'transfer' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      From
                    </label>
                    <p className="text-gray-900">{transaction.sender || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      To
                    </label>
                    <p className="text-gray-900">{transaction.recipient || 'Unknown'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Created By
                    </label>
                    <p className="text-gray-900">{transaction.createdBy || 'System'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Related User/Entity
                    </label>
                    <p className="text-gray-900">{transaction.relatedId || transaction.utorid || '—'}</p>
                  </div>
                </>
              )}
            </div>

            <hr />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Remark
              </label>
              <p className="text-gray-900">{transaction.remark || 'No remark provided'}</p>
            </div>

            {transaction.promotionIds?.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Applied Promotions
                </label>
                <div className="flex gap-2">
                  {transaction.promotionIds.map((promoId) => (
                    <Link 
                      key={promoId}
                      to={`/promotions/${promoId}`}
                      className="px-3 py-1 bg-rewardly-light-blue text-rewardly-blue rounded-full text-sm font-medium hover:bg-rewardly-blue hover:text-white transition-colors"
                    >
                      Promotion #{promoId}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {transaction.suspicious && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">Suspicious Transaction</p>
                  <p className="text-sm text-red-600">This transaction has been flagged for review.</p>
                </div>
              </div>
            )}

            {transaction.type === 'redemption' && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                transaction.processedAt || transaction.redeemed
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div>
                  <p className={`font-medium ${transaction.processedAt || transaction.redeemed ? 'text-green-700' : 'text-orange-700'}`}>
                    {transaction.processedAt || transaction.redeemed ? 'Processed' : 'Pending Processing'}
                  </p>
                  <p className={`text-sm ${transaction.processedAt || transaction.redeemed ? 'text-green-600' : 'text-orange-600'}`}>
                    {transaction.processedAt 
                      ? `Processed on ${new Date(transaction.processedAt).toLocaleString()}`
                      : transaction.redeemed 
                        ? 'This redemption has been processed'
                        : 'This redemption is awaiting cashier processing'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Points Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className={`text-4xl font-bold ${pointsAmount > 0 ? 'text-green-600' : pointsAmount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {pointsAmount > 0 ? '+' : ''}{pointsAmount}
              </p>
              <p className="text-gray-500 mt-1">Points</p>
            </div>
            
            {/* Transfer details */}
            {transaction.type === 'transfer' && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">{transaction.sender}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-medium">{transaction.recipient}</span>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1">
                  {transaction.sent} points transferred
                </p>
              </div>
            )}

            {/* Purchase details */}
            {transaction.spent && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Spent</span>
                  <span className="font-medium">${parseFloat(transaction.spent).toFixed(2)}</span>
                </div>
                {pointsAmount > 0 && transaction.spent > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Points Rate</span>
                    <span className="font-medium">{(pointsAmount / transaction.spent).toFixed(1)}x</span>
                  </div>
                )}
              </div>
            )}

            {/* Redemption details */}
            {transaction.type === 'redemption' && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${transaction.redeemed || transaction.processedAt ? 'text-green-600' : 'text-orange-600'}`}>
                    {transaction.redeemed || transaction.processedAt ? 'Processed' : 'Pending'}
                  </span>
                </div>
                {transaction.processedBy && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Processed By</span>
                    <span className="font-medium">{transaction.processedBy}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TransactionDetail
