import React from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  HomeIcon,
  FireIcon,
  BuildingOfficeIcon,
  CubeIcon,
  LinkIcon,
  TruckIcon,
  ScaleIcon,
  BeakerIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CameraIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function Layout() {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', Icon: HomeIcon },
    { path: '/temperatures', label: 'Temperaturas', Icon: FireIcon },
    { path: '/occupation', label: 'Ocupación', Icon: BuildingOfficeIcon },
    { path: '/lots', label: 'Lotes', Icon: CubeIcon },
    { path: '/lot-integration', label: 'Integración', Icon: LinkIcon },
    { path: '/suppliers', label: 'Proveedores', Icon: TruckIcon },
    { path: '/cherry-reception', label: 'Recepción Cereza', Icon: CameraIcon },
    { path: '/transformation', label: 'Transformación', Icon: ArrowPathIcon },
    { path: '/shipping-weights', label: 'Pesos Envío', Icon: ScaleIcon },
    { path: '/fermentation', label: 'Fermentación', Icon: BeakerIcon },
    { path: '/cupping', label: 'Catación', Icon: SparklesIcon },
    { path: '/inventory', label: 'Inventario', Icon: ArchiveBoxIcon },
    { path: '/employees', label: 'Empleados', Icon: UserGroupIcon },
    { path: '/attendance', label: 'Asistencia', Icon: CalendarDaysIcon },
    { path: '/reports', label: 'Reportes', Icon: DocumentChartBarIcon },
    { path: '/logs', label: 'Logs', Icon: ClipboardDocumentListIcon },
    { path: '/users', label: 'Usuarios', Icon: UserCircleIcon },
    { path: '/gestions', label: 'Gestiones', Icon: Cog6ToothIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Beneficio
              </h1>
              <p className="text-xs text-gray-500">Gestión de Café</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-2 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.Icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
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
              <div className="flex items-center space-x-3">
                {(() => {
                  const currentItem = menuItems.find(item => item.path === location.pathname)
                  const Icon = currentItem?.Icon || HomeIcon
                  return (
                    <>
                      <Icon className="h-6 w-6 text-green-600" />
                      <h2 className="text-2xl font-semibold text-gray-800">
                        {currentItem?.label || 'Dashboard'}
                      </h2>
                    </>
                  )
                })()}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <UserCircleIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Admin</span>
                </div>
                <Link 
                  to="/login" 
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
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

