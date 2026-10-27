import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, AlertTriangle, Building2, TrendingUp,
  BarChart3, RefreshCw, Users, Percent
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import api from '../services/api'
import { STATUS_COLORS, CATEGORY_ICONS } from '../utils/constants'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#14b8a6','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#22c55e','#f97316']

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/dashboard')
      setData(res.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDashboard() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = data?.stats || {}
  const byCategory = (data?.byCategory || []).map(c => ({ name: c._id, value: c.count }))
  const byStatus = (data?.byStatus || []).map(s => ({ name: s._id, value: s.count }))
  const trend = (data?.monthlyTrend || []).map(t => ({ date: t._id, complaints: t.count }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide civic complaint overview</p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Complaints" value={s.total || 0} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Clock} label="Pending" value={s.pending || 0} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard icon={TrendingUp} label="In Progress" value={s.inProgress || 0} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={CheckCircle2} label="Resolved" value={s.resolved || 0} color="text-green-600" bg="bg-green-50" sub={`${s.resolutionRate || 0}% resolution rate`} />
        <StatCard icon={AlertTriangle} label="High Priority" value={s.highPriority || 0} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={FileText} label="Verified" value={s.verified || 0} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard icon={Percent} label="Resolution Rate" value={`${s.resolutionRate || 0}%`} color="text-teal-600" bg="bg-teal-50" />
        <StatCard icon={Clock} label="Avg Resolution" value={`${s.avgResolutionTime || 0}d`} color="text-slate-600" bg="bg-slate-100" sub="average days to resolve" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title text-base mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-500" /> Complaints by Category
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="section-title text-base mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <div className="card">
          <h2 className="section-title text-base mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" /> Daily Complaint Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="complaints" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4, fill: '#14b8a6' }} activeDot={{ r: 6 }} name="Complaints" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/complaints" className="card-hover flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Manage Complaints</p>
            <p className="text-xs text-slate-400">{s.pending || 0} pending review</p>
          </div>
        </Link>
        <Link to="/admin/analytics" className="card-hover flex items-center gap-4 group">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
            <BarChart3 className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Analytics</p>
            <p className="text-xs text-slate-400">Detailed reports & insights</p>
          </div>
        </Link>
        <Link to="/map" className="card-hover flex items-center gap-4 group">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">City Map</p>
            <p className="text-xs text-slate-400">View all reported locations</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
