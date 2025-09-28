import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

// Tipos para permisos
interface UserPermissions {
  accessible_modules: string[]
  role: string | null
}

interface UserProfile {
  id: number
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    status: string
    is_active: boolean
    is_verified: boolean
  }
  role: {
    id: number
    name: string
    display_name: string
    description: string
    is_active: boolean
  } | null
  is_active: boolean
  last_login_ip: string | null
  notes: string
  accessible_modules: string[]
  created_at: string
  updated_at: string
}

interface UserWithPermissions {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  is_active: boolean
  is_verified: boolean
  last_login: string | null
  date_joined: string
  profile: UserProfile | null
  permissions: UserPermissions
}

// Permisos por defecto como fallback
const DEFAULT_ROLE_PERMISSIONS = {
  superusuario: {
    dashboard: ['view', 'admin'],
    usuarios: ['view', 'create', 'edit', 'delete', 'admin'],
    empleados: ['view', 'create', 'edit', 'delete'],
    proveedores: ['view', 'create', 'edit', 'delete'],
    catacion: ['view', 'create', 'edit', 'delete'],
    integracion_lotes: ['view', 'create', 'edit', 'delete'],
    pesos_envio: ['view', 'create', 'edit', 'delete'],
    temperaturas: ['view', 'admin'],
    fermentacion: ['view', 'create', 'edit', 'delete'],
    ocupacion: ['view', 'create', 'edit', 'delete'],
    reportes: ['view', 'create', 'edit', 'export', 'admin'],
    logs: ['view', 'export', 'admin'],
    configuracion: ['view', 'edit', 'admin']
  },
  administrador: {
    dashboard: ['view', 'admin'],
    usuarios: ['view', 'create', 'edit', 'delete', 'admin'],
    empleados: ['view', 'create', 'edit', 'delete'],
    proveedores: ['view', 'create', 'edit', 'delete'],
    reportes: ['view', 'create', 'edit', 'export', 'admin'],
    logs: ['view', 'export'],
    configuracion: ['view', 'edit', 'admin']
  },
  catador: {
    dashboard: ['view'],
    catacion: ['view', 'create', 'edit'],
    reportes: ['view', 'export']
  },
  pesador: {
    dashboard: ['view'],
    integracion_lotes: ['view', 'create', 'edit'],
    pesos_envio: ['view', 'create', 'edit'],
    reportes: ['view', 'export']
  },
  operador: {
    dashboard: ['view'],
    temperaturas: ['view'],
    fermentacion: ['view', 'edit'],
    ocupacion: ['view', 'edit']
  },
  supervisor: {
    dashboard: ['view', 'admin'],
    usuarios: ['view'],
    empleados: ['view'],
    proveedores: ['view'],
    catacion: ['view'],
    integracion_lotes: ['view'],
    pesos_envio: ['view'],
    temperaturas: ['view'],
    fermentacion: ['view'],
    ocupacion: ['view'],
    reportes: ['view', 'export']
  },
  invitado: {
    dashboard: ['view'],
    temperaturas: ['view'],
    fermentacion: ['view'],
    ocupacion: ['view']
  }
}

export const usePermissionsEnhanced = () => {
  const { user } = useAuthStore()
  const [userPermissions, setUserPermissions] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar permisos del usuario
  const loadUserPermissions = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/users/${user.id}/permissions/`)
      setUserPermissions(response.data)
    } catch (err: any) {
      console.error('Error loading user permissions:', err)
      setError(err.response?.data?.detail || 'Error al cargar permisos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar permisos cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      loadUserPermissions()
    } else {
      setUserPermissions(null)
    }
  }, [user?.id])

  // Verificar permisos usando datos del backend o fallback
  const canView = (module: string): boolean => {
    if (!user) return false
    
    // Usar permisos del backend si están disponibles
    if (userPermissions?.profile?.accessible_modules?.includes(module)) {
      return true
    }
    
    // Fallback a permisos por defecto
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('view') || false
  }

  const canCreate = (module: string): boolean => {
    if (!user) return false
    
    // Por ahora, usar lógica simple basada en el rol
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('create') || false
  }

  const canEdit = (module: string): boolean => {
    if (!user) return false
    
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('edit') || false
  }

  const canDelete = (module: string): boolean => {
    if (!user) return false
    
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('delete') || false
  }

  const canAdmin = (module: string): boolean => {
    if (!user) return false
    
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('admin') || false
  }

  const canExport = (module: string): boolean => {
    if (!user) return false
    
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return DEFAULT_ROLE_PERMISSIONS[role]?.[module]?.includes('export') || false
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(user?.role || '')
  }

  const getAccessibleModules = (): string[] => {
    if (!user) return []
    
    // Usar módulos accesibles del backend si están disponibles
    if (userPermissions?.profile?.accessible_modules) {
      return userPermissions.profile.accessible_modules
    }
    
    // Fallback a permisos por defecto
    const role = user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS
    return Object.keys(DEFAULT_ROLE_PERMISSIONS[role] || {})
  }

  const getRoleDisplayName = (): string => {
    if (userPermissions?.profile?.role?.display_name) {
      return userPermissions.profile.role.display_name
    }
    
    // Fallback a nombres por defecto
    const roleNames: Record<string, string> = {
      superusuario: 'Superusuario',
      administrador: 'Administrador',
      catador: 'Catador',
      pesador: 'Pesador',
      operador: 'Operador',
      supervisor: 'Supervisor',
      invitado: 'Invitado'
    }
    
    return roleNames[user?.role || ''] || user?.role || 'Sin rol'
  }

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canAdmin,
    canExport,
    hasRole,
    hasAnyRole,
    getAccessibleModules,
    getRoleDisplayName,
    user,
    userPermissions,
    loading,
    error,
    loadUserPermissions
  }
}
