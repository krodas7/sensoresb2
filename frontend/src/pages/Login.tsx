import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import '../styles/login.css'

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success('¡Login exitoso!')
        console.log('Login data:', data)
        // Redirigir al dashboard
        window.location.href = '/'
      } else {
        toast.error('Credenciales inválidas')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen login-background login-background-fallback coffee-bean-pattern flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 coffee-animation">☕</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Beneficio</h1>
          <p className="text-gray-600 text-lg">Iniciar sesión</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-center text-sm text-gray-600 font-medium mb-2">Credenciales de prueba:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>👤 Usuario: <span className="font-mono">demo</span> / Contraseña: <span className="font-mono">demo123</span></p>
            <p>👤 Usuario: <span className="font-mono">admin</span> / Contraseña: <span className="font-mono">admin123</span></p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2024 Sistema de Beneficio de Café</p>
        </div>
      </div>
    </div>
  )
}