import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useContext } from 'react'
import rewardlyLogo from '@/assets/rewardly_cropped.png'
import { clearAuth } from '@/utils/auth'
import { AuthContext } from '@/context/AuthContext'

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

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

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
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
