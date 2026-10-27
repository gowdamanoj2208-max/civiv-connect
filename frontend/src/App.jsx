import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Layouts
const PublicLayout = lazy(() => import('./layouts/PublicLayout'))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))

// Public pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const TrackPage = lazy(() => import('./pages/TrackPage'))
const MapPage = lazy(() => import('./pages/MapPage'))

// Protected citizen pages
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const ComplaintDetailPage = lazy(() => import('./pages/ComplaintDetailPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminComplaints = lazy(() => import('./pages/AdminComplaints'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Loading CivicConnect...</p>
    </div>
  </div>
)

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Citizen dashboard */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>

        {/* Admin dashboard */}
        <Route element={<ProtectedRoute adminOnly><DashboardLayout isAdmin /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
