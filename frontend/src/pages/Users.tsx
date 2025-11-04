import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import PermissionManager from '../components/PermissionManager'
import toast from 'react-hot-toast'
import api from '../services/api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  last_login?: string
  role?: string
  status?: string
}

interface UserFormData {
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_active: boolean
}

// Mock data para desarrollo
  const initialUsers: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@beneficio.com',
    first_name: 'Administrador',
    last_name: 'Sistema',
    is_staff: true,
    is_active: true,
    date_joined: '2023-01-01T00:00:00Z',
    last_login: '2025-01-15T10:30:00Z'
    },
    {
      id: 2,
      username: 'catador1',
      email: 'catador@beneficio.com',
    first_name: 'María',
    last_name: 'García',
    is_staff: false,
    is_active: true,
    date_joined: '2023-02-15T00:00:00Z',
    last_login: '2025-01-14T15:45:00Z'
    },
    {
      id: 3,
      username: 'pesador1',
      email: 'pesador@beneficio.com',
    first_name: 'Carlos',
    last_name: 'López',
    is_staff: false,
    is_active: true,
    date_joined: '2023-03-10T00:00:00Z',
    last_login: '2025-01-13T09:20:00Z'
  },
  {
    id: 4,
    username: 'operador1',
    email: 'operador@beneficio.com',
    first_name: 'Ana',
    last_name: 'Rodríguez',
    is_staff: false,
    is_active: false,
    date_joined: '2023-04-05T00:00:00Z',
    last_login: '2025-01-10T14:15:00Z'
  }
]

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [showPermissionManager, setShowPermissionManager] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<number | null>(null)
  const [newUser, setNewUser] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_active: true
  })

  // Cargar usuarios desde API
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/')
      const data = response.data.results || response.data || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = filterRole === '' || 
        (filterRole === 'staff' && user.is_staff) ||
        (filterRole === 'user' && !user.is_staff)
      
      const matchesStatus = filterStatus === '' ||
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active)
      
      return matchesSearch && matchesRole && matchesStatus
    })
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, filterRole, filterStatus])

  const handleCreateUser = () => {
    setEditingUser(null)
    setNewUser({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_staff: false,
      is_active: true
    })
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_staff: user.is_staff,
      is_active: user.is_active
    })
    setShowUserModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  const handleManagePermissions = (user: User) => {
    setSelectedUserForPermissions(user.id)
    setShowPermissionManager(true)
  }

  const handleSaveUser = async () => {
    if (!newUser.username || !newUser.first_name || !newUser.last_name) {
      toast.error('Todos los campos son obligatorios')
      return
    }

    try {
      if (editingUser) {
        // Editar usuario existente
        const updateData = {
          ...newUser,
          email: newUser.email || `${newUser.username}@beneficio.com`  // Email automático si no existe
        }
        await api.put(`/users/${editingUser.id}/`, updateData)
        toast.success('Usuario actualizado correctamente')
      } else {
        // Crear nuevo usuario - Email generado automáticamente
        const userData = {
          ...newUser,
          email: `${newUser.username}@beneficio.com`,  // Email basado en username
          password: 'temporal123'  // Contraseña temporal
        }
        await api.post('/users/', userData)
        toast.success(`Usuario creado correctamente. Email: ${userData.email}`)
      }
      
      fetchUsers()
      setShowUserModal(false)
      setEditingUser(null)
    } catch (error: any) {
      console.error('Error saving user:', error)
      const errorMessage = error.response?.data?.username?.[0] || error.response?.data?.email?.[0] || 'Error al guardar usuario'
      toast.error(errorMessage)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    
    try {
      await api.delete(`/users/${deletingUser.id}/`)
      toast.success('Usuario eliminado correctamente')
      fetchUsers()
      setShowDeleteModal(false)
      setDeletingUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const getRoleText = (isStaff: boolean) => {
    return isStaff ? 'Administrador' : 'Usuario'
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Activo' : 'Inactivo'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-8 w-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        </div>
        <button 
          onClick={handleCreateUser}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
            <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos los roles</option>
            <option value="staff">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filteredUsers.length} de {users.length} usuarios
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
          <div key={user.id} className="group relative">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </span>
                      </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-gray-500 text-sm truncate">@{user.username}</p>
                        </div>
                <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                </button>
                        </div>
              
              <div className="flex gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  user.is_staff 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  <ShieldCheckIcon className="h-3 w-3" />
                  {getRoleText(user.is_staff)}
                    </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {getStatusText(user.is_active)}
                    </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">{new Date(user.date_joined).toLocaleDateString()}</span>
                </div>
                {user.last_login && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">{new Date(user.last_login).toLocaleDateString()}</span>
                  </div>
                )}
                    </div>
              
              <div className="flex gap-2">
                      <button 
                  onClick={() => handleEditUser(user)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <PencilIcon className="h-4 w-4" />
                  Editar
                      </button>
                      <button 
                  onClick={() => handleManagePermissions(user)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-3 rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <KeyIcon className="h-4 w-4" />
                  Permisos
                      </button>
                <button 
                  onClick={() => handleDeleteUser(user)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Modal de Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <div className="space-y-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                    <input 
                      type="text" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ingresa el nombre de usuario"
                    />
                  </div>


                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input 
                      type="text" 
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ingresa el nombre"
                    />
                  </div>

                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <input 
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ingresa el apellido"
                    />
                  </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newUser.is_staff}
                    onChange={(e) => setNewUser({...newUser, is_staff: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Es administrador</span>
                </label>

                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={newUser.is_active}
                    onChange={(e) => setNewUser({...newUser, is_active: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                </label>
              </div>
                </div>

            <div className="flex gap-3 mt-6">
                  <button 
                onClick={() => setShowUserModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
              <button 
                onClick={handleSaveUser}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h3>
                <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que quieres eliminar al usuario <strong>{deletingUser.first_name} {deletingUser.last_name}</strong>?
              </p>
              <p className="text-sm text-red-600">
                Esta acción no se puede deshacer.
                        </p>
                      </div>

            <div className="flex gap-3">
                    <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                      <button 
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Manager Modal */}
      {showPermissionManager && selectedUserForPermissions && (
        <PermissionManager
          userId={selectedUserForPermissions}
          onClose={() => {
            setShowPermissionManager(false)
            setSelectedUserForPermissions(null)
          }}
        />
      )}
    </div>
  )
}

export default Users