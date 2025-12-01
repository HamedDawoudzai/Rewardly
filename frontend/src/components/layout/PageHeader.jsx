import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href ? (
                <Link 
                  to={crumb.href} 
                  className="hover:text-rewardly-blue dark:hover:text-rewardly-light-blue transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 dark:text-gray-300">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      
      {/* Title and Actions Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-rewardly-dark-navy dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader

