import React, { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  EyeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  is_active: boolean
}

interface Permission {
  id: number
  module: string
  permission: string
  role: number
  role_name: string
  is_granted: boolean
}

interface UserProfile {
  id: number
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  role: Role | null
  is_active: boolean
  accessible_modules: string[]
}

interface PermissionManagerProps {
  userId: number
  onClose: () => void
}

const MODULES = [
  { key: 'dashboard', name: 'Dashboard', icon: '🏠' },
  { key: 'usuarios', name: 'Usuarios', icon: '👥' },
  { key: 'empleados', name: 'Empleados', icon: '👷' },
  { key: 'proveedores', name: 'Proveedores', icon: '🚚' },
  { key: 'catacion', name: 'Catación', icon: '☕' },
  { key: 'integracion_lotes', name: 'Integración de Lotes', icon: '📦' },
  { key: 'pesos_envio', name: 'Pesos Envío', icon: '⚖️' },
  { key: 'temperaturas', name: 'Temperaturas', icon: '🌡️' },
  { key: 'fermentacion', name: 'Fermentación', icon: '🫧' },
  { key: 'ocupacion', name: 'Ocupación', icon: '🏭' },
  { key: 'reportes', name: 'Reportes', icon: '📊' },
  { key: 'logs', name: 'Logs', icon: '📝' },
  { key: 'configuracion', name: 'Configuración', icon: '⚙️' }
]

const PERMISSIONS = [
  { key: 'view', name: 'Ver', icon: '👁️', color: 'bg-blue-100 text-blue-800' },
  { key: 'create', name: 'Crear', icon: '➕', color: 'bg-green-100 text-green-800' },
  { key: 'edit', name: 'Editar', icon: '✏️', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'delete', name: 'Eliminar', icon: '🗑️', color: 'bg-red-100 text-red-800' },
  { key: 'export', name: 'Exportar', icon: '📤', color: 'bg-purple-100 text-purple-800' },
  { key: 'admin', name: 'Administrar', icon: '🔧', color: 'bg-gray-100 text-gray-800' }
]

export default function PermissionManager({ userId, onClose }: PermissionManagerProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar perfil del usuario
      const profileResponse = await api.get(`/profiles/?user=${userId}`)
      if (profileResponse.data.results?.length > 0) {
        setUserProfile(profileResponse.data.results[0])
        setSelectedRole(profileResponse.data.results[0].role?.id || null)
      }

      // Cargar roles
      const rolesResponse = await api.get('/roles/')
      setRoles(rolesResponse.data.results || rolesResponse.data)

      // Cargar permisos
      const permissionsResponse = await api.get('/permissions/')
      setPermissions(permissionsResponse.data.results || permissionsResponse.data)

    } catch (error: any) {
      console.error('Error loading permission data:', error)
      toast.error('Error al cargar datos de permisos')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (roleId: number | null) => {
    setSelectedRole(roleId)
    
    // Limpiar permisos personalizados al cambiar rol
    if (roleId) {
      setCustomPermissions({})
    }
  }

  const handlePermissionToggle = (module: string, permission: string) => {
    setCustomPermissions(prev => {
      const modulePermissions = prev[module] || []
      const hasPermission = modulePermissions.includes(permission)
      
      if (hasPermission) {
        return {
          ...prev,
          [module]: modulePermissions.filter(p => p !== permission)
        }
      } else {
        return {
          ...prev,
          [module]: [...modulePermissions, permission]
        }
      }
    })
  }

  const hasPermission = (module: string, permission: string): boolean => {
    // Verificar permisos del rol seleccionado
    if (selectedRole) {
      const rolePermission = permissions.find(p => 
        p.role === selectedRole && 
        p.module === module && 
        p.permission === permission && 
        p.is_granted
      )
      if (rolePermission) return true
    }

    // Verificar permisos personalizados
    return customPermissions[module]?.includes(permission) || false
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Crear o actualizar perfil de usuario
      const profileData = {
        user: userId,
        role: selectedRole,
        is_active: true
      }

      if (userProfile?.id) {
        await api.patch(`/profiles/${userProfile.id}/`, profileData)
      } else {
        await api.post('/profiles/', profileData)
      }

      // Crear permisos personalizados
      for (const [module, perms] of Object.entries(customPermissions)) {
        for (const permission of perms) {
          await api.post('/permissions/', {
            module,
            permission,
            role: selectedRole,
            is_granted: true
          })
        }
      }

      toast.success('Permisos guardados correctamente')
      onClose()

    } catch (error: any) {
      console.error('Error saving permissions:', error)
      toast.error('Error al guardar permisos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Gestión de Permisos
                </h3>
                <p className="text-sm text-gray-600">
                  {userProfile?.user.first_name} {userProfile?.user.last_name} (@{userProfile?.user.username})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Rol */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Asignación de Rol
                </h4>
                
                <div className="space-y-3">
                  {roles.map(role => (
                    <label key={role.id} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={() => handleRoleChange(role.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{role.display_name}</div>
                        <div className="text-sm text-gray-600">{role.description}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {role.is_active ? 'Activo' : 'Inactivo'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de Permisos */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <KeyIcon className="h-5 w-5" />
                  Permisos por Módulo
                </h4>

                <div className="space-y-4">
                  {MODULES.map(module => (
                    <div key={module.key} className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{module.icon}</span>
                        <h5 className="font-medium text-gray-900">{module.name}</h5>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {PERMISSIONS.map(permission => {
                          const hasAccess = hasPermission(module.key, permission.key)
                          return (
                            <label
                              key={permission.key}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                hasAccess 
                                  ? `${permission.color} shadow-sm` 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => handlePermissionToggle(module.key, permission.key)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
                              />
                              <span className="text-sm font-medium flex items-center gap-1">
                                <span>{permission.icon}</span>
                                {permission.name}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Guardar Permisos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
