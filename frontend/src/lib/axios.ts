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

// Helper function to get user-friendly error messages
const getErrorMessage = (error: any): string => {
  // Check if there's a detail message from the backend
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }

  // Handle different status codes
  const status = error.response?.status
  switch (status) {
    case 400:
      return '잘못된 요청입니다. 입력값을 확인해주세요.'
    case 401:
      return '인증이 필요합니다. 다시 로그인해주세요.'
    case 403:
      return '접근 권한이 없습니다.'
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.'
    case 409:
      return '이미 존재하는 데이터입니다.'
    case 422:
      return '입력값 검증에 실패했습니다.'
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    case 502:
      return '게이트웨이 오류가 발생했습니다.'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.'
    default:
      return '알 수 없는 오류가 발생했습니다.'
  }
}

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response from server)
    if (!error.response) {
      const errorMsg = '네트워크 연결을 확인해주세요.'
      if (window.showError) {
        window.showError(errorMsg)
      }
      return Promise.reject(error)
    }

    const status = error.response.status
    const currentPath = window.location.pathname
    const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot'

    // Handle different status codes
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        if (!isAuthPage) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          if (window.showError) {
            window.showError('세션이 만료되었습니다. 다시 로그인해주세요.')
          }
        }
        break

      case 403:
        // Forbidden - show permission error via custom event (for modal)
        const permissionMsg = error.response?.data?.detail || '권한이 없습니다.'
        window.dispatchEvent(new CustomEvent('permissionError', {
          detail: { message: permissionMsg }
        }))
        break

      case 400:
      case 404:
      case 409:
      case 422:
        // Client errors - show error toast with specific message
        const clientErrorMsg = getErrorMessage(error)
        if (window.showError) {
          window.showError(clientErrorMsg)
        }
        break

      case 500:
      case 502:
      case 503:
        // Server errors - show error toast
        const serverErrorMsg = getErrorMessage(error)
        if (window.showError) {
          window.showError(serverErrorMsg)
        }
        break

      default:
        // Other errors - show generic error
        const genericErrorMsg = getErrorMessage(error)
        if (window.showError) {
          window.showError(genericErrorMsg)
        }
        break
    }

    return Promise.reject(error)
  }
)

export default api
