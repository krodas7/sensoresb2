import React from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/temperatures', label: 'Temperaturas', icon: '🌡️' },
    { path: '/occupation', label: 'Ocupación', icon: '🏢' },
    { path: '/lots', label: 'Lotes', icon: '📦' },
    { path: '/lot-integration', label: 'Integración', icon: '🔗' },
    { path: '/suppliers', label: 'Proveedores', icon: '🚚' },
    { path: '/shipping-weights', label: 'Pesos Envío', icon: '⚖️' },
    { path: '/fermentation', label: 'Fermentación', icon: '🍇' },
    { path: '/cupping', label: 'Catación', icon: '☕' },
    { path: '/inventory', label: 'Inventario', icon: '📋' },
    { path: '/employees', label: 'Empleados', icon: '👥' },
    { path: '/attendance', label: 'Asistencia', icon: '📅' },
    { path: '/reports', label: 'Reportes', icon: '📊' },
    { path: '/logs', label: 'Logs', icon: '📝' },
    { path: '/users', label: 'Usuarios', icon: '👤' },
    { path: '/gestions', label: 'Gestiones', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">
            ☕ Beneficio de Café
          </h1>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-green-50 border-r-4 border-green-500 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Usuario: Admin</span>
                <Link to="/login" className="text-sm text-red-600 hover:text-red-800">
                  Cerrar Sesión
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

