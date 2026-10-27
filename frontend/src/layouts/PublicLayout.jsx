import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Bell, MapPin, Menu, X, ChevronDown, LogOut, User, LayoutDashboard, FileText } from 'lucide-react'
import api from '../services/api'

export default function PublicLayout() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const profileRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications?limit=1').then(r => setUnread(r.data.unread || 0)).catch(() => {})
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClick = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/map', label: 'City Map' },
    { to: '/track', label: 'Track Issue' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                CivicConnect
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(l.to) ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/report" className="btn-primary text-sm px-4 py-2">Report Issue</Link>
                  <div className="relative" ref={profileRef}>
                    <button onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                      {unread > 0 && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                        <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-sm">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        {!isAdmin && (
                          <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-sm">
                            <FileText className="w-4 h-4" /> My Complaints
                            {unread > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>}
                          </Link>
                        )}
                        <hr className="my-1 border-slate-100" />
                        <button onClick={() => { logout(); setProfileOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors">Sign In</Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-300 hover:text-white p-2">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-700/50 px-4 py-4 space-y-2 animate-fade-in bg-slate-900">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${isActive(l.to) ? 'text-teal-400 bg-teal-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
                {l.label}
              </Link>
            ))}
            <hr className="border-slate-700/50" />
            {isAuthenticated ? (
              <>
                <Link to="/report" onClick={() => setMenuOpen(false)} className="block text-center btn-primary w-full justify-center">Report Issue</Link>
                <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl text-sm">Dashboard</Link>
                <button onClick={() => { logout(); setMenuOpen(false) }} className="block w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl text-sm">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-center btn-primary w-full justify-center">Get Started</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>CivicConnect</span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs">A smart platform for smarter cities. Empowering citizens to report, track, and resolve civic issues.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/map" className="hover:text-teal-400 transition-colors">City Map</Link></li>
                <li><Link to="/track" className="hover:text-teal-400 transition-colors">Track Complaint</Link></li>
                <li><Link to="/report" className="hover:text-teal-400 transition-colors">Report Issue</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Help & Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
                <li><a href="mailto:support@civicconnect.com" className="hover:text-teal-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <hr className="border-slate-700/50 my-8" />
          <p className="text-center text-xs text-slate-500">© 2024 CivicConnect. Built for smarter cities. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
