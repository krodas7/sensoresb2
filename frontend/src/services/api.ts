import axios from 'axios'

// Use relative URL to leverage Vite proxy in development
// This avoids CORS issues and ad blockers
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor to add auth token
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

// Response interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si el error es 401 y no es la petición de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya se está refrescando, añadir a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        // No hay refresh token, limpiar y redirigir a login
        isRefreshing = false
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        
        // Redirigir a login solo si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        // Intentar refrescar el token
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh_token: refreshToken
        })

        const { access } = response.data
        localStorage.setItem('token', access)
        
        // Actualizar el token en el request original
        originalRequest.headers['Authorization'] = 'Bearer ' + access
        
        // Procesar la cola de peticiones fallidas
        processQueue(null, access)
        isRefreshing = false
        
        // Reintentar la petición original
        return api(originalRequest)
      } catch (refreshError) {
        // Si el refresh falla, cerrar sesión
        processQueue(refreshError, null)
        isRefreshing = false
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        
        // Redirigir a login solo si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api