import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Percent,
  Hash,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart
} from 'recharts'
import { analyticsAPI } from '@/api/analytics'

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('weekly')
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [trendsResponse, statsResponse] = await Promise.all([
        analyticsAPI.getSpendingTrends({ period }),
        analyticsAPI.getStats()
      ])
      setData(trendsResponse)
      setStats(statsResponse)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className="h-5 w-5 text-green-500" />
    if (direction === 'down') return <TrendingDown className="h-5 w-5 text-red-500" />
    return <Minus className="h-5 w-5 text-gray-500" />
  }

  const getTrendColor = (direction) => {
    if (direction === 'up') return 'text-green-600'
    if (direction === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendBg = (direction) => {
    if (direction === 'up') return 'bg-green-100 dark:bg-green-900/30'
    if (direction === 'down') return 'bg-red-100 dark:bg-red-900/30'
    return 'bg-gray-100 dark:bg-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-rewardly-blue border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Analyzing transaction data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Spending Analytics"
        subtitle="Analyze transaction spending trends over time"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manager' },
          { label: 'Analytics' }
        ]}
        actions={
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="capitalize"
              >
                {p}
              </Button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-blue-100 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Spending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${data.summary.totalSpending.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 border-purple-100 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Avg per {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${data.summary.averagePerPeriod.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${
              data.summary.trend.direction === 'up' 
                ? 'from-green-50 to-white dark:from-green-900/20 border-green-100 dark:border-green-800' 
                : data.summary.trend.direction === 'down'
                ? 'from-red-50 to-white dark:from-red-900/20 border-red-100 dark:border-red-800'
                : 'from-gray-50 to-white dark:from-gray-800/50 border-gray-100 dark:border-gray-700'
            } dark:to-gray-800`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${getTrendBg(data.summary.trend.direction)}`}>
                    {getTrendIcon(data.summary.trend.direction)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trend</p>
                    <p className={`text-2xl font-bold ${getTrendColor(data.summary.trend.direction)}`}>
                      {data.summary.trend.direction === 'up' ? '+' : 
                       data.summary.trend.direction === 'down' ? '-' : ''}
                      {data.summary.trend.percentage}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border-indigo-100 dark:border-indigo-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                    <Hash className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.summary.transactionCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-rewardly-blue" />
                    Spending Trends
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {data.summary.trend.description}
                  </p>
                </div>
                {data.meta && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    <p>{data.meta.dataRange.start} to {data.meta.dataRange.end}</p>
                    <p className="text-xs">{data.meta.periodsAnalyzed} {period === 'daily' ? 'days' : period === 'weekly' ? 'weeks' : 'months'} analyzed</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.historical} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={period === 'daily' ? 6 : 0}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Spending']}
                      labelFormatter={(label) => label}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#spendingGradient)"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Min/Max/StdDev Stats */}
              {data.summary.minSpending !== undefined && (
                <div className="mt-6 border-t dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Minimum</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ${data.summary.minSpending.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Maximum</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ${data.summary.maxSpending.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Std Deviation</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ±${data.summary.standardDeviation.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Percent className="h-5 w-5 text-green-500" />
                    Transaction Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.byType?.map((item) => (
                      <div key={item.type} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{item.type}</span>
                        <div className="text-right">
                          <span className="font-medium">{item.count} transactions</span>
                          <p className="text-xs text-gray-500">{item.totalPoints?.toLocaleString() || 0} points</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t dark:border-gray-700 pt-4 mt-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Total Points in Circulation</span>
                        <span className="font-bold text-blue-600">
                          {stats.totalPointsInCirculation?.toLocaleString() || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Pending Redemptions</span>
                        <span className="font-bold text-orange-600">
                          {stats.pendingRedemptions || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsPage
