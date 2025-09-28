import { useAuthStore } from '../stores/authStore'

interface ModulePermission {
  module: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}

interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: 'superusuario' | 'administrador' | 'catador' | 'pesador'
  isActive: boolean
  permissions: ModulePermission[]
}

// Default permissions for each role
const ROLE_PERMISSIONS = {
  superusuario: {
    dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    temperatures: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    occupation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    lots: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    'lot-integration': { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    suppliers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    scale: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    'shipping-weights': { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    fermentation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    cupping: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    employees: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    attendance: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true }
  },
  administrador: {
    dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    temperatures: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    occupation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    lots: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    'lot-integration': { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    suppliers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    scale: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    'shipping-weights': { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    fermentation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    cupping: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    employees: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    attendance: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
  },
  catador: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    temperatures: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    occupation: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    lots: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
    'lot-integration': { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    suppliers: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    scale: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    'shipping-weights': { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    fermentation: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    cupping: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    employees: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    attendance: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
  },
  pesador: {
    dashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    temperatures: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    occupation: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    lots: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
    'lot-integration': { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    suppliers: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    scale: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    'shipping-weights': { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
    fermentation: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    cupping: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    employees: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    attendance: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
  }
}

export const usePermissions = () => {
  const { user } = useAuthStore()

  // Get user permissions for a specific module
  const getModulePermission = (module: string) => {
    if (!user || !user.role) {
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
    }

    // If user has custom permissions, use them
    if (user.permissions && user.permissions.length > 0) {
      const permission = user.permissions.find(p => p.module === module)
      if (permission) {
        return {
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
          canExport: permission.canExport
        }
      }
    }

    // Otherwise, use role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]
    if (!rolePermissions) {
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
    }
    
    return rolePermissions[module as keyof typeof rolePermissions] || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false
    }
  }

  // Check if user can perform a specific action on a module
  const can = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export') => {
    const permission = getModulePermission(module)
    return permission[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof permission]
  }

  // Check if user can view a module
  const canView = (module: string) => {
    const result = can(module, 'view')
    console.log(`canView(${module}):`, result, 'user:', user?.role)
    return result
  }

  // Check if user can create in a module
  const canCreate = (module: string) => can(module, 'create')

  // Check if user can edit in a module
  const canEdit = (module: string) => can(module, 'edit')

  // Check if user can delete in a module
  const canDelete = (module: string) => can(module, 'delete')

  // Check if user can export from a module
  const canExport = (module: string) => can(module, 'export')

  // Check if user has a specific role
  const hasRole = (role: string) => user?.role === role

  // Check if user is superuser
  const isSuperUser = () => hasRole('superusuario')

  // Check if user is admin
  const isAdmin = () => hasRole('administrador')

  // Check if user is catador
  const isCatador = () => hasRole('catador')

  // Check if user is pesador
  const isPesador = () => hasRole('pesador')

  // Get all modules user can access
  const getAccessibleModules = () => {
    if (!user) return []
    
    const modules = [
      'dashboard', 'temperatures', 'occupation', 'lots', 'lot-integration',
      'suppliers', 'scale', 'shipping-weights', 'fermentation', 'cupping',
      'inventory', 'employees', 'attendance', 'reports', 'users'
    ]
    
    return modules.filter(module => canView(module))
  }

  // Get user's role info
  const getRoleInfo = () => {
    if (!user) return null
    
    const roleInfo = {
      superusuario: { name: 'Superusuario', color: 'bg-red-100 text-red-800' },
      administrador: { name: 'Administrador', color: 'bg-blue-100 text-blue-800' },
      catador: { name: 'Catador', color: 'bg-amber-100 text-amber-800' },
      pesador: { name: 'Pesador', color: 'bg-green-100 text-green-800' }
    }
    
    return roleInfo[user.role as keyof typeof roleInfo] || roleInfo.administrador
  }

  return {
    getModulePermission,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    hasRole,
    isSuperUser,
    isAdmin,
    isCatador,
    isPesador,
    getAccessibleModules,
    getRoleInfo
  }
}

export default usePermissions
