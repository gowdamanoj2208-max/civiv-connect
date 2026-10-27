import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, AlertTriangle, CheckCircle2, Clock, Users, ArrowRight, Star, Zap, Shield, BarChart3 } from 'lucide-react'
import api from '../services/api'
import { STATUS_COLORS, CATEGORY_ICONS, SEVERITY_COLORS } from '../utils/constants'
import { formatDistanceToNow } from 'date-fns'

const STEPS = [
  { icon: '📍', title: 'Report the Issue', desc: 'Describe the problem, upload photos, and pin the location on our interactive map.' },
  { icon: '🔔', title: 'Get Verified', desc: 'Authorities verify your complaint and assign it to the appropriate department.' },
  { icon: '✅', title: 'Track & Resolve', desc: 'Monitor progress in real-time and get notified when the issue is fixed.' },
]

const CATEGORIES = [
  { icon: '🛣️', name: 'Roads', desc: 'Potholes, cracks, damaged pavements' },
  { icon: '🗑️', name: 'Garbage', desc: 'Overflowing bins, illegal dumping' },
  { icon: '💧', name: 'Water Leakage', desc: 'Burst pipes, supply disruptions' },
  { icon: '💡', name: 'Streetlights', desc: 'Dark streets, broken lamp posts' },
  { icon: '🌊', name: 'Drainage', desc: 'Blocked drains, waterlogging' },
  { icon: '🚻', name: 'Sanitation', desc: 'Public toilets, hygiene issues' },
]

const BENEFITS = {
  citizens: [
    { icon: '📱', title: 'Easy Reporting', desc: 'Submit complaints in minutes with photo and location' },
    { icon: '🔍', title: 'Real-time Tracking', desc: 'Monitor your complaint status with detailed timeline' },
    { icon: '👥', title: 'Community Support', desc: 'Vote on others\' complaints to prioritize urgent issues' },
    { icon: '🔔', title: 'Instant Updates', desc: 'Get notified at every stage of complaint resolution' },
  ],
  authorities: [
    { icon: '📊', title: 'Centralized Dashboard', desc: 'View and manage all complaints in one place' },
    { icon: '🤖', title: 'AI-Assisted Triage', desc: 'Auto-classify and prioritize incoming reports' },
    { icon: '📈', title: 'Analytics & Reports', desc: 'Measure performance and identify problem areas' },
    { icon: '🗺️', title: 'Map-Based View', desc: 'Visualize city-wide issues geographically' },
  ],
}

export default function LandingPage() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, avgTime: 0 })
  const [recentComplaints, setRecentComplaints] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/complaints?limit=6&sortBy=-createdAt'),
    ]).then(([complaintsRes]) => {
      const complaints = complaintsRes.data.complaints || []
      const total = complaintsRes.data.total || complaints.length
      const resolved = complaints.filter(c => c.status === 'Resolved').length
      const active = complaints.filter(c => !['Resolved', 'Rejected'].includes(c.status)).length
      setRecentComplaints(complaints.slice(0, 6))
      setStats({ total, resolved, active, avgTime: 5 })
    }).catch(() => {
      setRecentComplaints([])
    }).finally(() => setStatsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/30" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm px-4 py-2 rounded-full mb-6 font-medium">
              <Zap className="w-4 h-4" /> AI-Powered Civic Issue Management
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Report Problems.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">Improve Your City.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              CivicConnect bridges the gap between citizens and local authorities. Report civic issues with a photo and location, track resolution progress, and make your city better — together.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/report" className="btn-primary px-7 py-3.5 text-base shadow-2xl shadow-teal-500/30">
                Report an Issue <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/track" className="btn-outline px-7 py-3.5 text-base border-white/30 text-white hover:bg-white hover:text-slate-900">
                Track Complaint
              </Link>
              <Link to="/map" className="px-7 py-3.5 text-base font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-all">
                Explore Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: AlertTriangle, label: 'Total Reports', value: statsLoading ? '...' : stats.total.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: CheckCircle2, label: 'Issues Resolved', value: statsLoading ? '...' : stats.resolved.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Clock, label: 'Active Issues', value: statsLoading ? '...' : stats.active.toLocaleString(), color: 'text-orange-600', bg: 'bg-orange-50' },
              { icon: Users, label: 'Avg. Resolution', value: `${stats.avgTime} days`, color: 'text-teal-600', bg: 'bg-teal-50' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>How CivicConnect Works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Three simple steps to a cleaner, safer, smarter city</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="card-hover text-center relative">
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 z-10 text-slate-300"><ArrowRight className="w-6 h-6" /></div>}
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-4">{i + 1}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Civic Issue Categories</h2>
            <p className="text-slate-500">Report any type of civic problem easily</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} to={`/report`}
                className="card-hover text-center group cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{cat.icon}</div>
                <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
                <p className="text-slate-400 text-xs mt-1 leading-tight">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent complaints */}
      {recentComplaints.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Complaints</h2>
                <p className="text-slate-500 mt-1">Live civic issues reported by citizens</p>
              </div>
              <Link to="/map" className="btn-outline hidden sm:inline-flex">View Map <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentComplaints.map(c => {
                const sc = STATUS_COLORS[c.status] || STATUS_COLORS.Pending
                const sev = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.Medium
                return (
                  <Link key={c._id} to={`/complaints/${c._id}`} className="card-hover group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-2xl">{CATEGORY_ICONS[c.category] || '📋'}</span>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <span className={`badge ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {c.status}
                        </span>
                        <span className={`badge ${sev.bg} ${sev.text}`}>{c.severity}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2 group-hover:text-teal-600 transition-colors text-sm">{c.title}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-3">{c.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location?.address?.slice(0, 25) || 'Location pinned'}</span>
                      <span className="ml-auto">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    </div>
                    {c.supportCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-teal-600 font-medium">
                        <Users className="w-3 h-3" /> {c.supportCount} supporters
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Built for Everyone</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            {[
              { title: 'For Citizens', color: 'teal', items: BENEFITS.citizens },
              { title: 'For Authorities', color: 'navy', items: BENEFITS.authorities },
            ].map((group, gi) => (
              <div key={gi}>
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className={`w-2 h-8 rounded-full ${gi === 0 ? 'bg-teal-500' : 'bg-slate-700'}`} />
                  {group.title}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.items.map((item, i) => (
                    <div key={i} className="card-hover">
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Ready to Make Your City Better?</h2>
          <p className="text-teal-100 text-lg mb-8">Join thousands of citizens who are actively improving their communities</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-teal-700 font-bold px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
              Get Started Free
            </Link>
            <Link to="/map" className="border-2 border-white/50 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Explore City Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
