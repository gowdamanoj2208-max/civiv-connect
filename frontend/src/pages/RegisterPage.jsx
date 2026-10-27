import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { name, email, password, phone } = form
      await register({ name: name.trim(), email, password, phone })
      toast.success('Account created! Welcome to CivicConnect 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.'
      toast.error(msg)
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-white text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>CivicConnect</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-slate-400">Join thousands of engaged citizens</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                placeholder="Rahul Sharma" autoComplete="name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" value={form.email} onChange={set('email')}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                className="input-field" placeholder="9876543210" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className={`input-field pr-12 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`}
                placeholder="Repeat password" autoComplete="new-password" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <p className="text-xs text-slate-400">By registering, you agree to our Terms of Service and Privacy Policy. Your account will be created as a Citizen.</p>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
