import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle 401 and 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login/register pages
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot'

      if (!isAuthPage) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // Dispatch custom event for 403 errors (permission denied)
      const errorMessage = error.response?.data?.detail || '권한이 없습니다.'
      window.dispatchEvent(new CustomEvent('permissionError', {
        detail: { message: errorMessage }
      }))
    }
    return Promise.reject(error)
  }
)

export default api
