import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  SunIcon, 
  UserGroupIcon,
  CubeIcon,
  TruckIcon,
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface DashboardStats {
  totalLots: number
  activeSensors: number
  totalEmployees: number
  completedProcesses: number
  averageTemperature: number
  systemUptime: number
}

interface SensorData {
  id: number
  name: string
  temperature: number
  status: string
  lastReading: string
  type: 'PILA' | 'GUARDIOLA'
}

interface ActiveWeighingData {
  integration: {
    id: number
    name: string
    destination: string
    client: string
    totalWeight: number
  }
  partidas: Array<{
    id: string
    numeroIngreso: string
    pesoEsperado: number
    pesoTotalRegistrado: number
    pesajes: Array<{
      netWeight: number
    }>
  }>
  weighingData: Array<{
    netWeight: number
  }>
  timestamp: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLots: 0,
    activeSensors: 0,
    totalEmployees: 0,
    completedProcesses: 0,
    averageTemperature: 0,
    systemUptime: 99.9
  })
  const [sensors, setSensors] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeWeighing, setActiveWeighing] = useState<ActiveWeighingData | null>(null)

  useEffect(() => {
    fetchDashboardData()
    loadActiveWeighing()
    
    // Actualizar temperaturas cada 10 segundos
    const interval = setInterval(() => {
      setSensors(prevSensors => 
        prevSensors.map(sensor => ({
          ...sensor,
          temperature: sensor.type === 'PILA' 
            ? 28.0 + Math.random() * 2 
            : 26.0 + Math.random() * 3,
          lastReading: `${Math.floor(Math.random() * 5) + 1} min ago`
        }))
      )
    }, 10000)
    
    // Verificar pesaje activo cada 5 segundos
    const weighingInterval = setInterval(() => {
      loadActiveWeighing()
    }, 5000)
    
    return () => {
      clearInterval(interval)
      clearInterval(weighingInterval)
    }
  }, [])

  const loadActiveWeighing = () => {
    try {
      const storedActiveWeighing = localStorage.getItem('activeWeighing')
      if (storedActiveWeighing) {
        const activeWeighingData = JSON.parse(storedActiveWeighing)
        setActiveWeighing(activeWeighingData)
      } else {
        setActiveWeighing(null)
      }
    } catch (error) {
      console.error('Error loading active weighing:', error)
      setActiveWeighing(null)
    }
  }

  const handleCancelWeighing = () => {
    localStorage.removeItem('activeWeighing')
    setActiveWeighing(null)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Simular datos para el dashboard
      setStats({
        totalLots: 24,
        activeSensors: 14, // 9 PILA + 5 GUARDIOLA
        totalEmployees: 12,
        completedProcesses: 156,
        averageTemperature: 26.8,
        systemUptime: 99.9
      })

      // Generar datos para PILA 1-9 y GUARDIOLA 1-5
      const pilaSensors = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        name: `PILA_${i + 1}`,
        temperature: 28.0 + Math.random() * 2,
        status: 'online',
        lastReading: `${Math.floor(Math.random() * 5) + 1} min ago`,
        type: 'PILA' as const
      }))

      const guardiolaSensors = Array.from({ length: 5 }, (_, i) => ({
        id: i + 10,
        name: `GUARDIOLA_${i + 1}`,
        temperature: 26.0 + Math.random() * 3,
        status: 'online',
        lastReading: `${Math.floor(Math.random() * 5) + 1} min ago`,
        type: 'GUARDIOLA' as const
      }))

      setSensors([...pilaSensors, ...guardiolaSensors])
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ☕ Sistema de Beneficio de Café
              </h1>
              <p className="text-gray-600 mt-1">Panel de Control Principal</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Última actualización</div>
              <div className="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        
        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <SunIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sensores Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSensors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Procesos Completados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProcesses}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Tarjeta de Pesaje Activo */}
        {activeWeighing && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <ScaleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pesaje en Progreso
                  </h3>
                  <p className="text-sm text-gray-600">
                    Integración: <span className="font-medium">{activeWeighing.integration.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelWeighing}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Cancelar pesaje"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Destino</div>
                <div className="font-semibold text-gray-900">{activeWeighing.integration.destination}</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Cliente</div>
                <div className="font-semibold text-gray-900">{activeWeighing.integration.client}</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Peso Esperado</div>
                <div className="font-semibold text-gray-900">{activeWeighing.integration.totalWeight} qq</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Peso Registrado</div>
                <div className="font-semibold text-gray-900">
                  {(activeWeighing.weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0) / 100).toFixed(2)} qq
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Partidas: <span className="font-medium">{activeWeighing.partidas.length}</span></span>
                  <span>Pesajes: <span className="font-medium">{activeWeighing.weighingData.length}</span></span>
                  <span>Progreso: <span className="font-medium">
                    {activeWeighing.integration.totalWeight > 0 
                      ? ((activeWeighing.weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0) / (activeWeighing.integration.totalWeight * 100)) * 100).toFixed(1)
                      : 0
                    }%
                  </span></span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.location.href = '/shipping-weights'}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Continuar Pesaje
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoreo de Sensores - Ampliado */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <SunIcon className="h-6 w-6 mr-3" />
              Monitoreo de Sensores en Tiempo Real
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-gray-600 font-medium">PILA ({sensors.filter(s => s.type === 'PILA').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600 font-medium">GUARDIOLA ({sensors.filter(s => s.type === 'GUARDIOLA').length})</span>
              </div>
            </div>
          </div>
          
          {/* Sensores PILA */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
              <h4 className="text-lg font-medium text-gray-800">Sensores PILA (1-9) - Pilas de Secado</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sensors.filter(sensor => sensor.type === 'PILA').map((sensor) => (
                <div key={sensor.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{sensor.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {sensor.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-gray-500">{sensor.lastReading}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sensores GUARDIOLA */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <h4 className="text-lg font-medium text-gray-800">Sensores GUARDIOLA (1-5) - Guardiolas</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sensors.filter(sensor => sensor.type === 'GUARDIOLA').map((sensor) => (
                <div key={sensor.id} className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{sensor.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {sensor.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-gray-500">{sensor.lastReading}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Procesos Recientes y Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Procesos Recientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Procesos Recientes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border-l-4 border-green-400 bg-green-50">
                <div>
                  <div className="font-medium text-gray-900">Lote #2024-001</div>
                  <div className="text-sm text-gray-600">Fermentación completada</div>
                </div>
                <span className="text-sm text-gray-500">Hace 15 min</span>
              </div>
              <div className="flex items-center justify-between p-3 border-l-4 border-blue-400 bg-blue-50">
                <div>
                  <div className="font-medium text-gray-900">Lote #2024-002</div>
                  <div className="text-sm text-gray-600">En proceso de secado</div>
                </div>
                <span className="text-sm text-gray-500">Hace 2 horas</span>
              </div>
              <div className="flex items-center justify-between p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div>
                  <div className="font-medium text-gray-900">Lote #2024-003</div>
                  <div className="text-sm text-gray-600">Preparando para fermentación</div>
                </div>
                <span className="text-sm text-gray-500">Hace 4 horas</span>
              </div>
            </div>
          </div>

          {/* Alertas y Notificaciones */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Alertas del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Temperatura Alta</div>
                    <div className="text-sm text-gray-600">PILA_2 superó 30°C</div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Hace 5 min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Sistema Estable</div>
                    <div className="text-sm text-gray-600">Todos los sensores funcionando</div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Hace 1 hora</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <BeakerIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Nuevo Lote</div>
                    <div className="text-sm text-gray-600">Lote #2024-004 recibido</div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Hace 3 horas</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}