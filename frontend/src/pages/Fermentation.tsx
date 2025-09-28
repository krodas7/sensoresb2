import React, { useState, useEffect } from 'react'
import { 
  BeakerIcon,
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SunIcon,
  EyeDropperIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface FermentationTank {
  id: number
  name: string
  capacity: number
  current_volume: number
  temperature: number
  ph_level: number
  start_time: string
  expected_duration: number
  lot_id: number
  status: 'active' | 'preparing' | 'completed' | 'error'
}

export default function Fermentation() {
  const [tanks, setTanks] = useState<FermentationTank[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTank, setEditingTank] = useState<FermentationTank | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [simulationRunning, setSimulationRunning] = useState(true)

  useEffect(() => {
    fetchTanks()
  }, [])

  useEffect(() => {
    if (simulationRunning) {
    const interval = setInterval(() => {
        setTanks(prevTanks => 
          prevTanks.map(tank => {
            if (tank.status === 'active') {
              // Simular cambios graduales en el volumen durante la fermentación
              const change = (Math.random() - 0.5) * 10 // Cambio aleatorio entre -5 y +5
              const newVolume = Math.max(0, Math.min(tank.capacity, tank.current_volume + change))
              
            return {
                ...tank,
                current_volume: newVolume,
                temperature: tank.temperature + (Math.random() - 0.5) * 0.5, // Cambio pequeño en temperatura
                ph_level: Math.max(6.0, Math.min(7.5, tank.ph_level + (Math.random() - 0.5) * 0.1)) // Cambio pequeño en pH
              }
            }
            return tank
          })
        )
      }, 3000) // Actualizar cada 3 segundos

    return () => clearInterval(interval)
    }
  }, [simulationRunning])

  const fetchTanks = async () => {
    try {
      setLoading(true)
      // Simular datos para evitar errores de API
      setTanks([
        { id: 1, name: 'Tanque 1', capacity: 1000, current_volume: 850, temperature: 24.5, ph_level: 6.8, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024001, status: 'active' },
        { id: 2, name: 'Tanque 2', capacity: 1000, current_volume: 320, temperature: 25.2, ph_level: 6.5, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024002, status: 'preparing' },
        { id: 3, name: 'Tanque 3', capacity: 1000, current_volume: 1000, temperature: 26.1, ph_level: 6.2, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024003, status: 'completed' },
        { id: 4, name: 'Tanque 4', capacity: 1000, current_volume: 150, temperature: 23.8, ph_level: 7.0, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024004, status: 'preparing' },
        { id: 5, name: 'Tanque 5', capacity: 1000, current_volume: 650, temperature: 25.8, ph_level: 6.3, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024005, status: 'active' },
        { id: 6, name: 'Tanque 6', capacity: 1000, current_volume: 420, temperature: 24.9, ph_level: 6.7, start_time: new Date().toISOString(), expected_duration: 24, lot_id: 2024006, status: 'active' }
      ])
    } catch (error) {
      console.error('Error fetching tanks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTank = async (tankData: Partial<FermentationTank>) => {
    try {
      await api.post('/fermentation/tanks/', tankData)
      fetchTanks()
      setShowModal(false)
    } catch (error) {
      console.error('Error creating tank:', error)
    }
  }

  const handleUpdateTank = async (id: number, tankData: Partial<FermentationTank>) => {
    try {
      await api.put(`/fermentation/tanks/${id}/`, tankData)
      fetchTanks()
      setEditingTank(null)
    } catch (error) {
      console.error('Error updating tank:', error)
    }
  }

  const handleDeleteTank = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tanque?')) {
      try {
        await api.delete(`/fermentation/tanks/${id}/`)
        fetchTanks()
      } catch (error) {
        console.error('Error deleting tank:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'preparing': return 'Preparando'
      case 'completed': return 'Completado'
      case 'error': return 'Error'
      default: return 'Desconocido'
    }
  }

  const filteredTanks = tanks.filter(tank => {
    const matchesSearch = tank.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tank.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">🍇 Control de Fermentación</h1>
        </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tanques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="preparing">Preparando</option>
              <option value="completed">Completado</option>
              <option value="error">Error</option>
            </select>
            <button
              onClick={() => setSimulationRunning(!simulationRunning)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                simulationRunning 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {simulationRunning ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Pausar Simulación
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Reanudar Simulación
                </>
              )}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Tanque
            </button>
          </div>
        </div>
            </div>

      {/* Leyenda de niveles */}
      <div className="bg-white rounded-lg shadow-sm border p-3 mb-4">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-t from-red-400 to-red-600 rounded"></div>
            <span className="text-gray-500">Bajo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded"></div>
            <span className="text-gray-500">Medio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-t from-green-400 to-green-600 rounded"></div>
            <span className="text-gray-500">Alto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse"></div>
            </div>
            <span className="text-gray-500">Sensor</span>
          </div>
        </div>
      </div>

      {/* Lista de tanques con representación visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTanks.map((tank) => {
          const fillPercentage = (tank.current_volume / tank.capacity) * 100
          const fillColor = fillPercentage > 80 ? 'from-green-400 to-green-600' : 
                           fillPercentage > 50 ? 'from-yellow-400 to-yellow-600' : 
                           'from-red-400 to-red-600'
          
          return (
            <div key={tank.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-900">{tank.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tank.status)}`}>
                  {getStatusText(tank.status)}
                </span>
              </div>
              
              {/* Representación visual de la pila */}
              <div className="mb-4">
                <div className="text-center mb-2">
                  <div className="text-lg font-bold text-gray-900">{fillPercentage.toFixed(1)}%</div>
                </div>
                
                {/* Tanque visual */}
                <div className="relative mx-auto w-20 h-28 border-2 border-gray-300 rounded bg-gray-50 overflow-hidden">
                  {/* Líquido en el tanque */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${fillColor} transition-all duration-1000 ease-in-out`}
                    style={{ height: `${fillPercentage}%` }}
                  >
                    {/* Efecto de ondas en la superficie */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                  
                  {/* Sensor ultrasónico simulado */}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Indicadores de nivel */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0L</span>
                  <span>50%</span>
                  <span>1000L</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Lote:</span>
                  <span className="font-medium">#{tank.lot_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Volumen:</span>
                  <span className="font-medium">{tank.current_volume}L</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Temp:</span>
                  <span className="font-medium text-blue-600">{tank.temperature}°C</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">pH:</span>
                  <span className="font-medium text-green-600">{tank.ph_level}</span>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditingTank(tank)}
                  className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <PencilIcon className="h-3 w-3" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteTank(tank.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                >
                  <TrashIcon className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
          </div>

      {filteredTanks.length === 0 && (
        <div className="text-center py-12">
          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tanques de fermentación</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo tanque de fermentación.</p>
        </div>
      )}
    </div>
  )
}
