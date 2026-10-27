import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS } from '../utils/constants'
import { format, formatDistanceToNow } from 'date-fns'

const STATUS_ORDER = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected']

export default function TrackPage() {
  const [query, setQuery] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setComplaint(null)
    try {
      const res = await api.get(`/complaints/track/${query.trim().toUpperCase()}`)
      setComplaint(res.data.complaint)
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found. Please check the ID and try again.')
    } finally { setLoading(false) }
  }

  const c = complaint
  const currentStatusIdx = c ? STATUS_ORDER.indexOf(c.status) : -1
  const isRejected = c?.status === 'Rejected'

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Track Your Complaint
          </h1>
          <p className="text-slate-500">Enter your complaint ID to see real-time status and updates</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="card mb-8">
          <label className="label text-base font-semibold mb-3">Complaint ID</label>
          <div className="flex gap-3">
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
              className="input-field flex-1 font-mono text-base" placeholder="CC-1234567890-ABCDE"
              autoFocus spellCheck={false} />
            <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6 disabled:opacity-60">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">Find your complaint ID in the confirmation notification or your dashboard.</p>
        </form>

        {/* Result */}
        {c && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-4xl">{CATEGORY_ICONS[c.category] || '📋'}</span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(() => {
                      const sc = STATUS_COLORS[c.status] || STATUS_COLORS.Pending
                      const sev = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.Medium
                      return (
                        <>
                          <span className={`badge ${sc.bg} ${sc.text}`}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{c.status}</span>
                          <span className={`badge ${sev.bg} ${sev.text}`}>{c.severity}</span>
                        </>
                      )
                    })()}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{c.title}</h2>
                  <p className="text-slate-500 text-sm mt-1">ID: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{c.complaintId}</code></p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-4">{c.description}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-500">
                {c.location?.address && <p>📍 {c.location.address}</p>}
                {c.location?.landmark && <p>🏢 Near: {c.location.landmark}</p>}
                <p>📅 Reported: {format(new Date(c.createdAt), 'MMM d, yyyy')}</p>
                {c.assignedDepartment && <p>🏛️ {c.assignedDepartmentName || c.assignedDepartment?.name}</p>}
                {c.targetResolutionDate && <p>🎯 Target: {format(new Date(c.targetResolutionDate), 'MMM d, yyyy')}</p>}
                {c.resolvedAt && <p className="text-green-600 font-medium">✅ Resolved: {format(new Date(c.resolvedAt), 'MMM d, yyyy')}</p>}
              </div>
            </div>

            {/* Progress */}
            {!isRejected && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-5">Progress</h3>
                <div className="flex items-start gap-1">
                  {['Pending', 'Verified', 'In Progress', 'Resolved'].map((s, i) => {
                    const isDone = currentStatusIdx > i
                    const isCurrent = currentStatusIdx === i
                    return (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isDone ? 'bg-teal-500 border-teal-500 text-white' : isCurrent ? 'border-teal-500 text-teal-600 bg-teal-50 scale-110' : 'border-slate-200 text-slate-400 bg-white'}`}>
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                          </div>
                          <span className={`text-xs mt-2 text-center font-medium ${isCurrent ? 'text-teal-600' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>{s}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 mt-5 ${isDone ? 'bg-teal-500' : 'bg-slate-200'}`} />}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            )}

            {isRejected && (
              <div className="card bg-red-50 border-red-100">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Complaint Rejected</p>
                    <p className="text-sm text-red-500 mt-0.5">
                      {c.statusHistory?.findLast(h => h.status === 'Rejected')?.note || 'Rejected by administrator.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-4">Update History</h3>
              <div className="space-y-4">
                {[...(c.statusHistory || [])].reverse().map((h, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${STATUS_COLORS[h.status]?.dot || 'bg-slate-300'}`} />
                      {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1 min-h-4" />}
                    </div>
                    <div className="pb-3">
                      <span className="text-sm font-semibold text-slate-800">{h.status}</span>
                      {h.changedByName && <span className="text-xs text-slate-400 ml-2">by {h.changedByName}</span>}
                      {h.note && <p className="text-sm text-slate-600 mt-0.5">{h.note}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link to={`/complaints/${c._id}`} className="btn-outline inline-flex">
                View Full Details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
