import { create } from 'zustand'

// Use relative URL to leverage Vite proxy in development
// This avoids CORS issues and ad blockers
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  username?: string
  role: string
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
  startTokenRefreshTimer: () => void
  stopTokenRefreshTimer: () => void
}

let tokenRefreshTimer: NodeJS.Timeout | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login/`)
      
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials for CORS
        body: JSON.stringify({ username, password }),
      })
      
      console.log('Login response status:', response.status)
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Login failed:', errorData)
        throw new Error(errorData.message || 'Login failed')
      }
      
      const data = await response.json()
      console.log('Login successful:', data)
      
      set({
        user: data.user,
        token: data.access,
        isAuthenticated: true,
        isLoading: false
      })
      
      localStorage.setItem('token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      
      // Iniciar timer de renovación automática
      get().startTokenRefreshTimer()
    } catch (error) {
      console.error('Login error details:', error)
      set({ isLoading: false })
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo y que no haya bloqueadores de anuncios activos.')
      }
      throw error
    }
  },

  logout: () => {
    get().stopTokenRefreshTimer()
    set({
      user: null,
      token: null,
      isAuthenticated: false
    })
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, token: null })
      return
    }

    set({ isLoading: true, token })
    try {
      const response = await fetch(`${API_URL}/auth/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const user = await response.json()
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        })
        
        // Iniciar timer de renovación automática
        get().startTokenRefreshTimer()
      } else if (response.status === 401) {
        // Token expirado, intentar refrescar
        const refreshResult = await get().refreshToken()
        if (!refreshResult) {
          // Si el refresh falla, mantener la sesión pero no autenticado
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      // Error en la petición, verificar si hay token de refresh
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        // Intentar refrescar el token
        await get().refreshToken()
      } else {
        // No hay refresh token, cerrar sesión
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        })
      }
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!refreshToken) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
      return false
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        const newToken = data.access
        
        localStorage.setItem('token', newToken)
        set({ token: newToken })
        
        // Volver a verificar el usuario con el nuevo token
        const userResponse = await fetch(`${API_URL}/auth/me/`, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        })
        
        if (userResponse.ok) {
          const user = await userResponse.json()
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } else {
          return false
        }
      } else {
        // Refresh falló, cerrar sesión
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        return false
      }
    } catch (error) {
      // Si el refresh falla, cerrar sesión
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      return false
    }
  },

  startTokenRefreshTimer: () => {
    // Limpiar timer existente
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer)
    }
    
    // Renovar token cada 6 horas (antes de que expire a las 8 horas)
    tokenRefreshTimer = setInterval(async () => {
      const { isAuthenticated } = get()
      if (isAuthenticated) {
        console.log('Renovando token automáticamente...')
        await get().refreshToken()
      }
    }, 6 * 60 * 60 * 1000) // 6 horas en milisegundos
  },

  stopTokenRefreshTimer: () => {
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer)
      tokenRefreshTimer = null
    }
  }
}))