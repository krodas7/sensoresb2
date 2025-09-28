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
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface Employee {
  id: number
  name: string
  position: string
  department: string
  hire_date: string
  status: 'active' | 'inactive' | 'on_leave'
  phone: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      
      // Intentar obtener datos del localStorage primero
      const savedEmployees = localStorage.getItem('employees')
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees))
      } else {
        // Datos iniciales si no hay datos guardados
        const initialEmployees = [
          { id: 1, name: 'Juan Pérez', position: 'Supervisor de Producción', department: 'Producción', hire_date: '2023-01-15', status: 'active' as const, phone: '+502 5555-0001' },
          { id: 2, name: 'María García', position: 'Técnico de Calidad', department: 'Calidad', hire_date: '2023-03-20', status: 'active' as const, phone: '+502 5555-0002' },
          { id: 3, name: 'Carlos López', position: 'Operador de Máquinas', department: 'Producción', hire_date: '2023-05-10', status: 'active' as const, phone: '+502 5555-0003' },
          { id: 4, name: 'Ana Rodríguez', position: 'Contadora', department: 'Administración', hire_date: '2023-02-28', status: 'active' as const, phone: '+502 5555-0004' },
          { id: 5, name: 'Luis Martínez', position: 'Mantenimiento', department: 'Mantenimiento', hire_date: '2023-04-12', status: 'on_leave' as const, phone: '+502 5555-0005' }
        ]
    setEmployees(initialEmployees)
        localStorage.setItem('employees', JSON.stringify(initialEmployees))
      }
      
      // Uncomment when backend authentication is ready
      // const response = await api.get('/employees/')
      // setEmployees(response.data)
      
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'inactive': return 'Inactivo'
      case 'on_leave': return 'En Permiso'
      default: return 'Desconocido'
    }
  }

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // CRUD Functions
  const handleCreateEmployee = () => {
    setShowCreateModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDeleteModal(true)
  }

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return
    
    try {
      // Eliminar empleado del estado y localStorage
      const updatedEmployees = employees.filter(employee => employee.id !== selectedEmployee.id)
      setEmployees(updatedEmployees)
      localStorage.setItem('employees', JSON.stringify(updatedEmployees))
      
      setShowDeleteModal(false)
      setSelectedEmployee(null)
      console.log('Empleado eliminado:', selectedEmployee.name)
    } catch (error) {
      console.error('Error eliminando empleado:', error)
    }
  }

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    try {
      let updatedEmployees: Employee[]
      
      if (selectedEmployee) {
        // Editar empleado existente
        updatedEmployees = employees.map(employee => 
          employee.id === selectedEmployee.id 
            ? { ...employee, ...employeeData }
            : employee
        )
        setEmployees(updatedEmployees)
        localStorage.setItem('employees', JSON.stringify(updatedEmployees))
        setShowEditModal(false)
        console.log('Empleado actualizado:', employeeData)
      } else {
        // Crear nuevo empleado
        const newEmployee: Employee = {
          id: Date.now(),
          name: employeeData.name || '',
          position: employeeData.position || '',
          department: employeeData.department || '',
          hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
          status: employeeData.status || 'active',
          phone: employeeData.phone || ''
        }
        updatedEmployees = [newEmployee, ...employees]
        setEmployees(updatedEmployees)
        localStorage.setItem('employees', JSON.stringify(updatedEmployees))
        setShowCreateModal(false)
        console.log('Empleado creado:', newEmployee)
      }
      setSelectedEmployee(null)
    } catch (error) {
      console.error('Error guardando empleado:', error)
    }
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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header compacto */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">👥 Gestión de Empleados</h1>
              <p className="text-blue-100">Administración del personal</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <UserGroupIcon className="h-8 w-8 text-white" />
            </div>
            </div>
          </div>
        </div>

      {/* Panel de búsqueda compacto */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="🔍 Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-gray-500"
            />
          </div>
          <button 
            onClick={handleCreateEmployee}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Grid compacto de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((employee) => (
          <div key={employee.id} className="group relative">
            {/* Tarjeta compacta */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              
              {/* Header compacto */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {employee.name.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {employee.name}
                  </h3>
                  <p className="text-gray-500 text-sm truncate">{employee.position}</p>
                        </div>
                <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                      </button>
        </div>

              {/* Badge de estado compacto */}
              <div className="flex gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  employee.status === 'active' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : employee.status === 'on_leave'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    employee.status === 'active' ? 'bg-green-500' : 
                    employee.status === 'on_leave' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  {getStatusText(employee.status)}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3 w-3" />
                  {employee.department}
                          </span>
                        </div>

              {/* Información compacta */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <BriefcaseIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 truncate">{employee.position}</span>
              </div>

                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">{employee.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">{new Date(employee.hire_date).toLocaleDateString()}</span>
                            </div>
                            </div>

              {/* Botones compactos */}
              <div className="flex gap-2">
              <button 
                  onClick={() => handleEditEmployee(employee)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
              >
                  <PencilIcon className="h-4 w-4" />
                  Editar
              </button>
                            <button 
                  onClick={() => handleDeleteEmployee(employee)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold"
                            >
                              <TrashIcon className="h-4 w-4" />
                  Eliminar
                            </button>
                          </div>
            </div>

            {/* Efecto de brillo sutil */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
        ))}
            </div>

      {/* Estado vacío compacto */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron empleados</h3>
            <p className="text-gray-600 mb-4 text-sm">Ajusta los términos de búsqueda o agrega un nuevo empleado.</p>
                <button 
              onClick={handleCreateEmployee}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Empleado
                </button>
              </div>
            </div>
      )}

      {/* Modal de Crear Empleado */}
      {showCreateModal && (
        <EmployeeFormModal
          employee={null}
          onSave={handleSaveEmployee}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nuevo Empleado"
        />
      )}

      {/* Modal de Editar Empleado */}
      {showEditModal && selectedEmployee && (
        <EmployeeFormModal
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
          }}
          title="Editar Empleado"
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmationModal
          employee={selectedEmployee}
          onConfirm={confirmDeleteEmployee}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}
            </div>
  )
}

// Componente Modal de Formulario de Empleado
interface EmployeeFormModalProps {
  employee: Employee | null
  onSave: (data: Partial<Employee>) => void
  onClose: () => void
  title: string
}

function EmployeeFormModal({ employee, onSave, onClose, title }: EmployeeFormModalProps) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    position: employee?.position || '',
    department: employee?.department || '',
    phone: employee?.phone || '',
    hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
    status: employee?.status || 'active'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button 
              onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                    <input 
                      type="text" 
                      name="name"
                  value={formData.name}
                  onChange={handleChange}
                      required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
              
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                    <input 
                      type="text" 
                      name="position"
                  value={formData.position}
                  onChange={handleChange}
                      required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                    required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar departamento</option>
                      <option value="Producción">Producción</option>
                      <option value="Calidad">Calidad</option>
                      <option value="Administración">Administración</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Logística">Logística</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                    </select>
                </div>
                
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="on_leave">En Permiso</option>
                </select>
                </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Contratación *
                </label>
                    <input 
                      type="date" 
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                      required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {employee ? 'Actualizar' : 'Crear'} Empleado
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
  )
}

// Componente Modal de Confirmación de Eliminación
interface DeleteConfirmationModalProps {
  employee: Employee
  onConfirm: () => void
  onClose: () => void
}

function DeleteConfirmationModal({ employee, onConfirm, onClose }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <TrashIcon className="h-6 w-6 text-red-600" />
                </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Confirmar Eliminación
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            ¿Estás seguro de que deseas eliminar al empleado{' '}
            <span className="font-semibold text-gray-900">{employee.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-center space-x-3">
                  <button 
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Eliminar
                  </button>
                </div>
            </div>
          </div>
    </div>
  )
}
