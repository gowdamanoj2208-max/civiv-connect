import axios from 'axios'

const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const assetUrl = (path) => {
  if (!path || /^https?:\/\//i.test(path)) return path
  return apiOrigin ? apiOrigin + (path.startsWith('/') ? '' : '/') + path : path
}

const api = axios.create({
  baseURL: apiOrigin ? apiOrigin + '/api' : '/api',
  timeout: 15000,
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token')
      localStorage.removeItem('cc_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
