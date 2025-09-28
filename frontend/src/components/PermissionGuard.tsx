import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface PermissionGuardProps {
  children: React.ReactNode
  module: string
  permission?: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin'
  fallback?: React.ReactNode
  requireAll?: boolean
}

export default function PermissionGuard({ 
  children, 
  module, 
  permission = 'view',
  fallback,
  requireAll = false 
}: PermissionGuardProps) {
  const { canView, canCreate, canEdit, canDelete, canExport, canAdmin, user } = usePermissions()

  const hasPermission = () => {
    if (!user) return false

    switch (permission) {
      case 'view':
        return canView(module)
      case 'create':
        return canCreate(module)
      case 'edit':
        return canEdit(module)
      case 'delete':
        return canDelete(module)
      case 'export':
        return canExport(module)
      case 'admin':
        return canAdmin(module)
      default:
        return canView(module)
    }
  }

  if (!hasPermission()) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <LockClosedIcon className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h2>
          
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a este módulo. 
            Contacta al administrador si crees que esto es un error.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ShieldExclamationIcon className="h-5 w-5" />
              <span>Módulo requerido: <strong>{module}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
              <span>Permiso requerido: <strong>{permission}</strong></span>
            </div>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Componente específico para mostrar contenido solo si tiene permisos
export function ConditionalRender({ 
  children, 
  module, 
  permission = 'view',
  fallback = null 
}: PermissionGuardProps) {
  return (
    <PermissionGuard 
      module={module} 
      permission={permission} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

// Hook para verificar permisos en componentes
export function usePermissionCheck() {
  const permissions = usePermissions()

  return {
    canAccess: (module: string, permission: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin' = 'view') => {
      switch (permission) {
        case 'view':
          return permissions.canView(module)
        case 'create':
          return permissions.canCreate(module)
        case 'edit':
          return permissions.canEdit(module)
        case 'delete':
          return permissions.canDelete(module)
        case 'export':
          return permissions.canExport(module)
        case 'admin':
          return permissions.canAdmin(module)
        default:
          return permissions.canView(module)
      }
    },
    ...permissions
  }
}