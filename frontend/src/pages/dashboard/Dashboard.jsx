import { PageHeader } from '@/components/layout'
import { StatsCard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { 
  Coins, 
  Receipt, 
  Gift, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  QrCode,
  Send
} from 'lucide-react'
import { getUser } from '@/utils/auth'

const Dashboard = () => {
  const user = getUser()
  
  // Mock data - will be replaced with real API calls
  const stats = {
    points: user?.points || 1250,
    pendingRedemptions: 2,
    transactionsThisMonth: 15,
    upcomingEvents: 3
  }

  const recentTransactions = [
    { id: 1, type: 'purchase', amount: 150, date: '2025-11-28', description: 'Coffee purchase' },
    { id: 2, type: 'transfer', amount: -50, date: '2025-11-27', description: 'Transfer to john_doe' },
    { id: 3, type: 'event', amount: 200, date: '2025-11-26', description: 'Workshop attendance' },
  ]

  const upcomingEvents = [
    { id: 1, name: 'Tech Workshop', date: '2025-12-01', points: 100 },
    { id: 2, name: 'Holiday Party', date: '2025-12-15', points: 50 },
  ]

  const getTransactionColor = (type) => {
    const colors = {
      purchase: 'bg-green-100 text-green-700',
      transfer: 'bg-blue-100 text-blue-700',
      redemption: 'bg-orange-100 text-orange-700',
      event: 'bg-purple-100 text-purple-700',
      adjustment: 'bg-gray-100 text-gray-700',
    }
    return colors[type] || colors.adjustment
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.name || 'User'}!`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Available Points"
          value={stats.points.toLocaleString()}
          icon={Coins}
          variant="primary"
          trend="up"
          trendValue="+12% this month"
        />
        <StatsCard
          title="Pending Redemptions"
          value={stats.pendingRedemptions}
          icon={Gift}
          subtitle="Awaiting processing"
        />
        <StatsCard
          title="Transactions"
          value={stats.transactionsThisMonth}
          icon={Receipt}
          subtitle="This month"
        />
        <StatsCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Calendar}
          subtitle="RSVP'd events"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/my-qr">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-rewardly-light-blue flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <QrCode className="h-6 w-6 text-rewardly-blue" />
              </div>
              <p className="font-medium text-gray-900">My QR Code</p>
              <p className="text-sm text-gray-500">For transactions</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/transfer">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900">Transfer Points</p>
              <p className="text-sm text-gray-500">Send to others</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/redeem">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Gift className="h-6 w-6 text-orange-600" />
              </div>
              <p className="font-medium text-gray-900">Redeem Points</p>
              <p className="text-sm text-gray-500">Get rewards</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/events">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Browse Events</p>
              <p className="text-sm text-gray-500">Earn points</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTransactionColor(tx.type)}`}>
                      {tx.type}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
            <Link to="/events">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-rewardly-blue">
                    +{event.points} pts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

