import React, { useState, useEffect } from 'react'
import { 
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  ScaleIcon,
  TruckIcon,
  ChartBarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useReports, ReportGenerationRequest } from '../hooks/useReports'
import { useAttendanceData } from '../hooks/useAttendanceData'
import { useCuppingData } from '../hooks/useCuppingData'
import { useShippingData } from '../hooks/useShippingData'
import { toast } from 'react-hot-toast'

export default function Reports() {
  const { reports, stats, loading, error, generateReport, downloadReport, deleteReport, getReportPreviewData } = useReports()
  const { fetchAttendanceData } = useAttendanceData()
  const { fetchCuppingData } = useCuppingData()
  const { fetchShippingWeights } = useShippingData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'generate'>('list')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [generateForm, setGenerateForm] = useState<ReportGenerationRequest>({
    report_type: 'attendance',
    format: 'pdf',
    parameters: {
      start_date: '',
      end_date: ''
    },
    filters: {}
  })
  const [generating, setGenerating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'generating': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado'
      case 'generating': return 'Generando'
      case 'failed': return 'Error'
      case 'pending': return 'Pendiente'
      default: return 'Desconocido'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'generating': return <ClockIcon className="h-4 w-4" />
      case 'failed': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'pending': return <ClockIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <UserGroupIcon className="h-5 w-5" />
      case 'cupping': return <DocumentTextIcon className="h-5 w-5" />
      case 'shipping_weights': return <ScaleIcon className="h-5 w-5" />
      case 'integrations': return <TruckIcon className="h-5 w-5" />
      case 'temperature': return <ChartBarIcon className="h-5 w-5" />
      case 'occupation': return <UserGroupIcon className="h-5 w-5" />
      default: return <DocumentTextIcon className="h-5 w-5" />
    }
  }

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'attendance': return 'Asistencias'
      case 'cupping': return 'Cataciones'
      case 'shipping_weights': return 'Pesos de Envío'
      case 'integrations': return 'Integraciones'
      case 'temperature': return 'Temperaturas'
      case 'occupation': return 'Ocupación'
      default: return type
    }
  }

  const handleGenerateReport = async () => {
    // Validate form first
    if (!generateForm.parameters.start_date || !generateForm.parameters.end_date) {
      toast.error('Por favor selecciona las fechas de inicio y fin')
      return
    }
    
    if (new Date(generateForm.parameters.start_date) > new Date(generateForm.parameters.end_date)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }
    
    try {
      setGenerating(true)
      
      await generateReport(generateForm)
      toast.success('Reporte generado exitosamente')
      setShowGenerateModal(false)
      setActiveTab('list')
      
      // Reset form
      setGenerateForm({
        report_type: 'attendance',
        format: 'pdf',
        parameters: {
          start_date: '',
          end_date: ''
        },
        filters: {}
      })
      
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Error generando el reporte')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = async (reportId: number) => {
    try {
      await downloadReport(reportId)
      toast.success('Reporte descargado exitosamente')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Error descargando el reporte')
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      try {
        await deleteReport(reportId)
        toast.success('Reporte eliminado exitosamente')
      } catch (error) {
        console.error('Error deleting report:', error)
        toast.error('Error eliminando el reporte')
      }
    }
  }

  const handleViewReport = (report: any) => {
    setSelectedReport(getReportPreviewData(report))
    setShowPreviewModal(true)
  }

  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.created_by.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && reports.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Reportes y Análisis</h1>
        <p className="text-gray-600">Generación de reportes del sistema de beneficio</p>
        </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
              <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Reportes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_reports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
              <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completados</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed_reports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ArrowDownTrayIcon className="h-6 w-6 text-yellow-600" />
        </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Descargas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_downloads}</p>
            </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
        </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tasa de Éxito</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.success_rate}%</p>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="bg-white rounded-lg shadow-md mb-6">
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Lista de Reportes
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Generar Reporte
            </button>
        </nav>
        </div>
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'list' && (
        <>
          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                    placeholder="Buscar reportes por nombre, tipo o creador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              </div>
              <button 
                onClick={() => setShowGenerateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Nuevo Reporte
              </button>
            </div>
          </div>

          {/* Lista de reportes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {getReportTypeIcon(report.report_type)}
                    <div className="ml-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                        {report.isNew && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Nuevo
                        </span>
                      )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{getStatusText(report.status)}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar reporte"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{getReportTypeName(report.report_type)}</span>
              </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Formato:</span>
                    <span className="font-medium uppercase">{report.format}</span>
          </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Creado por:</span>
                    <span className="font-medium">{report.created_by}</span>
              </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{new Date(report.created_at).toLocaleDateString()}</span>
          </div>

                  {report.generated_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Generado:</span>
                      <span className="font-medium">{new Date(report.generated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Descargas:</span>
                    <span className="font-medium">{report.download_count}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  {report.status === 'completed' && (
                    <>
                    <button
                        onClick={() => handleViewReport(report)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                    </button>
                    <button
                        onClick={() => handleDownloadReport(report.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Descargar
                    </button>
                    </>
                  )}
                  {report.status === 'failed' && (
                    <button
                      onClick={() => {
                        // Regenerate report logic
                        toast.info('Funcionalidad de regeneración en desarrollo')
                      }}
                      className="w-full bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 flex items-center justify-center gap-1"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Regenerar
                    </button>
                  )}
                  {report.status === 'generating' && (
                    <div className="w-full bg-gray-100 text-gray-600 px-3 py-2 rounded text-sm flex items-center justify-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Generando...
                </div>
                )}
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reportes generados</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza generando un nuevo reporte.</p>
              <div className="mt-4">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="h-5 w-5" />
                  Generar Primer Reporte
                </button>
              </div>
                </div>
          )}
        </>
      )}

      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generar Nuevo Reporte</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulario de generación */}
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Reporte
                </label>
                <select
                  value={generateForm.report_type}
                  onChange={(e) => setGenerateForm({
                    ...generateForm,
                    report_type: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="attendance">Asistencias</option>
                  <option value="cupping">Cataciones</option>
                  <option value="shipping_weights">Pesos de Envío</option>
                  <option value="integrations">Integraciones</option>
                  <option value="temperature">Temperaturas</option>
                  <option value="occupation">Ocupación</option>
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato
                </label>
                  <select
                  value={generateForm.format}
                  onChange={(e) => setGenerateForm({
                    ...generateForm,
                    format: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                  <input
                  type="date"
                  value={generateForm.parameters.start_date}
                  onChange={(e) => setGenerateForm({
                    ...generateForm,
                    parameters: {
                      ...generateForm.parameters,
                      start_date: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                  <input
                  type="date"
                  value={generateForm.parameters.end_date}
                  onChange={(e) => setGenerateForm({
                    ...generateForm,
                    parameters: {
                      ...generateForm.parameters,
                      end_date: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                  <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    Generar Reporte
                  </>
                )}
                  </button>
                </div>

            {/* Información del tipo de reporte */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {getReportTypeName(generateForm.report_type)}
              </h3>
              <div className="flex items-center mb-3">
                {getReportTypeIcon(generateForm.report_type)}
                <span className="ml-2 text-sm text-gray-600">
                  Información sobre este tipo de reporte
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                {generateForm.report_type === 'attendance' && (
                  <p>Reporte de asistencias que incluye registros de entrada y salida, horas trabajadas, tardanzas y ausencias por empleado.</p>
                )}
                {generateForm.report_type === 'cupping' && (
                  <p>Reporte de cataciones que incluye resultados de evaluación de café, características organolépticas y clasificación por calidad.</p>
                )}
                {generateForm.report_type === 'shipping_weights' && (
                  <p>Reporte de pesos de envío que incluye pesajes realizados, comparaciones con pesos esperados y precisión de mediciones.</p>
                )}
                {generateForm.report_type === 'integrations' && (
                  <p>Reporte de integraciones que incluye lotes combinados, destinos, clientes y estados de envío.</p>
                )}
                {generateForm.report_type === 'temperature' && (
                  <p>Reporte de temperaturas que incluye lecturas de sensores, promedios, máximos y mínimos por área.</p>
                )}
                {generateForm.report_type === 'occupation' && (
                  <p>Reporte de ocupación que incluye estados de áreas, tiempos de uso y disponibilidad.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de generación rápida */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Generar Reporte Rápido</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Reporte
                  </label>
                  <select
                    value={generateForm.report_type}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      report_type: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="attendance">Asistencias</option>
                    <option value="cupping">Cataciones</option>
                    <option value="shipping_weights">Pesos de Envío</option>
                    <option value="integrations">Integraciones</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={generateForm.parameters.start_date}
                      onChange={(e) => setGenerateForm({
                        ...generateForm,
                        parameters: {
                          ...generateForm.parameters,
                          start_date: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                          </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={generateForm.parameters.end_date}
                      onChange={(e) => setGenerateForm({
                        ...generateForm,
                        parameters: {
                          ...generateForm.parameters,
                          end_date: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        Generar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Previsualización de Reporte */}
      {showPreviewModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Previsualización del Reporte</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                {/* Header del reporte */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-green-600 mb-2">Sistema de Beneficio de Café</h1>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedReport.name}</h2>
                </div>
                
                {/* Información del reporte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">{selectedReport.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Formato:</span>
                        <span className="font-medium">{selectedReport.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                          {getStatusText(selectedReport.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Detalles</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Creado por:</span>
                        <span className="font-medium">{selectedReport.createdBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha creación:</span>
                        <span className="font-medium">{selectedReport.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha generación:</span>
                        <span className="font-medium">{selectedReport.generatedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Descargas:</span>
                        <span className="font-medium">{selectedReport.downloadCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Período del reporte */}
                <div className="bg-white p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Período del Reporte</h3>
                  <p className="text-sm text-gray-600">{selectedReport.period}</p>
                </div>
                
                {/* Contenido del reporte */}
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Resumen del Contenido</h3>
                  <div className="text-sm text-gray-600">
                    <p>Este reporte contiene información detallada sobre {selectedReport.type.toLowerCase()} para el período especificado.</p>
                    <p className="mt-2">El contenido incluye tablas, gráficos y métricas relevantes para el análisis del sistema de beneficio.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Find the original report to download
                    const originalReport = reports.find(r => r.name === selectedReport.name)
                    if (originalReport) {
                      handleDownloadReport(originalReport.id)
                    }
                    setShowPreviewModal(false)
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
