import React, { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { useLogs, LogSearchParams, LogFilter } from '../hooks/useLogs'
import toast from 'react-hot-toast'

const Logs: React.FC = () => {
  const {
    logs,
    loading,
    error,
    stats,
    filterOptions,
    filters,
    pagination,
    fetchLogs,
    saveFilter,
    deleteFilter,
    exportLogs,
    createLog,
    getLevelColorClass,
    getCategoryIcon,
    formatTimestamp,
    getHealthStatusColor,
  } = useLogs()

  // State for search and filters
  const [searchParams, setSearchParams] = useState<LogSearchParams>({
    query: '',
    page: 1,
    page_size: 50
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showLogDetail, setShowLogDetail] = useState(false)

  // Handle search
  const handleSearch = () => {
    fetchLogs({ ...searchParams, page: 1 })
  }

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchParams({
      query: '',
      page: 1,
      page_size: 50
    })
    fetchLogs({ page: 1, page_size: 50 })
  }

  // Apply saved filter
  const applyFilter = (filter: LogFilter) => {
    setSearchParams(prev => ({
      ...prev,
      ...filter.filters,
      page: 1
    }))
    fetchLogs({ ...filter.filters, page: 1 })
  }

  // Save current filter
  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error('Por favor ingresa un nombre para el filtro')
      return
    }

    try {
      await saveFilter({
        name: filterName,
        filters: searchParams,
        is_default: false
      })
      setFilterName('')
      setShowSaveFilterModal(false)
    } catch (error) {
      // Error handled in hook
    }
  }

  // Export logs
  const handleExport = async () => {
    try {
      await exportLogs({
        ...searchParams,
        format: 'csv'
      })
    } catch (error) {
      // Error handled in hook
    }
  }

  // View log detail
  const viewLogDetail = (log: any) => {
    setSelectedLog(log)
    setShowLogDetail(true)
  }

  // Create test log
  const createTestLog = async () => {
    try {
      await createLog({
        level: 'info',
        category: 'system',
        action: 'test',
        message: 'Log de prueba creado desde el frontend',
        description: 'Este es un log de prueba para verificar el funcionamiento del sistema',
        module: 'Logs',
        object_type: 'Test',
        object_id: 'test-123'
      })
      toast.success('Log de prueba creado')
      fetchLogs(searchParams) // Refresh logs
    } catch (error) {
      // Error handled in hook
    }
  }

  // Load logs when search params change
  useEffect(() => {
    fetchLogs(searchParams)
  }, [searchParams.page, searchParams.page_size])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Logs</h1>
          <p className="text-gray-600 mt-1">Monitoreo y análisis de actividades del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Estadísticas
          </button>
          <button
            onClick={createTestLog}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Log Test
          </button>
        </div>
      </div>

      {/* System Health Status */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(stats.system_health.health_status)}`}>
                {stats.system_health.health_status === 'healthy' ? 'Saludable' : 
                 stats.system_health.health_status === 'warning' ? 'Advertencia' : 'Crítico'}
              </div>
              <p className="text-sm text-gray-600 mt-1">Estado General</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.system_health.errors_24h}</div>
              <p className="text-sm text-gray-600">Errores (24h)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.system_health.warnings_24h}</div>
              <p className="text-sm text-gray-600">Advertencias (24h)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.system_health.last_24h_logs}</div>
              <p className="text-sm text-gray-600">Logs (24h)</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Búsqueda y Filtros</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchParams.query || ''}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buscar
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={searchParams.level || ''}
                onChange={(e) => handleFilterChange('level', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {filterOptions?.levels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={searchParams.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {filterOptions?.categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <select
                value={searchParams.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {filterOptions?.actions.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
              <select
                value={searchParams.module || ''}
                onChange={(e) => handleFilterChange('module', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {filterOptions?.modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <select
                value={searchParams.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {filterOptions?.users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => setShowSaveFilterModal(true)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <BookmarkIcon className="h-4 w-4 mr-1" />
              Guardar Filtro
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {pagination.total} logs encontrados
          </div>
        </div>
      </div>

      {/* Saved Filters */}
      {filters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Guardados</h3>
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => applyFilter(filter)}
                className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registro de Actividades</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No se encontraron logs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user.display_name || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColorClass(log.level.value)}`}>
                        {log.level.display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{getCategoryIcon(log.category.value)}</span>
                        {log.category.display}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action.display}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewLogDetail(log)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.page_size) + 1} a{' '}
              {Math.min(pagination.page * pagination.page_size, pagination.total)} de{' '}
              {pagination.total} resultados
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Página {pagination.page} de {pagination.total_pages}
              </span>
              <button
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardar Filtro</h3>
              <input
                type="text"
                placeholder="Nombre del filtro"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveFilterModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles del Log</h3>
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    <p className="text-sm text-gray-900">{selectedLog.user.display_name || 'Sistema'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColorClass(selectedLog.level.value)}`}>
                      {selectedLog.level.display}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <p className="text-sm text-gray-900">{getCategoryIcon(selectedLog.category.value)} {selectedLog.category.display}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                    <p className="text-sm text-gray-900">{selectedLog.action.display}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
                    <p className="text-sm text-gray-900">{selectedLog.module}</p>
                  </div>
                  {selectedLog.object_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Objeto</label>
                      <p className="text-sm text-gray-900">{selectedLog.object_type}</p>
                    </div>
                  )}
                  {selectedLog.object_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID del Objeto</label>
                      <p className="text-sm text-gray-900">{selectedLog.object_id}</p>
                    </div>
                  )}
                  {selectedLog.ip_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IP</label>
                      <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border">{selectedLog.message}</p>
                </div>
                
                {selectedLog.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border">{selectedLog.description}</p>
                  </div>
                )}
                
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metadatos</label>
                    <pre className="text-sm text-gray-900 bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowLogDetail(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logs
