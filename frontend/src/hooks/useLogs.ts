import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export interface LogEntry {
  id: number
  user: {
    id: number | null
    username: string | null
    display_name: string
  }
  level: {
    value: string
    display: string
    color: string
  }
  category: {
    value: string
    display: string
    icon: string
  }
  action: {
    value: string
    display: string
  }
  message: string
  description?: string
  module: string
  object_type?: string
  object_id?: string
  metadata: Record<string, any>
  ip_address?: string
  timestamp: string
  created_at: string
}

export interface LogFilter {
  id?: number
  name: string
  filters: Record<string, any>
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface LogExport {
  id: number
  user: {
    id: number
    username: string
    display_name: string
  }
  filename: string
  format: string
  filters: Record<string, any>
  record_count: number
  file_path?: string
  created_at: string
}

export interface LogStats {
  total_logs: number
  logs_by_level: Record<string, number>
  logs_by_category: Record<string, number>
  logs_by_user: Record<string, number>
  logs_by_module: Record<string, number>
  recent_activities: LogEntry[]
  top_users: Array<{
    user__username: string
    user__first_name: string
    user__last_name: string
    activity_count: number
  }>
  system_health: {
    errors_24h: number
    warnings_24h: number
    health_status: 'healthy' | 'warning' | 'critical'
    last_24h_logs: number
    last_7d_logs: number
    last_30d_logs: number
  }
}

export interface LogFilterOptions {
  levels: Array<{ value: string; label: string }>
  categories: Array<{ value: string; label: string }>
  actions: Array<{ value: string; label: string }>
  modules: string[]
  users: Array<{
    id: number
    username: string
    first_name: string
    last_name: string
  }>
  object_types: string[]
}

export interface LogSearchParams {
  query?: string
  level?: string
  category?: string
  action?: string
  module?: string
  user_id?: number
  start_date?: string
  end_date?: string
  ip_address?: string
  object_type?: string
  object_id?: string
  page?: number
  page_size?: number
}

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LogStats | null>(null)
  const [filterOptions, setFilterOptions] = useState<LogFilterOptions | null>(null)
  const [filters, setFilters] = useState<LogFilter[]>([])
  const [exports, setExports] = useState<LogExport[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 0
  })

  // Fetch logs with search parameters
  const fetchLogs = async (params: LogSearchParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (params.query) queryParams.append('query', params.query)
      if (params.level) queryParams.append('level', params.level)
      if (params.category) queryParams.append('category', params.category)
      if (params.action) queryParams.append('action', params.action)
      if (params.module) queryParams.append('module', params.module)
      if (params.user_id) queryParams.append('user_id', params.user_id.toString())
      if (params.start_date) queryParams.append('start_date', params.start_date)
      if (params.end_date) queryParams.append('end_date', params.end_date)
      if (params.ip_address) queryParams.append('ip_address', params.ip_address)
      if (params.object_type) queryParams.append('object_type', params.object_type)
      if (params.object_id) queryParams.append('object_id', params.object_id)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.page_size) queryParams.append('page_size', params.page_size.toString())

      const response = await api.get(`/logs/?${queryParams.toString()}`)
      setLogs(response.data.results || response.data)
      
      // Update pagination if available
      if (response.data.count !== undefined) {
        setPagination({
          page: response.data.page || 1,
          page_size: response.data.page_size || 50,
          total: response.data.count,
          total_pages: Math.ceil(response.data.count / (response.data.page_size || 50))
        })
      }
      
    } catch (err: any) {
      console.error('Error fetching logs:', err)
      setError(err.response?.data?.detail || 'Error al cargar logs')
      toast.error('Error al cargar logs')
    } finally {
      setLoading(false)
    }
  }

  // Generate mock logs data
  const generateMockLogs = (params: LogSearchParams = {}): LogEntry[] => {
    const mockUsers = [
      { id: 1, username: 'admin', display_name: 'Administrador' },
      { id: 2, username: 'catador1', display_name: 'Juan Pérez' },
      { id: 3, username: 'operador1', display_name: 'María García' },
      { id: 4, username: 'supervisor1', display_name: 'Carlos López' }
    ]
    
    const levels = ['info', 'warning', 'error', 'success', 'debug'] as const
    const categories = ['auth', 'user', 'attendance', 'cupping', 'shipping', 'integrations', 'reports', 'temperature', 'occupation', 'lots', 'fermentation', 'employees', 'areas', 'sensors', 'system'] as const
    const actions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'download', 'upload', 'export', 'import', 'approve', 'reject', 'start', 'stop', 'pause', 'resume', 'generate', 'print', 'send', 'receive', 'view', 'search', 'filter', 'sort'] as const
    const modules = ['Authentication', 'Cupping', 'Reports', 'Logs', 'ShippingWeights', 'LotIntegration', 'TemperatureMonitor', 'Occupation', 'Lots', 'Fermentation', 'Employees', 'Attendance']
    
    const logs: LogEntry[] = []
    const now = new Date()
    
    // Generate 50 mock log entries
    for (let i = 0; i < 50; i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const level = levels[Math.floor(Math.random() * levels.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const module = modules[Math.floor(Math.random() * modules.length)]
      
      const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
      
      const log: LogEntry = {
        id: i + 1,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name
        },
        level: {
          value: level,
          display: level.charAt(0).toUpperCase() + level.slice(1),
          color: level === 'info' ? 'blue' : level === 'warning' ? 'yellow' : level === 'error' ? 'red' : level === 'success' ? 'green' : 'gray'
        },
        category: {
          value: category,
          display: category.charAt(0).toUpperCase() + category.slice(1),
          icon: category === 'auth' ? '🔐' : category === 'user' ? '👥' : category === 'attendance' ? '⏰' : category === 'cupping' ? '☕' : category === 'shipping' ? '📦' : category === 'integrations' ? '🔗' : category === 'reports' ? '📊' : category === 'temperature' ? '🌡️' : category === 'occupation' ? '🏢' : category === 'lots' ? '📋' : category === 'fermentation' ? '🔄' : category === 'employees' ? '👷' : category === 'areas' ? '📍' : category === 'sensors' ? '📡' : '⚙️'
        },
        action: {
          value: action,
          display: action.charAt(0).toUpperCase() + action.slice(1)
        },
        message: `${action} ${category} en ${module}`,
        description: `Descripción del log ${i + 1}`,
        module,
        object_type: 'TestObject',
        object_id: `obj-${i + 1}`,
        metadata: { test: true, index: i + 1 },
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp: timestamp.toISOString(),
        created_at: timestamp.toISOString()
      }
      
      logs.push(log)
    }
    
    // Apply filters
    let filteredLogs = logs
    
    if (params.query) {
      const query = params.query.toLowerCase()
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query)
      )
    }
    
    if (params.level) {
      filteredLogs = filteredLogs.filter(log => log.level.value === params.level)
    }
    
    if (params.category) {
      filteredLogs = filteredLogs.filter(log => log.category.value === params.category)
    }
    
    if (params.action) {
      filteredLogs = filteredLogs.filter(log => log.action.value === params.action)
    }
    
    if (params.module) {
      filteredLogs = filteredLogs.filter(log => log.module.toLowerCase().includes(params.module!.toLowerCase()))
    }
    
    if (params.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user.id === params.user_id)
    }
    
    return filteredLogs
  }

  // Fetch log statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats/')
      setStats(response.data)
    } catch (err: any) {
      console.error('Error fetching log stats:', err)
      toast.error('Error al cargar estadísticas')
    }
  }

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/logs/filter-options/')
      setFilterOptions(response.data)
    } catch (err: any) {
      console.error('Error fetching filter options:', err)
      toast.error('Error al cargar opciones de filtros')
    }
  }

  // Fetch saved filters
  const fetchFilters = async () => {
    try {
      const response = await api.get('/logs/filters/')
      const data = response.data.results || response.data || []
      setFilters(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error fetching filters:', err)
      setFilters([])
    }
  }

  // Save filter
  const saveFilter = async (filterData: Omit<LogFilter, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await api.post('/logs/filters/', filterData)
      const newFilter = response.data
      setFilters(prev => [...prev, newFilter])
      toast.success('Filtro guardado exitosamente')
      return newFilter
    } catch (err: any) {
      console.error('Error saving filter:', err)
      toast.error('Error al guardar filtro')
      throw err
    }
  }

  // Delete filter
  const deleteFilter = async (filterId: number) => {
    try {
      await api.delete(`/logs/filters/${filterId}/`)
      setFilters(prev => prev.filter(f => f.id !== filterId))
      toast.success('Filtro eliminado exitosamente')
    } catch (err: any) {
      console.error('Error deleting filter:', err)
      toast.error('Error al eliminar filtro')
    }
  }

  // Export logs
  const exportLogs = async (exportParams: LogSearchParams & { format?: string }) => {
    try {
      const response = await api.post('/logs/export/', exportParams)
      toast.success(response.data.message || 'Exportación iniciada exitosamente')
      fetchExports() // Actualizar lista de exportaciones
      return response.data
    } catch (err: any) {
      console.error('Error exporting logs:', err)
      toast.error('Error al exportar logs')
      throw err
    }
  }

  // Fetch exports
  const fetchExports = async () => {
    try {
      const response = await api.get('/logs/exports/')
      const data = response.data.results || response.data || []
      setExports(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error fetching exports:', err)
      setExports([])
    }
  }

  // Create a new log entry
  const createLog = async (logData: {
    level: string
    category: string
    action: string
    message: string
    description?: string
    module: string
    object_type?: string
    object_id?: string
    metadata?: Record<string, any>
  }) => {
    try {
      const response = await api.post('/logs/create/', logData)
      
      // Add to current logs
      setLogs(prev => [response.data, ...prev])
      return response.data
    } catch (err: any) {
      console.error('Error creating log:', err)
      toast.error('Error al crear log')
      throw err
    }
  }

  // Get log level color class for UI
  const getLevelColorClass = (level: string) => {
    const colors: Record<string, string> = {
      'info': 'text-blue-600 bg-blue-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'error': 'text-red-600 bg-red-100',
      'success': 'text-green-600 bg-green-100',
      'debug': 'text-gray-600 bg-gray-100',
    }
    return colors[level] || 'text-gray-600 bg-gray-100'
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'auth': '🔐',
      'user': '👥',
      'attendance': '⏰',
      'cupping': '☕',
      'shipping': '📦',
      'integrations': '🔗',
      'reports': '📊',
      'temperature': '🌡️',
      'occupation': '🏢',
      'lots': '📋',
      'fermentation': '🔄',
      'employees': '👷',
      'areas': '📍',
      'sensors': '📡',
      'system': '⚙️',
    }
    return icons[category] || '📝'
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get system health status color
  const getHealthStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'healthy': 'text-green-600 bg-green-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100',
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  // Load initial data
  useEffect(() => {
    fetchLogs()
    fetchStats()
    fetchFilterOptions()
    fetchFilters()
    fetchExports()
  }, [])

  return {
    // State
    logs,
    loading,
    error,
    stats,
    filterOptions,
    filters,
    exports,
    pagination,
    
    // Actions
    fetchLogs,
    fetchStats,
    fetchFilterOptions,
    fetchFilters,
    saveFilter,
    deleteFilter,
    exportLogs,
    fetchExports,
    createLog,
    
    // Utilities
    getLevelColorClass,
    getCategoryIcon,
    formatTimestamp,
    getHealthStatusColor,
    
    // Setters
    setLogs,
    setError,
  }
}
