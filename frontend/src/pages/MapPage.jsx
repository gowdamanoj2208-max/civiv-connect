import React, { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { Filter, MapPin, Plus, X } from 'lucide-react'
import api from '../services/api'
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS, CATEGORIES, STATUSES, MAP_MARKER_COLORS } from '../utils/constants'
import { formatDistanceToNow } from 'date-fns'

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createColoredIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const DEFAULT_CENTER = [19.076, 72.8777]

function FlyToComplaints({ complaints }) {
  const map = useMap()
  useEffect(() => {
    if (complaints.length > 0) {
      const pts = complaints.filter(c => c.location?.coordinates).map(c => [c.location.coordinates.lat, c.location.coordinates.lng])
      if (pts.length > 0) {
        const bounds = L.latLngBounds(pts)
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    }
  }, [complaints])
  return null
}

export default function MapPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', category: '', severity: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 200 })
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.severity) params.append('severity', filters.severity)
      const res = await api.get(`/complaints?${params}`)
      setComplaints(res.data.complaints?.filter(c => c.location?.coordinates) || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  const setFilter = (key) => (e) => setFilters(p => ({ ...p, [key]: e.target.value }))
  const clearFilters = () => setFilters({ status: '', category: '', severity: '' })
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Controls bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <MapPin className="w-5 h-5 text-teal-500" />
          City Map
          <span className="text-slate-400 font-normal text-sm ml-1">({complaints.length} issues)</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="bg-white/30 rounded-full px-1.5 text-xs">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-slate-400 hover:text-slate-600 p-1.5"><X className="w-4 h-4" /></button>
          )}
          <Link to="/report" className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" /> Report
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap gap-3 flex-shrink-0 animate-fade-in">
          <select value={filters.status} onChange={setFilter('status')} className="input-field py-2 text-sm w-44">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.category} onChange={setFilter('category')} className="input-field py-2 text-sm w-48">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.severity} onChange={setFilter('severity')} className="input-field py-2 text-sm w-44">
            <option value="">All Severities</option>
            {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex flex-wrap gap-4 flex-shrink-0">
        {Object.entries(MAP_MARKER_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: color }} />
            {status}
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
            <FlyToComplaints complaints={complaints} />
            {complaints.map(c => {
              const coords = c.location?.coordinates
              if (!coords) return null
              return (
                <Marker key={c._id}
                  position={[coords.lat, coords.lng]}
                  icon={createColoredIcon(MAP_MARKER_COLORS[c.status] || '#94a3b8')}
                  eventHandlers={{ click: () => setSelected(c) }}>
                  <Popup>
                    <div className="min-w-48 p-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{CATEGORY_ICONS[c.category]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]?.bg} ${STATUS_COLORS[c.status]?.text}`}>{c.status}</span>
                      </div>
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.location?.address}</p>
                      <a href={`/complaints/${c._id}`} className="text-xs text-teal-600 hover:underline mt-2 inline-block">View details →</a>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>

        {/* Selected complaint panel */}
        {selected && (
          <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0 animate-slide-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Issue Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_ICONS[selected.category]}</span>
                <span className={`badge ${STATUS_COLORS[selected.status]?.bg} ${STATUS_COLORS[selected.status]?.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[selected.status]?.dot}`} />{selected.status}
                </span>
                <span className={`badge ${SEVERITY_COLORS[selected.severity]?.bg} ${SEVERITY_COLORS[selected.severity]?.text}`}>{selected.severity}</span>
              </div>
              <h4 className="font-semibold text-slate-900 leading-snug">{selected.title}</h4>
              <p className="text-slate-500 text-sm line-clamp-3">{selected.description}</p>
              {selected.location?.address && (
                <div className="flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {selected.location.address}
                </div>
              )}
              <p className="text-xs text-slate-400">Reported {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}</p>
              <Link to={`/complaints/${selected._id}`} className="btn-primary w-full justify-center text-sm py-2.5">
                View Full Details <Plus className="w-4 h-4 rotate-45" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
