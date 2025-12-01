import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { isAuthenticated } from '@/utils/auth'
import { RoleViewProvider } from '@/context/RoleViewContext'

const DashboardLayout = () => {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  return (
    <RoleViewProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="ml-64 pt-16 min-h-screen">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RoleViewProvider>
  )
}

export default DashboardLayout
