import { PageHeader } from '@/components/layout'
import { QRCodeDisplay } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { getUser } from '@/utils/auth'
import { Info } from 'lucide-react'

const MyQRPage = () => {
  const user = getUser()

  return (
    <div>
      <PageHeader 
        title="My QR Code" 
        subtitle="Show this QR code to cashiers for transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My QR Code' }
        ]}
      />

      <div className="max-w-lg mx-auto space-y-6">
        <QRCodeDisplay
          value={user?.id || user?.utorid || 'USER_ID'}
          title="Your User QR Code"
          subtitle={`UTORid: ${user?.utorid || 'Unknown'}`}
          size={200}
        />

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">How to use</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Show this QR code to a cashier when making a purchase</li>
                  <li>• The cashier will scan your code to add points to your account</li>
                  <li>• You can also use this for peer-to-peer transfers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MyQRPage

