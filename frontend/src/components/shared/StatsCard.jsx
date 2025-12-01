import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

const StatsCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  trendValue,
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    primary: 'bg-gradient-to-br from-rewardly-blue to-rewardly-dark-navy text-white',
    success: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    warning: 'bg-gradient-to-br from-orange-400 to-orange-500 text-white',
  }

  const isPositiveTrend = trend === 'up'
  const textColor = variant === 'default' ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'
  const valueColor = variant === 'default' ? 'text-rewardly-dark-navy dark:text-white' : 'text-white'

  return (
    <Card className={`${variants[variant]} border-0 shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${textColor}`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${valueColor}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm ${textColor}`}>
                {subtitle}
              </p>
            )}
            {trendValue && (
              <div className="flex items-center gap-1">
                {isPositiveTrend ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  isPositiveTrend ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${
              variant === 'default' 
                ? 'bg-rewardly-light-blue dark:bg-rewardly-blue/20' 
                : 'bg-white/20'
            }`}>
              <Icon className={`h-6 w-6 ${
                variant === 'default' 
                  ? 'text-rewardly-blue dark:text-rewardly-light-blue' 
                  : 'text-white'
              }`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StatsCard

