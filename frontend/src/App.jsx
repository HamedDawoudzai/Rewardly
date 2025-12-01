import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth'
import { AuthProvider } from '@/context/AuthContext'
import { DarkModeProvider } from '@/context/DarkModeContext'
import LandingPage from '@/components/LandingPage'

// Pages
import {
  ResetPasswordPage,
  Dashboard,
  ProfilePage,
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
  CreateUserPage,
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
    <DarkModeProvider>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
          
          {/* Protected Routes - Dashboard Layout */}
          <Route element={<DashboardLayout />}>
            {/* Main */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            
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
            
            {/* Cashier Routes - Requires cashier role or higher */}
            <Route path="/cashier/transactions" element={
              <ProtectedRoute requiredRole="cashier">
                <CreateTransactionPage />
              </ProtectedRoute>
            } />
            <Route path="/cashier/redemptions" element={
              <ProtectedRoute requiredRole="cashier">
                <ProcessRedemptionPage />
              </ProtectedRoute>
            } />
            <Route path="/cashier/users" element={
              <ProtectedRoute requiredRole="cashier">
                <CreateUserPage />
              </ProtectedRoute>
            } />
            
            {/* Event Organizer Routes - Available to all authenticated users */}
            <Route path="/organizer/events" element={<MyEventsPage />} />
            <Route path="/organizer/events/:id" element={<EventDetail />} />
            <Route path="/organizer/events/:id/edit" element={<OrganizerEditEventPage />} />
            <Route path="/organizer/events/:id/guests" element={<ManageGuestsPage />} />
            <Route path="/organizer/events/:id/award" element={<AwardPointsPage />} />
            
            {/* Manager Routes - Requires manager role or higher */}
            <Route path="/manager/users" element={
              <ProtectedRoute requiredRole="manager">
                <UsersManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/users/:id" element={
              <ProtectedRoute requiredRole="manager">
                <UserDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/transactions" element={
              <ProtectedRoute requiredRole="manager">
                <AllTransactionsPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/transactions/:id" element={
              <ProtectedRoute requiredRole="manager">
                <TransactionDetail />
              </ProtectedRoute>
            } />
            <Route path="/manager/promotions" element={
              <ProtectedRoute requiredRole="manager">
                <PromotionsManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/promotions/new" element={
              <ProtectedRoute requiredRole="manager">
                <CreatePromotionPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/promotions/:id" element={
              <ProtectedRoute requiredRole="manager">
                <PromotionDetail />
              </ProtectedRoute>
            } />
            <Route path="/manager/promotions/:id/edit" element={
              <ProtectedRoute requiredRole="manager">
                <CreatePromotionPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/events" element={
              <ProtectedRoute requiredRole="manager">
                <EventsManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/events/new" element={
              <ProtectedRoute requiredRole="manager">
                <CreateEventPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/events/:id" element={
              <ProtectedRoute requiredRole="manager">
                <EventDetail />
              </ProtectedRoute>
            } />
            <Route path="/manager/events/:id/edit" element={
              <ProtectedRoute requiredRole="manager">
                <CreateEventPage />
              </ProtectedRoute>
            } />
            <Route path="/manager/events/:id/attendees" element={
              <ProtectedRoute requiredRole="manager">
                <EventDetail />
              </ProtectedRoute>
            } />
            
            {/* Superuser/Admin Routes - Requires superuser role */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="superuser">
                <UserRolesPage />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </DarkModeProvider>
  )
}

export default App
