import { Navigate } from 'react-router-dom'
import { getUser } from '@/utils/auth'
import InsufficientPermissions from '@/pages/errors/InsufficientPermissions'

/**
 * ProtectedRoute - Wraps routes that require specific role permissions
 * 
 * @param {string} requiredRole - Minimum role required: 'cashier', 'manager', 'superuser'
 * @param {ReactNode} children - The component to render if authorized
 */
const ProtectedRoute = ({ requiredRole, children }) => {
  const user = getUser()
  const userRole = user?.role || 'regular'

  // Define role hierarchy (higher number = higher permissions)
  const roleHierarchy = {
    regular: 1,
    cashier: 2,
    manager: 3,
    superuser: 4
  }

  const userRoleLevel = roleHierarchy[userRole] || 1
  const requiredRoleLevel = roleHierarchy[requiredRole] || 1

  // Check if user has sufficient permissions
  if (userRoleLevel < requiredRoleLevel) {
    return <InsufficientPermissions />
  }

  return children
}

export default ProtectedRoute

