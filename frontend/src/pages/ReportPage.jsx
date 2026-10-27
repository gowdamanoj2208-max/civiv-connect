import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import L from 'leaflet'
import toast from 'react-hot-toast'
import { Brain, MapPin, Upload, X, Loader2, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'
import api from '../services/api'
import { CATEGORIES, SEVERITIES } from '../utils/constants'

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]) },
  })
  return position ? <Marker position={position}><Popup>Selected location</Popup></Marker> : null
}

const INITIAL_CENTER = [19.076, 72.8777]

export default function ReportPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: '', severity: 'Medium',
    address: '', landmark: '', lat: '', lng: '',
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [errors, setErrors] = useState({})
  const debounceRef = useRef(null)

  // Sync map position to form fields
  useEffect(() => {
    if (position) {
      setForm(p => ({ ...p, lat: position[0].toFixed(6), lng: position[1].toFixed(6) }))
    }
  }, [position])

  // AI auto-classify on text change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (form.title.length > 10 && form.description.length > 20) {
      debounceRef.current = setTimeout(() => autoClassify(), 800)
    }
    return () => clearTimeout(debounceRef.current)
  }, [form.title, form.description])

  const autoClassify = async () => {
    setAiLoading(true)
    try {
      const res = await api.post('/ai/classify', { title: form.title, description: form.description })
      setAiResult(res.data.prediction)
    } catch (_) {}
    finally { setAiLoading(false) }
  }

  const applyAiSuggestion = () => {
    if (!aiResult) return
    setForm(p => ({
      ...p,
      category: aiResult.category || p.category,
      severity: aiResult.severity || p.severity,
    }))
    toast.success('AI suggestions applied!')
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024)
    if (valid.length < files.length) toast.error('Some files exceed 5MB and were skipped.')
    setImages(prev => [...prev, ...valid].slice(0, 5))
    const previews = valid.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...previews].slice(0, 5))
  }

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setImagePreviews(prev => { URL.revokeObjectURL(prev[i]); return prev.filter((_, idx) => idx !== i) })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported by your browser.')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
        toast.success('Location detected!')
      },
      () => toast.error('Location access denied. Please pin your location on the map.')
    )
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim() || form.title.length < 5) e.title = 'Title must be at least 5 characters'
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters'
    if (!form.category) e.category = 'Please select a category'
    if (!form.lat || !form.lng) e.location = 'Please select a location on the map'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const checkDuplicates = async () => {
    try {
      const res = await api.post('/ai/duplicate-check', { title: form.title, description: form.description, category: form.category, lat: form.lat, lng: form.lng })
      if (res.data.hasDuplicates) { setDuplicates(res.data.duplicates); setShowDuplicates(true); return true }
    } catch (_) {}
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix validation errors.'); return }

    // Check duplicates first
    const hasDups = await checkDuplicates()
    if (hasDups) return // show duplicate modal

    await submitComplaint()
  }

  const submitComplaint = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach(img => fd.append('images', img))

      const res = await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Complaint submitted successfully!')
      navigate(`/complaints/${res.data.complaint._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title mb-1">Report a Civic Issue</h1>
        <p className="text-slate-500 text-sm">Fill in the details below. Our AI will help classify your complaint automatically.</p>
      </div>

      {/* Duplicate warning modal */}
      {showDuplicates && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-slate-800">Similar complaints found</h2>
            </div>
            <p className="text-slate-500 text-sm mb-4">These open complaints are similar to yours. Consider supporting an existing one instead of creating a duplicate.</p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {duplicates.map(d => (
                <a key={d._id} href={`/complaints/${d._id}`} target="_blank" rel="noreferrer"
                  className="block p-3 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors">
                  <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{d.category}</span> · <span>{d.status}</span> · <span>{Math.round(d.similarity * 100)}% similar</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDuplicates(false); submitComplaint() }}
                className="btn-primary flex-1 justify-center">Submit Anyway</button>
              <button onClick={() => setShowDuplicates(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-5">
          <h2 className="section-title text-lg flex items-center gap-2">
            <span className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Issue Details
          </h2>

          <div>
            <label className="label">Complaint Title *</label>
            <input value={form.title} onChange={set('title')} className={`input-field ${errors.title ? 'border-red-400' : ''}`}
              placeholder="E.g., Large pothole on MG Road causing accidents" maxLength={150} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            <p className="text-xs text-slate-400 mt-1">{form.title.length}/150</p>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
              placeholder="Describe the issue in detail. Include when it started, how it affects the area, and any safety concerns..." maxLength={2000} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            <p className="text-xs text-slate-400 mt-1">{form.description.length}/2000</p>
          </div>

          {/* AI Suggestion Panel */}
          {(aiLoading || aiResult) && (
            <div className={`p-4 rounded-xl border ${aiResult ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <Brain className={`w-5 h-5 flex-shrink-0 mt-0.5 ${aiResult ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">AI Classification</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Suggestion only</span>
                    {aiResult?.fallback && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Rule-based</span>}
                  </div>
                  {aiLoading && <p className="text-xs text-slate-500">Analyzing your complaint...</p>}
                  {aiResult && (
                    <>
                      <p className="text-xs text-slate-600 mb-2">{aiResult.explanation}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">📁 {aiResult.category}</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">⚠️ {aiResult.severity}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">🏢 {aiResult.department}</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg">{Math.round((aiResult.confidence || 0.5) * 100)}% confidence</span>
                      </div>
                      <button type="button" onClick={applyAiSuggestion}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                        Apply AI suggestions →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={set('category')}
                className={`input-field ${errors.category ? 'border-red-400' : ''}`}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="label">Severity *</label>
              <select value={form.severity} onChange={set('severity')} className="input-field">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="card space-y-4">
          <h2 className="section-title text-lg flex items-center gap-2">
            <span className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs font-bold">2</span>
            Photos <span className="text-slate-400 text-sm font-normal">(optional, max 5)</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imagePreviews.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-400">Upload</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-lg flex items-center gap-2">
              <span className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs font-bold">3</span>
              Location *
            </h2>
            <button type="button" onClick={getCurrentLocation}
              className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium">
              <Navigation className="w-4 h-4" /> Use my location
            </button>
          </div>
          <p className="text-sm text-slate-500">Click on the map to pin the exact issue location.</p>
          {errors.location && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.location}</p>}
          <div className="rounded-xl overflow-hidden border border-slate-200 h-64">
            <MapContainer center={position || INITIAL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          {position && (
            <p className="text-xs text-teal-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Location selected: {form.lat}, {form.lng}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Address / Area</label>
              <input value={form.address} onChange={set('address')} className="input-field" placeholder="e.g., MG Road, Sector 5" />
            </div>
            <div>
              <label className="label">Landmark</label>
              <input value={form.landmark} onChange={set('landmark')} className="input-field" placeholder="e.g., Near City Mall" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">* Required fields. Location must be selected on map.</p>
          <button type="submit" disabled={loading}
            className="btn-primary px-8 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <>Submit Complaint</>}
          </button>
        </div>
      </form>
    </div>
  )
}
