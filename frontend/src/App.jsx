import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout'
import { AuthProvider } from '@/context/AuthContext'
import LandingPage from '@/components/LandingPage'

// Pages
import {
  Dashboard,
  ProfilePage,
  SettingsPage,
  TransactionsPage,
  TransactionDetail,
  PromotionsPage,
  PromotionDetail,
  EventsPage,
  EventDetail,
  MyQRPage,
  TransferPage,
  RedeemPage,
  RedemptionQRPage,
  CreateTransactionPage,
  ProcessRedemptionPage,
  UsersManagementPage,
  UserDetailPage,
  AllTransactionsPage,
  PromotionsManagementPage,
  CreatePromotionPage,
  EventsManagementPage,
  CreateEventPage,
  MyEventsPage,
  AwardPointsPage,
  OrganizerEditEventPage,
  ManageGuestsPage,
  UserRolesPage
} from '@/pages'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected Routes - Dashboard Layout */}
          <Route element={<DashboardLayout />}>
            {/* Main */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* User Features */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/promotions/:id" element={<PromotionDetail />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetail />} />
            
            {/* User Actions */}
            <Route path="/my-qr" element={<MyQRPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/redemption/:id" element={<RedemptionQRPage />} />
            
            {/* Cashier Routes */}
            <Route path="/cashier/transactions" element={<CreateTransactionPage />} />
            <Route path="/cashier/redemptions" element={<ProcessRedemptionPage />} />
            
            {/* Event Organizer Routes */}
            <Route path="/organizer/events" element={<MyEventsPage />} />
            <Route path="/organizer/events/:id" element={<EventDetail />} />
            <Route path="/organizer/events/:id/edit" element={<OrganizerEditEventPage />} />
            <Route path="/organizer/events/:id/guests" element={<ManageGuestsPage />} />
            <Route path="/organizer/events/:id/award" element={<AwardPointsPage />} />
            
            {/* Manager Routes */}
            <Route path="/manager/users" element={<UsersManagementPage />} />
            <Route path="/manager/users/:id" element={<UserDetailPage />} />
            <Route path="/manager/transactions" element={<AllTransactionsPage />} />
            <Route path="/manager/transactions/:id" element={<TransactionDetail />} />
            <Route path="/manager/promotions" element={<PromotionsManagementPage />} />
            <Route path="/manager/promotions/new" element={<CreatePromotionPage />} />
            <Route path="/manager/promotions/:id" element={<PromotionDetail />} />
            <Route path="/manager/promotions/:id/edit" element={<CreatePromotionPage />} />
            <Route path="/manager/events" element={<EventsManagementPage />} />
            <Route path="/manager/events/new" element={<CreateEventPage />} />
            <Route path="/manager/events/:id" element={<EventDetail />} />
            <Route path="/manager/events/:id/edit" element={<CreateEventPage />} />
            <Route path="/manager/events/:id/attendees" element={<EventDetail />} />
            
            {/* Superuser/Admin Routes */}
            <Route path="/admin/users" element={<UserRolesPage />} />
          </Route>
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
