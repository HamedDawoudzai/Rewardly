import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout'
import { QRCodeDisplay } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Info, Clock } from 'lucide-react'

const RedemptionQRPage = () => {
  const { id } = useParams()

  // Mock data - will be replaced with API call
  const redemption = {
    id: id,
    amount: 500,
    status: 'pending',
    createdAt: '2025-11-28T10:30:00Z'
  }

  return (
    <div>
      <PageHeader 
        title="Redemption QR Code" 
        subtitle="Show this to a cashier to process your redemption"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Redeem Points', href: '/redeem' },
          { label: `Redemption ${id}` }
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
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Pending Processing</p>
                <p className="text-sm text-orange-700">
                  This redemption is waiting to be processed by a cashier
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-rewardly-blue">{redemption.amount}</p>
              <p className="text-gray-500">Points to redeem</p>
            </div>
            
            <QRCodeDisplay
              value={redemption.id}
              title="Scan to Process"
              subtitle={`Redemption ID: ${redemption.id}`}
              size={200}
            />
            
            <div className="mt-4 text-center text-sm text-gray-500">
              Created on {new Date(redemption.createdAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}

export default RedemptionQRPage

