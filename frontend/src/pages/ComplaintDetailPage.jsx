import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, MapPin, Calendar, Users, ThumbsUp, Building2, AlertTriangle, Clock } from 'lucide-react'
import api from '../services/api'
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS } from '../utils/constants'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const STATUS_ORDER = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected']

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supporting, setSupporting] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState(null)

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`)
      setComplaint(res.data.complaint)
      if (user && res.data.complaint.supporters) {
        setSupported(res.data.complaint.supporters.some(s => (s._id || s) === user._id))
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Complaint not found.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchComplaint() }, [id])

  const handleSupport = async () => {
    if (!isAuthenticated) { toast.error('Please login to support this complaint.'); return }
    setSupporting(true)
    try {
      const res = await api.post(`/complaints/${id}/support`)
      setSupported(res.data.supported)
      setComplaint(prev => ({ ...prev, supportCount: res.data.supportCount }))
      toast.success(res.data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update support.')
    } finally { setSupporting(false) }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6 flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Complaint not found</h2>
      <p className="text-slate-500 mb-4">{error}</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  )

  const c = complaint
  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.Pending
  const sev = SEVERITY_COLORS[c.severity] || SEVERITY_COLORS.Medium
  const coords = c.location?.coordinates
  const currentStatusIdx = STATUS_ORDER.indexOf(c.status)
  const isRejected = c.status === 'Rejected'

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl">{CATEGORY_ICONS[c.category] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`badge ${sc.bg} ${sc.text}`}>
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`} /> {c.status}
                  </span>
                  <span className={`badge ${sev.bg} ${sev.text}`}>{c.severity}</span>
                  {c.isDemoData && <span className="badge bg-slate-100 text-slate-500">Demo Data</span>}
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-snug">{c.title}</h1>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{c.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Reported {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{c.location?.address || 'Location pinned on map'}</span>
              </div>
              {c.location?.landmark && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <span>Near: {c.location.landmark}</span>
                </div>
              )}
              {c.assignedDepartmentName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{c.assignedDepartmentName}</span>
                </div>
              )}
              {c.targetResolutionDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Target: {format(new Date(c.targetResolutionDate), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {c.images?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {c.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noreferrer">
                    <img src={img} alt={`complaint-${i}`} className="rounded-xl object-cover w-full h-32 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {coords && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-3">Location</h2>
              <div className="rounded-xl overflow-hidden h-52 border border-slate-100">
                <MapContainer center={[coords.lat, coords.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                  <Marker position={[coords.lat, coords.lng]}>
                    <Popup><strong>{c.title}</strong><br />{c.location?.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Status Timeline</h2>
            {/* Progress bar */}
            {!isRejected && (
              <div className="flex items-center mb-6">
                {['Pending', 'Verified', 'In Progress', 'Resolved'].map((s, i) => {
                  const isDone = currentStatusIdx > i
                  const isCurrent = currentStatusIdx === i
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isDone ? 'bg-teal-500 border-teal-500 text-white' : isCurrent ? 'bg-white border-teal-500 text-teal-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-teal-600' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>{s}</span>
                      </div>
                      {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-teal-500' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                  )
                })}
              </div>
            )}

            <div className="space-y-4">
              {[...(c.statusHistory || [])].reverse().map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${STATUS_COLORS[h.status]?.dot || 'bg-slate-300'}`} />
                    {i < (c.statusHistory?.length || 1) - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">{h.status}</span>
                      <span className="text-xs text-slate-400">by {h.changedByName || 'System'}</span>
                    </div>
                    {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Support card */}
          <div className="card text-center">
            <div className="text-4xl font-black text-teal-600 mb-1">{c.supportCount || 0}</div>
            <p className="text-slate-500 text-sm mb-4">Citizens Supporting</p>
            <button onClick={handleSupport} disabled={supporting || !isAuthenticated}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${supported ? 'bg-teal-500 text-white' : 'border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white'} disabled:opacity-60 disabled:cursor-not-allowed`}>
              <ThumbsUp className="w-4 h-4" />
              {supporting ? 'Updating...' : supported ? 'Supported ✓' : 'Support this Issue'}
            </button>
            {!isAuthenticated && <p className="text-xs text-slate-400 mt-2"><Link to="/login" className="text-teal-600 hover:underline">Login</Link> to support</p>}
          </div>

          {/* Complaint info */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-800">Complaint Info</h3>
            <div className="space-y-2 text-sm">
              {[
                ['ID', c.complaintId],
                ['Category', c.category],
                ['Severity', c.severity],
                ['Status', c.status],
                ['Priority Score', c.priorityScore?.toFixed(1) || '—'],
                ['Reported', format(new Date(c.createdAt), 'MMM d, yyyy')],
                ...(c.resolvedAt ? [['Resolved', format(new Date(c.resolvedAt), 'MMM d, yyyy')]] : []),
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-700 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Prediction */}
          {c.aiPrediction && (
            <div className="card bg-blue-50/50 border-blue-100">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                🤖 AI Classification
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Suggestion</span>
              </h3>
              <div className="space-y-1.5 text-sm">
                <p className="text-slate-600">{c.aiPrediction.explanation}</p>
                <p className="text-slate-500 text-xs">Confidence: {Math.round((c.aiPrediction.confidence || 0.5) * 100)}%</p>
                <p className="text-slate-400 text-xs">Method: {c.aiPrediction.method}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
