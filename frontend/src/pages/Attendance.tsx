import React, { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  HandRaisedIcon,
  UserCircleIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAttendance } from '../hooks/useAttendance'

interface AttendanceRecord {
  id: number
  employee: number
  employee_name?: string
  timestamp: string
  record_type: 'IN' | 'OUT'
  origin: 'fingerprint' | 'manual'
  is_valid: boolean
  observations: string
  device_id: string
}

interface Employee {
  id: number
  name: string
  position: string
}

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showManualRecord, setShowManualRecord] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [recordType, setRecordType] = useState<'IN' | 'OUT'>('IN')
  const [observations, setObservations] = useState('')
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<number | null>(null)
  
  const { calculateDayHours, checkIncompletePairs, checkDuplicates } = useAttendance()
  
  // Validation warnings
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  useEffect(() => {
    fetchRecords()
    fetchEmployees()
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchRecords, 30000)
    return () => clearInterval(interval)
  }, [filterDate])

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees/')
      const data = response.data.results || response.data || []
      setEmployees(Array.isArray(data) ? data.filter((emp: any) => emp.is_active) : [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Error al cargar empleados')
    }
  }

  const handleManualRecord = async () => {
    if (!selectedEmployee) {
      toast.error('Por favor selecciona un empleado')
      return
    }

    try {
      const now = new Date()
      const response = await api.post('/attendance/', {
        employee: selectedEmployee,
        timestamp: now.toISOString(),
        record_type: recordType,
        origin: 'manual',
        is_valid: true,
        observations: observations.trim() || undefined
      })

      toast.success(`${recordType === 'IN' ? 'Entrada' : 'Salida'} registrada exitosamente`)
      setShowManualRecord(false)
      setSelectedEmployee(null)
      setObservations('')
      setRecordType('IN')
      fetchRecords()
    } catch (error) {
      console.error('Error creating attendance record:', error)
      toast.error('Error al registrar asistencia')
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await api.get('/attendance/')
      const data = response.data.results || response.data || []
      const recordsArray = Array.isArray(data) ? data : []
      setRecords(recordsArray)
      
      // Validate records
      const duplicates = checkDuplicates(recordsArray)
      const incomplete = checkIncompletePairs(recordsArray)
      
      const warnings: string[] = []
      if (duplicates.length > 0) {
        warnings.push(`${duplicates.length} registro(s) duplicado(s) encontrado(s)`)
      }
      if (incomplete.length > 0) {
        warnings.push(...incomplete)
      }
      
      setValidationWarnings(warnings)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Error al cargar registros de asistencia')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const getRecordTypeIcon = (type: 'IN' | 'OUT') => {
    return type === 'IN' ? (
      <ArrowRightOnRectangleIcon className="h-5 w-5 text-green-600" />
    ) : (
      <ArrowLeftOnRectangleIcon className="h-5 w-5 text-blue-600" />
    )
  }

  const getRecordTypeBadge = (type: 'IN' | 'OUT') => {
    return type === 'IN' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
        <ArrowRightOnRectangleIcon className="h-3 w-3" />
        Entrada
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
        <ArrowLeftOnRectangleIcon className="h-3 w-3" />
        Salida
      </span>
    )
  }

  const getOriginBadge = (origin: 'fingerprint' | 'manual') => {
    return origin === 'fingerprint' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
        <HandRaisedIcon className="h-3 w-3" />
        Huella
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
        <UserCircleIcon className="h-3 w-3" />
        Manual
      </span>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('es-GT'),
      time: date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0]
    const matchesDate = !filterDate || recordDate === filterDate
    const matchesEmployee = !selectedEmployeeFilter || record.employee === selectedEmployeeFilter
    return matchesSearch && matchesDate && matchesEmployee
  })

  // Agrupar por empleado y fecha
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const key = `${record.employee}_${new Date(record.timestamp).toISOString().split('T')[0]}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(record)
    return acc
  }, {} as Record<string, AttendanceRecord[]>)

  // Calculate hours for each day
  const recordsWithHours = Object.keys(groupedRecords).length > 0
    ? Object.entries(groupedRecords).map(([key, dayRecords]) => ({
        key,
        records: dayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        hours: calculateDayHours(dayRecords),
        overtime: Math.max(0, calculateDayHours(dayRecords) - 8)
      }))
    : []

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
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Control de Asistencia</h1>
              <p className="text-green-100">Registro manual de asistencias por encargado</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowManualRecord(true)}
                className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors shadow-lg"
              >
                <PlusIcon className="h-5 w-5" />
                Registrar Asistencia
              </button>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <HandRaisedIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">⚠️ Advertencias de Validación</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
            Fecha
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Employee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserCircleIcon className="h-4 w-4 inline mr-1" />
            Empleado
          </label>
          <select
            value={selectedEmployeeFilter || ''}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los empleados</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Modal para registro manual */}
      {showManualRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Registrar Asistencia</h2>
              <button
                onClick={() => {
                  setShowManualRecord(false)
                  setSelectedEmployee(null)
                  setObservations('')
                  setRecordType('IN')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Selección de empleado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado *
                </label>
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecciona un empleado</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de registro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Registro *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordType('IN')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      recordType === 'IN'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6 mx-auto mb-2" />
                    <span className="font-medium">Entrada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('OUT')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      recordType === 'OUT'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mx-auto mb-2" />
                    <span className="font-medium">Salida</span>
                  </button>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Retraso justificado por tráfico..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowManualRecord(false)
                  setSelectedEmployee(null)
                  setObservations('')
                  setRecordType('IN')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualRecord}
                disabled={!selectedEmployee}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRecords.filter(r => r.record_type === 'IN').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Salidas</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredRecords.filter(r => r.record_type === 'OUT').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowLeftOnRectangleIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Totales</p>
              <p className="text-2xl font-bold text-purple-600">
                {recordsWithHours.reduce((acc, item) => acc + item.hours, 0).toFixed(1)}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Hora
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tipo
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Origen
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Observaciones
                    </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Horas del Día
                    </th>
                  </tr>
                </thead>
            <tbody className="divide-y divide-gray-200">
              {recordsWithHours.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <HandRaisedIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-900 font-medium">No hay registros</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchTerm || selectedEmployeeFilter || filterDate !== new Date().toISOString().split('T')[0]
                        ? 'No se encontraron registros con los filtros aplicados'
                        : 'Los registros aparecerán automáticamente cuando los empleados marquen su huella'}
                    </p>
                  </td>
                </tr>
              ) : (
                recordsWithHours.map(({ records: dayRecords, hours, overtime }) => {
                  const firstRecord = dayRecords[0]
                  const { date } = formatTimestamp(firstRecord.timestamp)
                  
                  return (
                    <React.Fragment key={firstRecord.id}>
                      {dayRecords.map((record, idx) => {
                        const { time } = formatTimestamp(record.timestamp)
                        const isFirstRow = idx === 0
                        const rowSpan = dayRecords.length
                        
                        return (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            {isFirstRow && (
                              <>
                                <td rowSpan={rowSpan} className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                      <span className="text-white font-bold text-xs">
                                        {record.employee_name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'N/A'}
                                      </span>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                      {record.employee_name || `Empleado #${record.employee}`}
                                    </span>
                                  </div>
                                </td>
                                <td rowSpan={rowSpan} className="px-6 py-4 text-sm text-gray-600">
                                  {date}
                                </td>
                                <td rowSpan={rowSpan} className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    {hours > 0 && (
                                      <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-gray-900">
                                          {hours}h
                                        </span>
                                      </div>
                                    )}
                                    {overtime > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                          +{overtime}h extra
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">{time}</span>
                            </td>
                            <td className="px-6 py-4">
                              {getRecordTypeBadge(record.record_type)}
                            </td>
                            <td className="px-6 py-4">
                              {getOriginBadge(record.origin)}
                            </td>
                            <td className="px-6 py-4">
                              {record.is_valid ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                  <CheckCircleIcon className="h-3 w-3" />
                                  Válido
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                  <XCircleIcon className="h-3 w-3" />
                                  Inválido
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {record.observations || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })
              )}
                </tbody>
              </table>
            </div>
          </div>

      {/* Información del sistema */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <HandRaisedIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">📋 Sistema de Registro de Asistencia</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• El encargado de turno registra las asistencias manualmente usando el botón "Registrar Asistencia"</li>
              <li>• Cada registro incluye: Empleado, Hora exacta, Tipo (Entrada/Salida), Origen (Manual)</li>
              <li>• Los registros se actualizan automáticamente cada 30 segundos en esta pantalla</li>
              <li>• Puedes agregar observaciones en cada registro (ej: retraso justificado, permiso, etc.)</li>
              <li>• Puedes filtrar por fecha y buscar por nombre de empleado</li>
            </ul>
          </div>
        </div>
              </div>
    </div>
  )
}
