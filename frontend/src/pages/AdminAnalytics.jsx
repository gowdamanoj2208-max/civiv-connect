import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts'
import { BarChart3, TrendingUp, Building2, RefreshCw } from 'lucide-react'
import api from '../services/api'

const COLORS = ['#14b8a6','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#22c55e','#f97316','#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-600"><span style={{ color: p.color }}>●</span> {p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/analytics')
      setData(res.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const byCategory = (data?.byCategory || []).map(c => ({
    name: c._id,
    Total: c.total,
    Resolved: c.resolved,
    'Resolution %': c.total > 0 ? Math.round(c.resolved / c.total * 100) : 0,
  }))
  const bySeverity = (data?.bySeverity || []).map(s => ({ name: s._id, value: s.count }))
  const monthlyTrend = (data?.monthlyTrend || []).map(t => ({ month: t._id, Complaints: t.count, Resolved: t.resolved }))
  const deptPerf = (data?.deptPerformance || []).map(d => ({
    name: d._id?.replace(' Dept.', '').replace('& ', '&\n').slice(0, 20),
    total: d.total,
    resolved: d.resolved,
    rate: d.total > 0 ? Math.round(d.resolved / d.total * 100) : 0,
  }))
  const highPriority = data?.recentHighPriority || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="text-slate-500 text-sm">Deep insights into civic complaint patterns and department performance</p>
        </div>
        <button onClick={fetch} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <h2 className="section-title text-base mb-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-500" /> Complaints by Category — Total vs Resolved
        </h2>
        <p className="text-slate-400 text-xs mb-4">Comparison of submitted vs resolved complaints per category</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCategory} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="card">
          <h2 className="section-title text-base mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" /> Monthly Complaint Trends
          </h2>
          <p className="text-slate-400 text-xs mb-4">Monthly patterns over the last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="Complaints" stroke="#14b8a6" strokeWidth={2} fill="url(#complaintGrad)" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="Resolved" stroke="#22c55e" strokeWidth={2} fill="url(#resolvedGrad)" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity */}
        <div className="card">
          <h2 className="section-title text-base mb-1">Severity Distribution</h2>
          <p className="text-slate-400 text-xs mb-4">Breakdown of complaint severity levels</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                {bySeverity.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department performance */}
      {deptPerf.length > 0 && (
        <div className="card">
          <h2 className="section-title text-base mb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" /> Department Performance
          </h2>
          <p className="text-slate-400 text-xs mb-4">Resolution rates by assigned department</p>
          <div className="space-y-3">
            {deptPerf.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <p className="text-sm text-slate-600 w-52 flex-shrink-0 truncate" title={d.name}>{d.name}</p>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${d.rate}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-500">
                  <span>{d.resolved}/{d.total}</span>
                  <span className="font-semibold text-slate-700">{d.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High priority */}
      {highPriority.length > 0 && (
        <div className="card">
          <h2 className="section-title text-base mb-4">🚨 High Priority Open Issues</h2>
          <div className="space-y-3">
            {highPriority.map(c => (
              <div key={c._id} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.complaintId} · {c.category}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="badge bg-red-100 text-red-700">{c.severity}</span>
                  <span className="text-xs text-teal-600 font-semibold">{c.supportCount} supporters</span>
                  <span className="text-xs text-slate-500">Score: {c.priorityScore?.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
