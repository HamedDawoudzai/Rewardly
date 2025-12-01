import { useState, useEffect, useContext } from 'react'
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
  ArrowRight,
  QrCode,
  Send
} from 'lucide-react'
import { transactionAPI } from '@/api/transactions'
import { eventAPI } from '@/api/events'
import { AuthContext } from '@/context/AuthContext'

const Dashboard = () => {
  const { user, refreshUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [stats, setStats] = useState({
    points: 0,
    pendingRedemptions: 0,
    transactionsThisMonth: 0,
    upcomingEvents: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Refresh user data for accurate points (this updates the navbar too)
      const freshUser = await refreshUser()

      // Fetch user's transactions
      const transactionsResponse = await transactionAPI.getMyTransactions({ limit: 10 })
      const transactions = transactionsResponse.results || transactionsResponse || []
      
      // Format transactions for display
      const formattedTransactions = transactions.slice(0, 3).map(tx => {
        // Handle different amount field names based on transaction type
        let amount = tx.amount || 0
        if (tx.type === 'transfer') {
          // Transfer uses 'sent' field, and it's negative for the sender
          amount = -(tx.sent || 0)
        } else if (tx.type === 'redemption') {
          // Redemptions are always negative (points being spent)
          const redemptionAmount = tx.redeemed || tx.amount || 0
          amount = -Math.abs(redemptionAmount)
        }
        
        // Format date - handle missing createdAt
        let dateStr = 'Recent'
        if (tx.createdAt) {
          try {
            const date = new Date(tx.createdAt)
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString()
            }
          } catch {
            dateStr = 'Recent'
          }
        }
        
        return {
          id: tx.id,
          type: tx.type,
          amount,
          description: tx.remark || `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} transaction`,
          date: dateStr
        }
      })
      setRecentTransactions(formattedTransactions)

      // Calculate stats from transactions
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const thisMonthCount = transactions.filter(tx => {
        if (!tx.createdAt) return false
        try {
          const txDate = new Date(tx.createdAt)
          if (isNaN(txDate.getTime())) return false
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
        } catch {
          return false
        }
      }).length
      
      const pendingRedemptions = transactions.filter(
        tx => tx.type === 'redemption' && !tx.processedAt && !tx.redeemed
      ).length

      // Fetch events where user has RSVP'd (upcoming)
      let rsvpedEvents = []
      try {
        const eventsResponse = await eventAPI.getAll({ limit: 100 })
        const allEvents = eventsResponse.results || eventsResponse || []
        
        // Filter for events user has RSVP'd to that haven't ended yet
        rsvpedEvents = allEvents.filter(event => {
          const isRsvped = event.isRsvped === true
          const endTime = new Date(event.endTime)
          const isUpcoming = endTime > now
          return isRsvped && isUpcoming
        }).slice(0, 3) // Show max 3 on dashboard
      } catch (err) {
        console.error('Failed to load events:', err)
      }

      setUpcomingEvents(rsvpedEvents)

      setStats({
        points: freshUser?.points || user?.points || 0,
        pendingRedemptions,
        transactionsThisMonth: thisMonthCount,
        upcomingEvents: rsvpedEvents.length
      })

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Fallback to cached user data
      setStats(prev => ({
        ...prev,
        points: user?.points || 0
      }))
    } finally {
      setLoading(false)
    }
  }

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

  const formatEventDate = (startTime) => {
    if (!startTime) return 'TBD'
    try {
      const date = new Date(startTime)
      if (isNaN(date.getTime())) return 'TBD'
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'TBD'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent" />
      </div>
    )
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
          value={(user?.points || 0).toLocaleString()}
          icon={Coins}
          variant="primary"
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
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
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
                    <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : tx.amount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming events. Browse events to RSVP!</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.name}</p>
                          <p className="text-sm text-gray-500">{formatEventDate(event.startTime)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-rewardly-blue">
                        +{event.points || event.pointsRemain || 0} pts
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
