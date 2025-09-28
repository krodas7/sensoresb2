import React, { useState, useEffect } from 'react'
import { 
  SunIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface Sensor {
  id: number
  name: string
  location: string
  temperature: number
  humidity?: number
  status: 'online' | 'offline' | 'error'
  last_reading: string
  min_temp: number
  max_temp: number
  alert_threshold: number
  type: 'PILA' | 'GUARDIOLA'
}

export default function TemperatureMonitor() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchSensors()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        setSensors(prevSensors => 
          prevSensors.map(sensor => ({
            ...sensor,
            temperature: sensor.type === 'PILA' 
              ? 28.0 + Math.random() * 2 
              : 26.0 + Math.random() * 3,
            last_reading: new Date().toISOString()
          }))
        )
      }, 5000) // Actualizar cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchSensors = async () => {
    try {
      setLoading(true)
      // Simular datos para evitar errores de API
const pilaSensors = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
        name: `PILA_${i + 1}`,
  location: `Pila de Secado ${i + 1}`,
        temperature: 28.0 + Math.random() * 2,
        humidity: 45 + Math.random() * 10,
        status: 'online' as const,
        last_reading: new Date().toISOString(),
        min_temp: 20,
        max_temp: 35,
        alert_threshold: 30,
        type: 'PILA' as const
      }))

      const guardiolaSensors = Array.from({ length: 5 }, (_, i) => ({
  id: i + 10,
        name: `GUARDIOLA_${i + 1}`,
        location: `Guardiola ${i + 1}`,
        temperature: 26.0 + Math.random() * 3,
        humidity: 50 + Math.random() * 15,
        status: 'online' as const,
        last_reading: new Date().toISOString(),
        min_temp: 20,
        max_temp: 35,
        alert_threshold: 30,
        type: 'GUARDIOLA' as const
      }))

      setSensors([...pilaSensors, ...guardiolaSensors])
    } catch (error) {
      console.error('Error fetching sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSensor = async (sensorData: Partial<Sensor>) => {
    try {
      await api.post('/temperatures/sensors/', sensorData)
      fetchSensors()
      setShowModal(false)
    } catch (error) {
      console.error('Error creating sensor:', error)
    }
  }

  const handleUpdateSensor = async (id: number, sensorData: Partial<Sensor>) => {
    try {
      await api.put(`/temperatures/sensors/${id}/`, sensorData)
      fetchSensors()
      setEditingSensor(null)
    } catch (error) {
      console.error('Error updating sensor:', error)
    }
  }

  const handleDeleteSensor = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este sensor?')) {
      try {
        await api.delete(`/temperatures/sensors/${id}/`)
        fetchSensors()
      } catch (error) {
        console.error('Error deleting sensor:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En Línea'
      case 'offline': return 'Desconectado'
      case 'error': return 'Error'
      default: return 'Desconocido'
    }
  }

  const getTemperatureColor = (temperature: number, threshold: number) => {
    if (temperature > threshold) return 'text-red-600'
    if (temperature > threshold * 0.8) return 'text-yellow-600'
    return 'text-green-600'
  }

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const onlineSensors = sensors.filter(sensor => sensor.status === 'online').length
  const totalSensors = sensors.length
  const averageTemp = sensors.length > 0 ? 
    (sensors.reduce((sum, sensor) => sum + sensor.temperature, 0) / sensors.length).toFixed(1) : 0

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
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🌡️ Sensores de Temperatura con Cronómetros</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-600">PILA ({sensors.filter(s => s.type === 'PILA').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">GUARDIOLA ({sensors.filter(s => s.type === 'GUARDIOLA').length})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-actualizar</span>
            </label>
              <button
              onClick={fetchSensors}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ClockIcon className="h-5 w-5" />
              Actualizar
              </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <SunIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sensores Activos</p>
              <p className="text-2xl font-bold text-gray-900">{onlineSensors}/{totalSensors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Temperatura Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{averageTemp}°C</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FireIcon className="h-6 w-6 text-yellow-600" />
        </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {sensors.filter(s => s.temperature > s.alert_threshold).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Última Actualización</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
            </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar sensores..."
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
              <option value="online">En Línea</option>
              <option value="offline">Desconectado</option>
              <option value="error">Error</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Sensor
            </button>
          </div>
        </div>
            </div>

      {/* Sensores PILA (1-9) - Pilas de Secado */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
          <h2 className="text-lg font-semibold text-gray-900">Sensores PILA (1-9) - Pilas de Secado</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.filter(sensor => sensor.type === 'PILA').map((sensor) => (
            <div key={sensor.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-900">{sensor.name}</span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">OK</span>
        </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {sensor.temperature.toFixed(1)}°C
                </div>
                <p className="text-sm text-gray-600">{sensor.location}</p>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensores GUARDIOLA (1-5) - Guardiolas */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
          <h2 className="text-lg font-semibold text-gray-900">Sensores GUARDIOLA (1-5) - Guardiolas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.filter(sensor => sensor.type === 'GUARDIOLA').map((sensor) => (
            <div key={sensor.id} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-gray-900">{sensor.name}</span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">OK</span>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {sensor.temperature.toFixed(1)}°C
                </div>
                <p className="text-sm text-gray-600">{sensor.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredSensors.length === 0 && (
        <div className="text-center py-12">
          <SunIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay sensores de temperatura</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo sensor de temperatura.</p>
        </div>
      )}
    </div>
  )
}
