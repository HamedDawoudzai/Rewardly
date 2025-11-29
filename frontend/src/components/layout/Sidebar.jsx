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
  UserCog,
  ClipboardList
} from 'lucide-react'
import { getUser } from '@/utils/auth'

const Sidebar = () => {
  const user = getUser()
  
  // Determine user roles/capabilities
  const roles = user?.roles || []
  const isCashier = roles.includes('cashier') || roles.includes('manager') || roles.includes('superuser')
  const isManager = roles.includes('manager') || roles.includes('superuser')
  const isSuperuser = roles.includes('superuser')
  const isEventOrganizer = user?.isEventOrganizer || isManager

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-rewardly-blue text-white shadow-md'
        : 'text-gray-600 hover:bg-rewardly-light-blue hover:text-rewardly-blue'
    }`

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

        {/* Cashier Section */}
        {isCashier && (
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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
            </nav>
          </div>
        )}

        {/* Event Organizer Section */}
        {isEventOrganizer && (
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Event Organizer
            </p>
            <nav className="space-y-1">
              <NavLink to="/organizer/events" className={navLinkClass}>
                <Calendar className="h-5 w-5" />
                My Events
              </NavLink>
            </nav>
          </div>
        )}

        {/* Manager Section */}
        {isManager && (
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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

        {/* Superuser Section */}
        {isSuperuser && (
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Superuser
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

export default Sidebar

