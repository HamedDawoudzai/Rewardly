import { Button } from '@/components/ui/button'

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="h-16 w-16 rounded-full bg-rewardly-light-blue flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-rewardly-blue" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {(action || onAction) && (
        <Button onClick={onAction}>
          {actionLabel || 'Get Started'}
        </Button>
      )}
    </div>
  )
}

export default EmptyState

