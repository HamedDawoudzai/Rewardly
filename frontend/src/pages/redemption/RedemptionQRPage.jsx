import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { QRCodeDisplay } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Info, Clock, CheckCircle } from 'lucide-react'
import { transactionAPI } from '@/api/transactions'

const RedemptionQRPage = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [redemption, setRedemption] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRedemption()
  }, [id])

  const loadRedemption = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await transactionAPI.getById(id)
      if (!tx || tx.type !== 'redemption') {
        setError('Redemption not found')
      } else {
        setRedemption(tx)
      }
    } catch (err) {
      console.error('Failed to load redemption:', err)
      setError(err.message || 'Failed to load redemption')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
  }

  if (error || !redemption) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Redemption not found'}</p>
        <Link to="/redeem">
          <Button variant="outline" className="mt-4">Back to Redemptions</Button>
        </Link>
      </div>
    )
  }

  const isProcessed = !!redemption.processedAt

  return (
    <div>
      <PageHeader 
        title="Redemption QR Code" 
        subtitle="Show this to a cashier to process your redemption"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Redeem Points', href: '/redeem' },
          { label: `Redemption #${id}` }
        ]}
        actions={
          <Link to="/redeem">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Status Banner */}
        <Card className={isProcessed ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {isProcessed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Processed</p>
                    <p className="text-sm text-green-700">
                      This redemption was processed on {new Date(redemption.processedAt).toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Pending Processing</p>
                    <p className="text-sm text-orange-700">
                      This redemption is waiting to be processed by a cashier
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Redemption Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-rewardly-blue">{Math.abs(redemption.amount)}</p>
              <p className="text-gray-500">Points to redeem</p>
            </div>
            
            {!isProcessed && (
              <QRCodeDisplay
                value={`redemption:${redemption.id}`}
                title="Scan to Process"
                subtitle={`Transaction #${redemption.id}`}
                size={200}
              />
            )}
            
            <div className="mt-4 text-center text-sm text-gray-500">
              Created on {new Date(redemption.createdAt).toLocaleString()}
            </div>

            {redemption.remark && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Remark:</strong> {redemption.remark}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {!isProcessed && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Instructions</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Show this QR code to a cashier</li>
                    <li>• The cashier will scan and process your redemption</li>
                    <li>• You'll receive the equivalent value in store credit or cash</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default RedemptionQRPage
