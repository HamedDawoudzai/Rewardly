import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, ChevronDown, Shield, Briefcase, UserCog } from 'lucide-react'
import { useState, useRef, useEffect, useContext } from 'react'
import rewardlyLogo from '@/assets/rewardly_cropped.png'
import { clearAuth, getUser } from '@/utils/auth'
import { AuthContext } from '@/context/AuthContext'
import { useRoleView } from '@/context/RoleViewContext'

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { isRoleView, toggleRoleView } = useRoleView()

  // Determine user's highest role
  const currentUser = getUser()
  const userRole = currentUser?.role || ''
  const isCashier = ['cashier', 'manager', 'superuser'].includes(userRole)
  const isManager = ['manager', 'superuser'].includes(userRole)
  const isSuperuser = userRole === 'superuser'

  // Determine the role view label and icon
  const getRoleViewInfo = () => {
    if (isSuperuser) {
      return { label: 'Admin View', icon: Shield, color: 'bg-purple-600 hover:bg-purple-700' }
    }
    if (isManager) {
      return { label: 'Manager View', icon: Briefcase, color: 'bg-blue-600 hover:bg-blue-700' }
    }
    if (isCashier) {
      return { label: 'Cashier View', icon: UserCog, color: 'bg-green-600 hover:bg-green-700' }
    }
    return null
  }

  const roleViewInfo = getRoleViewInfo()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
            <img 
              src={rewardlyLogo} 
              alt="Rewardly Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-bold font-heading text-rewardly-dark-navy">
            Rewardly
          </span>
        </Link>

        {/* Right side - Role View Button and User menu */}
        <div className="flex items-center gap-4">
          {/* Role View Toggle Button */}
          {roleViewInfo && (
            <button
              onClick={toggleRoleView}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 ${
                isRoleView 
                  ? roleViewInfo.color 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <roleViewInfo.icon className="h-4 w-4" />
              <span className="hidden sm:block">{roleViewInfo.label}</span>
              {isRoleView && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">ON</span>
              )}
            </button>
          )}

          {/* Points Display */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-rewardly-light-blue rounded-full">
            <span className="text-sm text-rewardly-blue font-medium">
              {user?.points?.toLocaleString() || 0} points
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-rewardly-blue flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.utorid || user?.email}</p>
                  <p className="text-xs text-rewardly-blue font-medium mt-1 capitalize">
                    {user?.role || 'Regular User'}
                  </p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Link>
                
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                
                <hr className="my-2 border-gray-100" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
