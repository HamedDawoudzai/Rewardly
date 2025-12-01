import { PageHeader } from '@/components/layout'
import { QRCodeDisplay } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { getUser } from '@/utils/auth'
import { Info, User } from 'lucide-react'

const MyQRPage = () => {
  const user = getUser()
  const utorid = user?.utorid || 'unknown'

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
        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-rewardly-blue to-rewardly-dark-navy text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Logged in as</p>
                <p className="text-xl font-bold">{user?.name || 'User'}</p>
                <p className="text-white/90 font-mono">@{utorid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code - Uses UTORid */}
        <QRCodeDisplay
          value={utorid}
          title="Your User QR Code"
          subtitle="Scan this to identify you for transactions"
          size={220}
        />

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">How to use your QR Code</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-900">1.</span>
                    <span><strong>For purchases:</strong> Show this QR code to a cashier. They'll scan it to record your purchase and add points to your account.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-blue-900">2.</span>
                    <span><strong>For transfers:</strong> Share your UTORid with another user so they can send you points.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Balance */}
        {user?.points !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-bold text-rewardly-blue">
                  {user.points.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">points</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyQRPage
