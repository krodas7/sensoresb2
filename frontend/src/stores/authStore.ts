import { create } from 'zustand'

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      if (!response.ok) {
        throw new Error('Login failed')
      }
      
      const data = await response.json()
      
      set({
        user: data.user,
        token: data.access,
        isAuthenticated: true,
        isLoading: false
      })
      
      localStorage.setItem('token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
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
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    set({ isLoading: true })
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const user = await response.json()
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        throw new Error('Auth failed')
      }
    } catch (error) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
    }
  }
}))