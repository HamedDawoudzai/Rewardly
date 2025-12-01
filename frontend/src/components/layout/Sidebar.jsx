import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  Gift, 
  Calendar, 
  Users, 
  QrCode,
  Send,
  CreditCard,
  ShieldCheck,
  Megaphone,
  ClipboardList,
  ArrowLeft,
  UserPlus
} from 'lucide-react'
import { getUser } from '@/utils/auth'
import { useRoleView } from '@/context/RoleViewContext'

const Sidebar = () => {
  const user = getUser()
  const { isRoleView, exitRoleView } = useRoleView()
  
  // Determine user roles/capabilities
  const userRole = user?.role || ''
  const isCashier = ['cashier', 'manager', 'superuser'].includes(userRole)
  const isManager = ['manager', 'superuser'].includes(userRole)
  const isSuperuser = userRole === 'superuser'

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-rewardly-blue text-white shadow-md'
        : 'text-gray-600 hover:bg-rewardly-light-blue hover:text-rewardly-blue'
    }`

  // Role View Sidebar - Shows only role-specific actions
  if (isRoleView) {
    return (
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Back to Regular View */}
          <div>
            <button
              onClick={exitRoleView}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to User View
            </button>
          </div>

          {/* Cashier Section - Available to Cashier, Manager, Superuser */}
          {isCashier && (
            <div>
              <p className="px-4 text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Cashier
              </p>
              <nav className="space-y-1">
                <NavLink to="/cashier/transactions" className={navLinkClass}>
                  <CreditCard className="h-5 w-5" />
                  Create Transaction
                </NavLink>
                <NavLink to="/cashier/redemptions" className={navLinkClass}>
                  <ClipboardList className="h-5 w-5" />
                  Process Redemption
                </NavLink>
                <NavLink to="/cashier/users" className={navLinkClass}>
                  <UserPlus className="h-5 w-5" />
                  Create User
                </NavLink>
              </nav>
            </div>
          )}

          {/* Manager Section - Available to Manager, Superuser */}
          {isManager && (
            <div>
              <p className="px-4 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Manager
              </p>
              <nav className="space-y-1">
                <NavLink to="/manager/users" className={navLinkClass}>
                  <Users className="h-5 w-5" />
                  Manage Users
                </NavLink>
                <NavLink to="/manager/transactions" className={navLinkClass}>
                  <Receipt className="h-5 w-5" />
                  All Transactions
                </NavLink>
                <NavLink to="/manager/promotions" className={navLinkClass}>
                  <Megaphone className="h-5 w-5" />
                  Manage Promotions
                </NavLink>
                <NavLink to="/manager/events" className={navLinkClass}>
                  <Calendar className="h-5 w-5" />
                  Manage Events
                </NavLink>
              </nav>
            </div>
          )}

          {/* Superuser/Admin Section - Available only to Superuser */}
          {isSuperuser && (
            <div>
              <p className="px-4 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Admin
              </p>
              <nav className="space-y-1">
                <NavLink to="/admin/users" className={navLinkClass}>
                  <ShieldCheck className="h-5 w-5" />
                  User Roles
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </aside>
    )
  }

  // Regular User View Sidebar
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Main
          </p>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink to="/transactions" className={navLinkClass}>
              <Receipt className="h-5 w-5" />
              Transactions
            </NavLink>
            <NavLink to="/promotions" className={navLinkClass}>
              <Megaphone className="h-5 w-5" />
              Promotions
            </NavLink>
            <NavLink to="/events" className={navLinkClass}>
              <Calendar className="h-5 w-5" />
              Events
            </NavLink>
          </nav>
        </div>

        {/* User Actions */}
        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Actions
          </p>
          <nav className="space-y-1">
            <NavLink to="/my-qr" className={navLinkClass}>
              <QrCode className="h-5 w-5" />
              My QR Code
            </NavLink>
            <NavLink to="/transfer" className={navLinkClass}>
              <Send className="h-5 w-5" />
              Transfer Points
            </NavLink>
            <NavLink to="/redeem" className={navLinkClass}>
              <Gift className="h-5 w-5" />
              Redeem Points
            </NavLink>
          </nav>
        </div>

        {/* Organize Section - Available to all users (any user can be an event organizer) */}
        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Organize
          </p>
          <nav className="space-y-1">
            <NavLink to="/organizer/events" className={navLinkClass}>
              <Calendar className="h-5 w-5" />
              My Events
            </NavLink>
          </nav>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
