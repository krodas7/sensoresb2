import React, { useState, useEffect } from 'react'
import { 
  BuildingOfficeIcon, 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface Area {
  id: number
  name: string
  capacity: number
  current_occupancy: number
  status: 'available' | 'occupied' | 'maintenance'
  last_updated: string
  lot_id?: number
  lot_name?: string
  employee_name?: string
}

// Helper para convertir datos de la API al formato esperado
const transformOccupationData = (apiData: any): Area[] => {
  return apiData.map((item: any) => ({
    id: item.area_id,
    name: item.area_name,
    capacity: 100, // Capacidad por defecto, se puede ajustar si hay campo en API
    current_occupancy: item.status === 'ocupado' ? 50 : 0,
    status: 
      item.status === 'ocupado' ? 'occupied' :
      item.status === 'mantenimiento' ? 'maintenance' :
      'available',
    last_updated: item.timestamp || new Date().toISOString(),
    lot_id: item.lot_code ? parseInt(item.lot_code) : undefined,
    lot_name: item.lot_code ? `Lote #${item.lot_code}` : undefined,
    employee_name: item.lot_finca || undefined
  }))
}

const AreaCard = ({ area, onEdit, onDelete, onForceOccupation }: { 
  area: Area
  onEdit: (area: Area) => void
  onDelete: (area: Area) => void
  onForceOccupation: (areaId: number, status: string) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100'
      case 'occupied': return 'text-blue-600 bg-blue-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Ocupada'
      case 'maintenance': return 'Mantenimiento'
      default: return 'Desconocido'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon className="h-5 w-5" />
      case 'occupied': return <UserGroupIcon className="h-5 w-5" />
      case 'maintenance': return <ExclamationTriangleIcon className="h-5 w-5" />
      default: return <XCircleIcon className="h-5 w-5" />
    }
  }

  const occupancyPercentage = (area.current_occupancy / area.capacity) * 100

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getStatusColor(area.status)}`}>
            {getStatusIcon(area.status)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
            <p className="text-sm text-gray-500">
              Capacidad: {area.capacity} unidades
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(area)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(area)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Occupancy Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Ocupación</span>
            <span className="text-sm font-bold text-gray-900">
              {area.current_occupancy}/{area.capacity} ({occupancyPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                occupancyPercentage >= 90 ? 'bg-red-500' :
                occupancyPercentage >= 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(area.status)}`}>
            {getStatusText(area.status)}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(area.last_updated).toLocaleString()}
          </span>
        </div>

        {/* Lot Information */}
        {area.status === 'occupied' && area.lot_name && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">{area.lot_name}</span>
            </div>
            {area.employee_name && (
              <p className="text-xs text-blue-600 mt-1">Finca: {area.employee_name}</p>
            )}
          </div>
        )}
        
        {/* Manual Control Buttons */}
        <div className="flex gap-2 mt-4">
          {area.status !== 'available' && (
            <button
              onClick={() => onForceOccupation(area.id, 'libre')}
              className="flex-1 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              Liberar
            </button>
          )}
          {area.status !== 'occupied' && (
            <button
              onClick={() => onForceOccupation(area.id, 'ocupado')}
              className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Ocupar
            </button>
          )}
          {area.status !== 'maintenance' && (
            <button
              onClick={() => onForceOccupation(area.id, 'mantenimiento')}
              className="flex-1 px-3 py-2 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Mantenimiento
            </button>
          )}
        </div>

        {/* Maintenance Notice */}
        {area.status === 'maintenance' && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">En mantenimiento</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">Esta área no está disponible temporalmente</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Occupation() {
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setIsLoading(true)
        // Obtener resumen de ocupación desde la API
        const response = await api.get('/occupation/summary/')
        const apiData = response.data
        
        // Transformar datos de la API al formato esperado
        const transformedAreas = transformOccupationData(apiData)
        setAreas(transformedAreas)
      } catch (error) {
        console.error('Error fetching areas:', error)
        setAreas([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAreas()
    
    // Recargar cada 30 segundos para ver cambios en tiempo real
    const interval = setInterval(fetchAreas, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleEdit = (area: Area) => {
    setSelectedArea(area)
    setShowAddModal(true)
  }

  const handleDelete = async (area: Area) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${area.name}?`)) {
      try {
        // Aquí podrías llamar a la API para eliminar si existe ese endpoint
        // await api.delete(`/occupation/${area.id}/`)
        setAreas(areas.filter(a => a.id !== area.id))
      } catch (error) {
        console.error('Error deleting area:', error)
      }
    }
  }
  
  const handleForceOccupation = async (areaId: number, status: string) => {
    try {
      await api.post('/occupation/force/', {
        area_id: areaId,
        status: status,
        reason: 'Cambio manual'
      })
      // Recargar datos
      const response = await api.get('/occupation/summary/')
      const transformedAreas = transformOccupationData(response.data)
      setAreas(transformedAreas)
    } catch (error) {
      console.error('Error forcing occupation:', error)
    }
  }

  const totalCapacity = areas.reduce((sum, area) => sum + area.capacity, 0)
  const totalOccupancy = areas.reduce((sum, area) => sum + area.current_occupancy, 0)
  const occupiedAreas = areas.filter(area => area.status === 'occupied').length
  const availableAreas = areas.filter(area => area.status === 'available').length
  const maintenanceAreas = areas.filter(area => area.status === 'maintenance').length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando áreas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <BuildingOfficeIcon className="h-10 w-10 text-indigo-500 mr-3" />
              Gestión de Ocupación
            </h1>
            <p className="text-lg text-gray-600">
              Control y monitoreo de áreas de procesamiento
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Área</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Capacidad Total</p>
              <p className="text-3xl font-bold text-gray-900">{totalCapacity}</p>
              <p className="text-sm text-gray-500">unidades</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ocupación Actual</p>
              <p className="text-3xl font-bold text-gray-900">{totalOccupancy}</p>
              <p className="text-sm text-green-600">
                {((totalOccupancy / totalCapacity) * 100).toFixed(1)}% utilización
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <UserGroupIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Áreas Ocupadas</p>
              <p className="text-3xl font-bold text-gray-900">{occupiedAreas}</p>
              <p className="text-sm text-blue-600">de {areas.length} total</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Disponibles</p>
              <p className="text-3xl font-bold text-gray-900">{availableAreas}</p>
              <p className="text-sm text-gray-500">
                {maintenanceAreas > 0 && `${maintenanceAreas} en mantenimiento`}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onForceOccupation={handleForceOccupation}
          />
        ))}
      </div>

      {/* Empty State */}
      {areas.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay áreas registradas</h3>
          <p className="text-gray-600 mb-6">Comienza agregando tu primera área de procesamiento</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Agregar Área
          </button>
        </div>
      )}
    </div>
  )
}