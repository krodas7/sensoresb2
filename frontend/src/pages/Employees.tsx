import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BriefcaseIcon,
  UserIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Supervisor {
  id: number
  name: string
  shift_type: 'turno_a' | 'turno_b'
  shift_type_display: string
  phone: string
  email: string
  is_active: boolean
  employee_count: number
}

interface Employee {
  id?: number
  name: string
  dpi?: string
  position: string
  phone: string
  email?: string
  address?: string
  birth_date?: string
  salary: string
  supervisor: number | null
  supervisor_name?: string
  supervisor_shift?: string
  assigned_area?: string
  is_active: boolean
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<Employee>({
    name: '',
    position: '',
    phone: '',
    salary: '',
    supervisor: null,
    is_active: true
  })
  
  // Estados para gestión de supervisores
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [supervisorForm, setSupervisorForm] = useState({
    name: '',
    shift_type: 'turno_a' as 'turno_a' | 'turno_b',
    phone: '',
    email: ''
  })
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)
  
  // Estado para planilla
  const [generatingPayroll, setGeneratingPayroll] = useState(false)
  
  // Estado para configuración de turnos
  const [showTurnosConfig, setShowTurnosConfig] = useState(false)

  useEffect(() => {
    fetchEmployees()
    fetchSupervisors()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employees/')
      // El backend devuelve { count, next, previous, results }
      const employeesData = response.data.results || response.data || []
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Error al cargar empleados')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/employees/supervisors/')
      const supervisorsData = response.data.results || response.data || []
      setSupervisors(Array.isArray(supervisorsData) ? supervisorsData : [])
    } catch (error) {
      console.error('Error fetching supervisors:', error)
      toast.error('Error al cargar supervisores')
      setSupervisors([])
    }
  }

  const handleCreateEmployee = () => {
    setSelectedEmployee(null)
    setFormData({
      name: '',
      position: '',
      phone: '',
      salary: '',
      supervisor: null,
      is_active: true
    })
    setShowModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData(employee)
    setShowModal(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDeleteModal(true)
  }

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee || !selectedEmployee.id) return
    
    try {
      await api.delete(`/employees/${selectedEmployee.id}/`)
      toast.success('Empleado eliminado exitosamente')
      fetchEmployees()
      setShowDeleteModal(false)
      setSelectedEmployee(null)
    } catch (error) {
      console.error('Error eliminando empleado:', error)
      toast.error('Error al eliminar empleado')
    }
  }

  // Funciones para supervisores
  const handleCreateSupervisor = () => {
    setSelectedSupervisor(null)
    setSupervisorForm({
      name: '',
      shift_type: 'turno_a',
      phone: '',
      email: ''
    })
    setShowSupervisorModal(true)
  }
  
  // Función para generar planilla
  const handleGeneratePayroll = async () => {
    try {
      setGeneratingPayroll(true)
      
      // Crear el documento de planilla
      const doc = {
        title: 'Planilla de Empleados',
        date: new Date().toLocaleDateString('es-GT'),
        employees: employees.map(emp => ({
          name: emp.name,
          position: emp.position,
          supervisor: emp.supervisor_name || 'Sin asignar',
          shift: emp.supervisor_shift || 'N/A',
          salary: emp.salary,
          phone: emp.phone,
          status: emp.is_active ? 'Activo' : 'Inactivo'
        }))
      }
      
      // Generar HTML para imprimir
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Planilla de Empleados</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1e40af; text-align: center; }
              .header { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #1e40af; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
              .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Planilla de Empleados</h1>
              <p>Fecha: ${doc.date}</p>
              <p>Total de Empleados: ${employees.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Puesto</th>
                  <th>Encargado</th>
                  <th>Turno</th>
                  <th>Salario</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
              </tr>
            </thead>
              <tbody>
                ${doc.employees.map((emp, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${emp.name}</td>
                    <td>${emp.position}</td>
                    <td>${emp.supervisor}</td>
                    <td>${emp.shift}</td>
                    <td>${emp.salary}</td>
                    <td>${emp.phone}</td>
                    <td>${emp.status}</td>
                </tr>
                `).join('')}
            </tbody>
          </table>
            <div class="footer">
              <p>Sistema de Beneficio de Café - Generado el ${new Date().toLocaleString('es-GT')}</p>
        </div>
            <script>
              window.print();
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
      
      toast.success('Planilla generada exitosamente')
    } catch (error) {
      console.error('Error generando planilla:', error)
      toast.error('Error al generar planilla')
    } finally {
      setGeneratingPayroll(false)
    }
  }

  const handleSaveSupervisor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedSupervisor && selectedSupervisor.id) {
        await api.put(`/employees/supervisors/${selectedSupervisor.id}/`, supervisorForm)
        toast.success('Supervisor actualizado exitosamente')
      } else {
        await api.post('/employees/supervisors/', supervisorForm)
        toast.success('Supervisor creado exitosamente')
      }
      fetchSupervisors()
      setShowSupervisorModal(false)
    } catch (error) {
      console.error('Error guardando supervisor:', error)
      toast.error('Error al guardar supervisor')
    }
  }

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (selectedEmployee && selectedEmployee.id) {
        // Actualizar
        await api.put(`/employees/${selectedEmployee.id}/`, formData)
        toast.success('Empleado actualizado exitosamente')
      } else {
        // Crear
        await api.post('/employees/', formData)
        toast.success('Empleado creado exitosamente')
      }
      fetchEmployees()
      setShowModal(false)
      setSelectedEmployee(null)
    } catch (error: any) {
      console.error('Error guardando empleado:', error)
      const errorMessage = error.response?.data?.dpi?.[0] || 'Error al guardar empleado'
      toast.error(errorMessage)
    }
  }

  const getStatusBadge = (is_active: boolean) => {
    return is_active ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Activo
                          </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactivo
                    </span>
    )
  }

  const getShiftBadge = (shift?: string) => {
    if (!shift) return null
    
    const isTurnoA = shift.toLowerCase().includes('turno a')
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
        isTurnoA ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
      }`}>
        <ClockIcon className="h-3 w-3" />
        {shift}
                          </span>
    )
  }

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.dpi?.includes(searchTerm) ||
    employee.supervisor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
  return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Gestión de Empleados</h1>
              <p className="text-blue-100">Administración del personal por turnos</p>
                            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <UserGroupIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

      {/* Supervisores Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {supervisors.map((supervisor) => (
          <div key={supervisor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  supervisor.shift_type === 'turno_a' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <ClockIcon className={`h-6 w-6 ${
                    supervisor.shift_type === 'turno_a' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                    </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{supervisor.name}</h3>
                  <p className="text-sm text-gray-600">{supervisor.shift_type_display}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{supervisor.employee_count}</div>
                <div className="text-xs text-gray-500">Empleados</div>
            </div>
          </div>
            </div>
        ))}
                  
        {/* Botón para agregar supervisor */}
                            <button 
          onClick={handleCreateSupervisor}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-4 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[88px]"
              >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <PlusIcon className="h-6 w-6 text-blue-600" />
            </div>
          <span className="text-sm font-medium text-blue-700">Nuevo Encargado</span>
                            </button>
                          </div>

      {/* Panel de búsqueda */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
            <input
              type="text"
              placeholder="Buscar empleados por nombre, puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-gray-500"
            />
                </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowTurnosConfig(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
            >
              <ClockIcon className="h-5 w-5" />
              Configurar Turnos
            </button>
            <button 
              onClick={handleGeneratePayroll}
              disabled={generatingPayroll || employees.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentChartBarIcon className="h-5 w-5" />
              {generatingPayroll ? 'Generando...' : 'Planilla'}
                    </button>
                <button 
            onClick={handleCreateEmployee}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Empleado
                </button>
          </div>
            </div>
          </div>

      {/* Grid de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="group relative">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {employee.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                        </span>
                      </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {employee.name}
                  </h3>
                  <p className="text-gray-500 text-sm truncate">{employee.position}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {getStatusBadge(employee.is_active)}
                {employee.supervisor_shift && getShiftBadge(employee.supervisor_shift)}
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {employee.supervisor_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span className="truncate">{employee.supervisor_name}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <span className="truncate">{employee.phone}</span>
                  </div>
                )}
                {employee.salary && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BriefcaseIcon className="h-4 w-4" />
                    <span className="truncate">{employee.salary}</span>
                </div>
                )}
            </div>

              {/* Actions */}
              <div className="flex gap-2">
              <button 
                  onClick={() => handleEditEmployee(employee)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                  <PencilIcon className="h-4 w-4" />
                  Editar
              </button>
                <button 
                  onClick={() => handleDeleteEmployee(employee)}
                  className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
                  </div>
                  </div>
        ))}
                </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No se encontraron resultados' : 'Comienza creando un nuevo empleado'}
                  </p>
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
                <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              {/* Nombre */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                    <input 
                      type="text" 
                      required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez García"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

              {/* Puesto */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puesto *
                </label>
                    <input 
                  type="text"
                      required 
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ej: Operador de Secado"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

              {/* Teléfono */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                    <input 
                      type="tel" 
                      required 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: +502 5555-1234"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

              {/* Salario */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salario *
                </label>
                    <input 
                      type="text" 
                      required 
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Ej: Q3,500"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                
              {/* Encargado de Turno */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encargado de Turno *
                </label>
                <select
                    required
                  value={formData.supervisor || ''}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un encargado</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} - {supervisor.shift_type_display}
                        </option>
                      ))}
                    </select>
                {supervisors.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">
                    ⚠️ No hay supervisores disponibles. Crea uno primero en la sección de Gestiones.
                  </p>
                )}
                </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors"
                >
                  {selectedEmployee ? 'Actualizar' : 'Crear'} Empleado
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Configuración de Turnos */}
      {showTurnosConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">⚙️ Configuración de Turnos</h2>
                <p className="text-purple-100 text-sm">Sistema de relevos de 24 horas</p>
              </div>
              <button
                onClick={() => setShowTurnosConfig(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Explicación del Sistema */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Cómo Funciona el Sistema de Turnos</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Cada encargado trabaja <strong>24 horas continuas</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Los relevos son <strong>cada día a las 8:00 AM</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Turno A entra el Lunes 8AM y sale el Martes 8AM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Turno B entra el Martes 8AM y sale el Miércoles 8AM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Y así sucesivamente en rotación diaria</span>
                  </li>
                </ul>
              </div>

              {/* Calendario Visual de Relevos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">📅 Calendario de Relevos</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Día</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hora Entrada</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Turno</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hora Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-sm">Lunes</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔵 Turno A
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Martes 8:00 AM</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="px-4 py-3 text-sm">Martes</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🟣 Turno B
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Miércoles 8:00 AM</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-sm">Miércoles</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔵 Turno A
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Jueves 8:00 AM</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="px-4 py-3 text-sm">Jueves</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🟣 Turno B
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Viernes 8:00 AM</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-sm">Viernes</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔵 Turno A
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Sábado 8:00 AM</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="px-4 py-3 text-sm">Sábado</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🟣 Turno B
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Domingo 8:00 AM</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-sm">Domingo</td>
                        <td className="px-4 py-3 text-sm font-semibold">8:00 AM</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔵 Turno A
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">Lunes 8:00 AM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lista de Supervisores con sus Empleados */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">👥 Encargados de Turno</h3>
                <div className="space-y-3">
                  {supervisors.length === 0 ? (
                    <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-lg">
                      <ClockIcon className="mx-auto h-12 w-12 text-amber-400 mb-2" />
                      <p className="text-amber-800 font-medium">No hay encargados configurados</p>
                      <p className="text-amber-600 text-sm mt-1">Crea encargados para comenzar a asignar personal</p>
                      <button
                        onClick={() => {
                          setShowTurnosConfig(false)
                          handleCreateSupervisor()
                        }}
                        className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Crear Primer Encargado
                      </button>
                    </div>
                  ) : (
                    supervisors.map((supervisor) => (
                      <div key={supervisor.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              supervisor.shift_type === 'turno_a' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <ClockIcon className={`h-5 w-5 ${
                                supervisor.shift_type === 'turno_a' ? 'text-blue-600' : 'text-purple-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{supervisor.name}</h4>
                              <p className="text-sm text-gray-600">{supervisor.shift_type_display}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{supervisor.employee_count}</div>
                            <div className="text-xs text-gray-500">Empleados</div>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-600">
                          {supervisor.phone && (
                            <span className="flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {supervisor.phone}
                            </span>
                          )}
                          {supervisor.email && (
                            <span className="flex items-center gap-1">
                              <EnvelopeIcon className="h-3 w-3" />
                              {supervisor.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botón para crear nuevo encargado */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowTurnosConfig(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowTurnosConfig(false)
                    handleCreateSupervisor()
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nuevo Encargado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Supervisor */}
      {showSupervisorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">
                {selectedSupervisor ? 'Editar Encargado' : 'Nuevo Encargado'}
              </h2>
                <button 
                onClick={() => setShowSupervisorModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveSupervisor} className="p-6 space-y-4">
              {/* Nombre */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                    <input 
                  type="text"
                      required 
                  value={supervisorForm.name}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, name: e.target.value })}
                  placeholder="Ej: Juan Carlos Méndez"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turno *
                </label>
                <select
                  required
                  value={supervisorForm.shift_type}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, shift_type: e.target.value as 'turno_a' | 'turno_b' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="turno_a">🔵 Turno A (Lunes 8AM - Martes 8AM)</option>
                  <option value="turno_b">🟣 Turno B (Martes 8AM - Miércoles 8AM)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Los encargados trabajan turnos de 24 horas y se relevan cada día a las 8AM
                </p>
                </div>

              {/* Teléfono */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                    <input 
                  type="tel"
                      required 
                  value={supervisorForm.phone}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, phone: e.target.value })}
                  placeholder="Ej: +502 5555-1001"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

              {/* Email */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                    <input 
                  type="email"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })}
                  placeholder="Ej: juan.mendez@beneficio.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                
              {/* Botones */}
              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                  onClick={() => setShowSupervisorModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors"
                >
                  {selectedSupervisor ? 'Actualizar' : 'Crear'} Encargado
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Empleado</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar a <strong>{selectedEmployee?.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
                <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                Cancelar
                </button>
                  <button 
                onClick={confirmDeleteEmployee}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Eliminar
                  </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
