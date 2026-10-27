import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, FileText, MapPin, Bell, LogOut, Menu, X,
  BarChart3, Shield, ClipboardList, Plus, ChevronRight
} from 'lucide-react'
import api from '../services/api'

export default function DashboardLayout({ isAdmin }) {
  const { user, logout, isAdmin: userIsAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/map', label: 'City Map', icon: MapPin },
  ]
  const citizenNav = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/report', label: 'Report Issue', icon: Plus },
    { to: '/map', label: 'City Map', icon: MapPin },
    { to: '/track', label: 'Track Complaint', icon: FileText },
  ]
  const navItems = userIsAdmin ? adminNav : citizenNav

  useEffect(() => {
    if (!userIsAdmin) {
      api.get('/notifications?limit=5').then(r => { setUnread(r.data.unread || 0); setNotifications(r.data.notifications || []) }).catch(() => {})
    }
  }, [userIsAdmin])

  const isActive = (path) => location.pathname === path

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>CivicConnect</span>
          {userIsAdmin && <span className="ml-auto bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.to} to={item.to}
                className={isActive(item.to) ? 'sidebar-link-active' : 'sidebar-link'}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {isActive(item.to) && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:text-slate-900 p-1">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-medium text-slate-500">
              {userIsAdmin ? 'Administrator Panel' : 'Citizen Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!userIsAdmin && (
              <Link to="/report" className="btn-primary text-sm px-4 py-2 hidden sm:inline-flex">
                <Plus className="w-4 h-4" /> Report Issue
              </Link>
            )}

            {/* Notifications */}
            {!userIsAdmin && (
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none pulse-teal">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-fade-in overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                      {unread > 0 && <button onClick={markAllRead} className="text-teal-600 text-xs font-medium hover:underline">Mark all read</button>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No notifications yet</p>
                      ) : notifications.map(n => (
                        <div key={n._id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-teal-50/50' : ''}`}>
                          <div className="flex items-start gap-2">
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
