import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, FileText, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../services/api'
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS, STATUSES, CATEGORIES } from '../utils/constants'
import { formatDistanceToNow, format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </div>
  )
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 8 })
      if (statusFilter) params.append('status', statusFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (search) params.append('search', search)
      const res = await api.get(`/complaints/my?${params}`)
      setComplaints(res.data.complaints || [])
      setTotalPages(res.data.pages || 1)
      // Build stats from response
      const statsArr = res.data.stats || []
      const statsObj = {}
      statsArr.forEach(s => { statsObj[s._id] = s.count })
      setStats({ total: res.data.total || 0, ...statsObj })
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchComplaints() }, [page, statusFilter, categoryFilter])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchComplaints() }, 500)
    return () => clearTimeout(t)
  }, [search])

  const statCards = [
    { label: 'Total Submitted', value: stats.total || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: stats['Pending'] || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'In Progress', value: stats['In Progress'] || 0, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Resolved', value: stats['Resolved'] || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>! Here's your civic activity.</p>
        </div>
        <Link to="/report" className="btn-primary">
          <Plus className="w-4 h-4" /> Report Issue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10" placeholder="Search your complaints..." />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="input-field sm:w-44">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} className="input-field sm:w-44">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchComplaints} className="btn-secondary px-3">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Complaints list */}
      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No complaints yet</h3>
          <p className="text-slate-400 text-sm mb-6">You haven't submitted any complaints matching the current filters.</p>
          <Link to="/report" className="btn-primary inline-flex">Report your first issue</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => {
            const sc = STATUS_COLORS[c.status] || STATUS_COLORS.Pending
            const sev = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.Medium
            return (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="card-hover flex items-start gap-4 group">
                <div className="text-3xl flex-shrink-0 mt-1">{CATEGORY_ICONS[c.category] || '📋'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors line-clamp-1">{c.title}</h3>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`badge ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-1 mb-2">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className={`badge ${sev.bg} ${sev.text}`}>{c.severity}</span>
                    <span>{c.complaintId}</span>
                    <span>{c.location?.address || 'Location pinned'}</span>
                    <span className="ml-auto">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
