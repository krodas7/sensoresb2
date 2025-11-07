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
  temperature: number | null
  humidity?: number
  status: 'online' | 'offline' | 'error'
  last_reading: string | null
  min_temp: number
  max_temp: number
  alert_threshold: number
  type: 'HORNO' | 'PILA' | 'GUARDIOLA'
  raspberry?: string
  raspberry_ip?: string
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
        fetchSensors() // Recargar datos reales del servidor
      }, 30000) // Actualizar cada 30 segundos (mismo intervalo que las Raspberry Pis)
      return () => clearInterval(interval)
    }
  }, [autoRefresh]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lista fija de sensores esperados
  const getExpectedSensors = (): Sensor[] => {
    const sensors: Sensor[] = []
    
    // 1 Horno
    sensors.push({
      id: 0,
      name: 'Horno',
      location: 'Horno',
      temperature: null,
      status: 'offline',
      last_reading: null,
      min_temp: 20,
      max_temp: 80,
      alert_threshold: 50,
      type: 'HORNO'
    })
    
    // 9 Pilas de Secado
    for (let i = 1; i <= 9; i++) {
      sensors.push({
        id: i,
        name: `Pila de Secado ${i}`,
        location: `Pila de Secado ${i}`,
        temperature: null,
        status: 'offline',
        last_reading: null,
        min_temp: 20,
        max_temp: 80,
        alert_threshold: 50,
        type: 'PILA'
      })
    }
    
    // 4 Guardiolas
    for (let i = 1; i <= 4; i++) {
      sensors.push({
        id: 10 + i,
        name: `Guardiola ${i}`,
        location: `Guardiola ${i}`,
        temperature: null,
        status: 'offline',
        last_reading: null,
        min_temp: 20,
        max_temp: 80,
        alert_threshold: 50,
        type: 'GUARDIOLA'
      })
    }
    
    return sensors
  }

  const fetchSensors = async () => {
    try {
      setLoading(true)
      // Llamar al endpoint real de temperaturas
      const response = await api.get('/sensors/temperatura/resumen/')
      const data = response.data
      
      // Obtener lista fija de sensores esperados
      const expectedSensors = getExpectedSensors()
      
      // Crear un mapa de los datos recibidos por nombre del sensor (normalizado)
      const dataMap = new Map<string, any>()
      ;(data.ultimas_mediciones || []).forEach((medicion: any) => {
        const sensorName = (medicion.sensor || '').trim()
        dataMap.set(sensorName, medicion)
        // También agregar variaciones del nombre para mayor flexibilidad
        if (sensorName.toLowerCase().includes('horno')) {
          dataMap.set('Horno', medicion)
        }
        if (sensorName.toLowerCase().includes('pila') && sensorName.toLowerCase().includes('secado')) {
          // Extraer número de pila
          const match = sensorName.match(/\d+/)
          if (match) {
            dataMap.set(`Pila de Secado ${match[0]}`, medicion)
          }
        }
        if (sensorName.toLowerCase().includes('guardiola')) {
          // Extraer número de guardiola
          const match = sensorName.match(/\d+/)
          if (match) {
            dataMap.set(`Guardiola ${match[0]}`, medicion)
          }
        }
      })
      
      // Mapear los datos recibidos a los sensores esperados
      const mappedSensors: Sensor[] = expectedSensors.map((expectedSensor) => {
        const medicion = dataMap.get(expectedSensor.name) || 
                        dataMap.get(expectedSensor.name.toLowerCase())
        
        if (medicion) {
          // Determinar el estado basado en el estado del endpoint
          let status: 'online' | 'offline' | 'error' = 'online'
          if (medicion.estado === 'ERROR') {
            status = 'error'
          } else if (medicion.estado === 'WARNING') {
            status = 'online' // Mantener online pero mostrará alerta por temperatura
          }
          
          // Convertir temperatura de string a número
          const temperatura = parseFloat(medicion.temperatura) || null
          
          return {
            ...expectedSensor,
            temperature: temperatura,
            status: status,
            last_reading: medicion.timestamp || null,
            raspberry: medicion.raspberry || '',
            raspberry_ip: medicion.raspberry_ip || ''
          }
        }
        
        // Si no hay datos, mantener el sensor con valores por defecto (offline)
        return expectedSensor
      })
      
      setSensors(mappedSensors)
    } catch (error) {
      console.error('Error fetching sensors:', error)
      // En caso de error, mostrar sensores esperados sin datos
      setSensors(getExpectedSensors())
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'OK': return 'bg-green-100 text-green-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const onlineSensors = sensors.filter(sensor => sensor.status === 'online').length
  const totalSensors = sensors.length
  const sensorsWithData = sensors.filter(s => s.temperature !== null)
  const averageTemp = sensorsWithData.length > 0 ? 
    (sensorsWithData.reduce((sum, sensor) => sum + (sensor.temperature || 0), 0) / sensorsWithData.length).toFixed(1) : 'N/A'

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
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-gray-600">HORNO (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-600">PILAS (9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">GUARDIOLAS (4)</span>
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
                {sensors.filter(s => s.temperature !== null && s.temperature > s.alert_threshold).length}
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

      {/* Horno */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
          <h2 className="text-lg font-semibold text-gray-900">Horno</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.filter(sensor => sensor.type === 'HORNO').map((sensor) => (
            <div key={sensor.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    sensor.status === 'online' ? 'bg-green-500' : 
                    sensor.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium text-gray-900">{sensor.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  sensor.temperature === null 
                    ? 'bg-gray-100 text-gray-800'
                    : sensor.temperature > sensor.alert_threshold 
                    ? 'bg-red-100 text-red-800' 
                    : sensor.temperature > sensor.alert_threshold * 0.8
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {sensor.temperature === null ? 'SIN DATOS' : 
                   sensor.temperature > sensor.alert_threshold ? 'ALERTA' : 'OK'}
                </span>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  sensor.temperature === null ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : 'N/A'}
                </div>
                <p className="text-sm text-gray-600 mb-2">{sensor.location}</p>
                {sensor.last_reading && (
                  <p className="text-xs text-gray-500">
                    {new Date(sensor.last_reading).toLocaleString('es-GT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                )}
                {!sensor.last_reading && (
                  <p className="text-xs text-gray-400">Sin datos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensores PILA (1-9) - Pilas de Secado */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
          <h2 className="text-lg font-semibold text-gray-900">Pilas de Secado (1-9)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.filter(sensor => sensor.type === 'PILA').map((sensor) => (
            <div key={sensor.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    sensor.status === 'online' ? 'bg-green-500' : 
                    sensor.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium text-gray-900">{sensor.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  sensor.temperature === null 
                    ? 'bg-gray-100 text-gray-800'
                    : sensor.temperature > sensor.alert_threshold 
                    ? 'bg-red-100 text-red-800' 
                    : sensor.temperature > sensor.alert_threshold * 0.8
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {sensor.temperature === null ? 'SIN DATOS' : 
                   sensor.temperature > sensor.alert_threshold ? 'ALERTA' : 'OK'}
                </span>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  sensor.temperature === null ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : 'N/A'}
                </div>
                <p className="text-sm text-gray-600 mb-2">{sensor.location}</p>
                {sensor.last_reading && (
                  <p className="text-xs text-gray-500">
                    {new Date(sensor.last_reading).toLocaleString('es-GT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                )}
                {!sensor.last_reading && (
                  <p className="text-xs text-gray-400">Sin datos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensores GUARDIOLA (1-4) - Guardiolas */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
          <h2 className="text-lg font-semibold text-gray-900">Guardiolas (1-4)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.filter(sensor => sensor.type === 'GUARDIOLA').map((sensor) => (
            <div key={sensor.id} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    sensor.status === 'online' ? 'bg-green-500' : 
                    sensor.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium text-gray-900">{sensor.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  sensor.temperature === null 
                    ? 'bg-gray-100 text-gray-800'
                    : sensor.temperature > sensor.alert_threshold 
                    ? 'bg-red-100 text-red-800' 
                    : sensor.temperature > sensor.alert_threshold * 0.8
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {sensor.temperature === null ? 'SIN DATOS' : 
                   sensor.temperature > sensor.alert_threshold ? 'ALERTA' : 'OK'}
                </span>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  sensor.temperature === null ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : 'N/A'}
                </div>
                <p className="text-sm text-gray-600 mb-2">{sensor.location}</p>
                {sensor.last_reading && (
                  <p className="text-xs text-gray-500">
                    {new Date(sensor.last_reading).toLocaleString('es-GT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                )}
                {!sensor.last_reading && (
                  <p className="text-xs text-gray-400">Sin datos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
