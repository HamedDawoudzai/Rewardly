import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Calendar, Hash, FileText, Tag, AlertTriangle } from 'lucide-react'

const TransactionDetail = () => {
  const { id } = useParams()

  // Mock data - will be replaced with real API call
  const transaction = {
    id: parseInt(id),
    type: 'purchase',
    amount: 150,
    spent: 15.00,
    createdBy: 'cashier1',
    relatedId: 'user123',
    promotionIds: [1, 2],
    remark: 'Coffee purchase at campus cafe',
    suspicious: false,
    createdAt: '2025-11-28T10:30:00Z'
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
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Created By
                </label>
                <p className="text-gray-900">{transaction.createdBy}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Related User
                </label>
                <p className="text-gray-900">{transaction.relatedId || '—'}</p>
              </div>
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
          </CardContent>
        </Card>

        {/* Points Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Points Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className={`text-4xl font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </p>
              <p className="text-gray-500 mt-1">Points</p>
            </div>
            
            {transaction.spent && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Spent</span>
                  <span className="font-medium">${transaction.spent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Points Rate</span>
                  <span className="font-medium">{(transaction.amount / transaction.spent).toFixed(1)}x</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TransactionDetail

