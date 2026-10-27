import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, ChevronDown, X, Check, Clock, Building2, AlertTriangle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS, STATUSES, CATEGORIES } from '../utils/constants'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const DEPARTMENTS_LIST = [
  'Roads & Infrastructure Dept.',
  'Solid Waste Management Dept.',
  'Water Supply & Sewerage Dept.',
  'Electricity & Lighting Dept.',
  'Drainage & Sewerage Dept.',
  'Public Health & Sanitation Dept.',
  'General Municipal Services',
]

function StatusModal({ complaint, onClose, onUpdated }) {
  const [status, setStatus] = useState(complaint.status)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await api.patch(`/admin/complaints/${complaint._id}/status`, { status, note })
      toast.success(`Status updated to ${status}`)
      onUpdated()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Update Status</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">"{complaint.title}"</p>
        <div className="mb-4">
          <label className="label">New Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="mb-5">
          <label className="label">Note / Reason <span className="text-slate-400 font-normal">(visible to citizen)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="input-field resize-none" placeholder="Add a note about this status change..." />
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpdate} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Updating...' : 'Update Status'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AssignModal({ complaint, onClose, onUpdated }) {
  const [dept, setDept] = useState(complaint.assignedDepartmentName || '')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    setLoading(true)
    try {
      await api.patch(`/admin/complaints/${complaint._id}/assign`, { departmentName: dept, targetResolutionDate: targetDate || undefined })
      toast.success('Complaint assigned!')
      onUpdated(); onClose()
    } catch (e) { toast.error('Assignment failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Assign Department</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="mb-4">
          <label className="label">Department</label>
          <select value={dept} onChange={e => setDept(e.target.value)} className="input-field">
            <option value="">Select department...</option>
            {DEPARTMENTS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="mb-5">
          <label className="label">Target Resolution Date</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="input-field" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="flex gap-3">
          <button onClick={handleAssign} disabled={loading || !dept} className="btn-primary flex-1 justify-center disabled:opacity-60">
            {loading ? 'Assigning...' : 'Assign'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', category: '', severity: '', search: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusModal, setStatusModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v))
      const res = await api.get(`/admin/complaints?${params}`)
      setComplaints(res.data.complaints || [])
      setTotalPages(res.data.pages || 1)
      setTotal(res.data.total || 0)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchComplaints() }, [page, filters.status, filters.category, filters.severity])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchComplaints() }, 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const setFilter = (k) => (e) => { setFilters(p => ({ ...p, [k]: e.target.value })); setPage(1) }

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v))
      const res = await api.get(`/admin/export?${params}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `complaints-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported!')
    } catch (_) { toast.error('Export failed') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">All Complaints</h1>
          <p className="text-slate-500 text-sm">{total} total complaints</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm"><Download className="w-4 h-4" /> Export CSV</button>
          <button onClick={() => { setPage(1); fetchComplaints() }} className="btn-secondary px-3"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={filters.search} onChange={setFilter('search')} className="input-field pl-10 text-sm" placeholder="Search complaints..." />
          </div>
          <select value={filters.status} onChange={setFilter('status')} className="input-field text-sm w-40">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.category} onChange={setFilter('category')} className="input-field text-sm w-44">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.severity} onChange={setFilter('severity')} className="input-field text-sm w-40">
            <option value="">All Severities</option>
            {['Low','Medium','High','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No complaints found matching the filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Complaint', 'Category', 'Severity', 'Status', 'Reporter', 'Department', 'Priority', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {complaints.map(c => {
                  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.Pending
                  const sev = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.Medium
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1">{c.title}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.complaintId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {CATEGORY_ICONS[c.category]} <span className="text-slate-600">{c.category}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${sev.bg} ${sev.text}`}>{c.severity}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-slate-700 font-medium">{c.reporter?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{c.reporter?.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-36">
                        <p className="text-slate-500 text-xs line-clamp-2">{c.assignedDepartmentName || '—'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-teal-600 font-semibold">{c.priorityScore?.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link to={`/complaints/${c._id}`} title="View" className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setStatusModal(c)} title="Update Status" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setAssignModal(c)} title="Assign Department" className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                            <Building2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {statusModal && <StatusModal complaint={statusModal} onClose={() => setStatusModal(null)} onUpdated={fetchComplaints} />}
      {assignModal && <AssignModal complaint={assignModal} onClose={() => setAssignModal(null)} onUpdated={fetchComplaints} />}
    </div>
  )
}
