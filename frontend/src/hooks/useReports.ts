import { useState, useEffect } from 'react'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface Report {
  id: number
  name: string
  report_type: string
  format: string
  status: 'generating' | 'completed' | 'failed' | 'pending'
  created_at: string
  generated_at?: string
  created_by: string
  file_url?: string
  download_count: number
  parameters: any
  filters: any
  start_date?: string
  end_date?: string
  isNew?: boolean
}

export interface ReportGenerationRequest {
  report_type: 'attendance' | 'cupping' | 'shipping_weights' | 'integrations' | 'temperature' | 'occupation'
  format: 'pdf' | 'excel' | 'csv'
  parameters: {
    start_date?: string
    end_date?: string
    employee_id?: number
    lot_id?: number
    integration_id?: number
    [key: string]: any
  }
  filters: {
    status?: string
    department?: string
    area?: string
    [key: string]: any
  }
}

export interface ReportStats {
  total_reports: number
  completed_reports: number
  failed_reports: number
  total_downloads: number
  most_popular_type: string
  avg_generation_time: number
  success_rate: number
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use mock data for development to avoid authentication issues
      const mockReports = [
        {
          id: 1,
          name: 'Reporte de Asistencias - 2025-01-24',
          report_type: 'attendance',
          format: 'pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          created_by: 'Sistema',
          file_url: '/reports/attendance-2025-01-24.pdf',
          download_count: 5,
          parameters: { start_date: '2025-01-24', end_date: '2025-01-24' },
          filters: {}
        },
        {
          id: 2,
          name: 'Reporte de Cataciones - Enero 2025',
          report_type: 'cupping',
          format: 'pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          created_by: 'Sistema',
          file_url: '/reports/cupping-2025-01.pdf',
          download_count: 3,
          parameters: { start_date: '2025-01-01', end_date: '2025-01-31' },
          filters: { tipo: 'comercial' }
        },
        {
          id: 3,
          name: 'Reporte de Pesos de Envío - Enero 2025',
          report_type: 'shipping_weights',
          format: 'pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          created_by: 'Sistema',
          file_url: '/reports/shipping-weights-2025-01.pdf',
          download_count: 8,
          parameters: { start_date: '2025-01-01', end_date: '2025-01-31' },
          filters: {}
        },
        {
          id: 4,
          name: 'Reporte de Integraciones - Enero 2025',
          report_type: 'integrations',
          format: 'pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          created_by: 'Sistema',
          file_url: '/reports/integrations-2025-01.pdf',
          download_count: 4,
          parameters: { start_date: '2025-01-01', end_date: '2025-01-31' },
          filters: {}
        },
        {
          id: 5,
          name: 'Reporte de Temperaturas - Enero 2025',
          report_type: 'temperature',
          format: 'pdf',
          status: 'generating',
          created_at: new Date().toISOString(),
          created_by: 'Sistema',
          download_count: 0,
          parameters: { start_date: '2025-01-01', end_date: '2025-01-31' },
          filters: {}
        }
      ]
      
      setReports(mockReports)
      
      // Uncomment below when backend is ready
      // const response = await api.get('/reports/')
      // setReports(response.data.results || response.data)
      
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      setError(err.response?.data?.message || 'Error cargando reportes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch report statistics
  const fetchStats = async () => {
    try {
      // Use mock stats for development to avoid authentication issues
      const mockStats = {
        total_reports: 15,
        completed_reports: 12,
        failed_reports: 2,
        total_downloads: 45,
        most_popular_type: 'attendance',
        avg_generation_time: 2.5,
        success_rate: 85.7
      }
      setStats(mockStats)
      
      // Uncomment below when backend is ready
      // const response = await api.get('/reports/stats/')
      // setStats(response.data)
      
    } catch (err: any) {
      console.error('Error fetching report stats:', err)
    }
  }

  // Generate new report
  const generateReport = async (request: ReportGenerationRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate report generation for development
      const newReport = {
        id: Date.now(),
        name: `Reporte de ${getReportTypeName(request.report_type)} - ${new Date().toLocaleDateString()}`,
        report_type: request.report_type,
        format: request.format,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
        created_by: 'Usuario Actual',
        file_url: `/reports/${request.report_type}-${Date.now()}.pdf`,
        download_count: 0,
        parameters: request.parameters,
        filters: request.filters,
        isNew: true
      }
      
      // Add to reports list
      setReports(prev => [newReport, ...prev])
      
      // Uncomment below when backend is ready
      // const response = await api.post('/reports/generate/', request)
      // await fetchReports()
      // return response.data
      
      return { success: true, report_id: newReport.id, message: 'Reporte generado exitosamente' }
      
    } catch (err: any) {
      console.error('Error generating report:', err)
      setError(err.response?.data?.message || 'Error generando reporte')
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to get report type name
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

  // Generate PDF content based on report type
  const generatePDFContent = (report: Report) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 167, 69) // Green color
    doc.text('Sistema de Beneficio de Café', 14, 20)
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(report.name, 14, 35)
    
    // Report details
    doc.setFontSize(12)
    doc.text(`Tipo de Reporte: ${getReportTypeName(report.report_type)}`, 14, 50)
    doc.text(`Formato: ${report.format.toUpperCase()}`, 14, 60)
    doc.text(`Creado por: ${report.created_by}`, 14, 70)
    doc.text(`Fecha de Creación: ${new Date(report.created_at).toLocaleDateString()}`, 14, 80)
    doc.text(`Fecha de Generación: ${new Date(report.generated_at || report.created_at).toLocaleDateString()}`, 14, 90)
    
    if (report.parameters.start_date && report.parameters.end_date) {
      doc.text(`Período: ${new Date(report.parameters.start_date).toLocaleDateString()} - ${new Date(report.parameters.end_date).toLocaleDateString()}`, 14, 100)
    }
    
    // Add content based on report type
    doc.text('', 14, 110) // Empty line
    
    switch (report.report_type) {
      case 'attendance':
        generateAttendancePDFContent(doc, report)
        break
      case 'cupping':
        generateCuppingPDFContent(doc, report)
        break
      case 'shipping_weights':
        generateShippingPDFContent(doc, report)
        break
      case 'integrations':
        generateIntegrationsPDFContent(doc, report)
        break
      case 'temperature':
        generateTemperaturePDFContent(doc, report)
        break
      case 'occupation':
        generateOccupationPDFContent(doc, report)
        break
      default:
        doc.text('Contenido del reporte no disponible', 14, 110)
    }
    
    return doc
  }

  // Generate attendance report content
  const generateAttendancePDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Asistencias', 14, 110)
    
    const attendanceData = [
      ['Empleado', 'Entradas', 'Salidas', 'Horas Trabajadas'],
      ['Juan Pérez', '5', '5', '40'],
      ['María García', '5', '5', '40'],
      ['Carlos López', '4', '4', '32'],
      ['Ana Rodríguez', '5', '5', '40']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [attendanceData[0]],
      body: attendanceData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Generate cupping report content
  const generateCuppingPDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Cataciones', 14, 110)
    
    const cuppingData = [
      ['Lote', 'Peso (qq)', 'Rendimiento (%)', 'Humedad (%)', 'Estado'],
      ['LOTE-0001', '25.5', '85.2', '12.3', 'Aprobado'],
      ['LOTE-0002', '30.0', '82.1', '11.8', 'Aprobado'],
      ['LOTE-0003', '22.5', '78.9', '13.2', 'Rechazado'],
      ['LOTE-0004', '28.0', '87.5', '12.0', 'Aprobado']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [cuppingData[0]],
      body: cuppingData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Generate shipping report content
  const generateShippingPDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Pesos de Envío', 14, 110)
    
    const shippingData = [
      ['Integración', 'Peso Esperado (qq)', 'Peso Real (qq)', 'Diferencia (%)', 'Estado'],
      ['INT-0001', '100.0', '98.5', '-1.5%', 'Excelente'],
      ['INT-0002', '75.0', '76.2', '+1.6%', 'Bueno'],
      ['INT-0003', '50.0', '48.9', '-2.2%', 'Bueno'],
      ['INT-0004', '120.0', '122.1', '+1.8%', 'Bueno']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [shippingData[0]],
      body: shippingData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Generate integrations report content
  const generateIntegrationsPDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Integraciones', 14, 110)
    
    const integrationData = [
      ['Integración', 'Destino', 'Cliente', 'Peso Total (qq)', 'Estado'],
      ['INT-0001', 'Estados Unidos', 'Starbucks', '100.0', 'Completado'],
      ['INT-0002', 'Canadá', 'Blue Bottle', '75.0', 'Completado'],
      ['INT-0003', 'Europa', 'Intelligentsia', '50.0', 'En Progreso'],
      ['INT-0004', 'Japón', 'Counter Culture', '120.0', 'Completado']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [integrationData[0]],
      body: integrationData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Generate temperature report content
  const generateTemperaturePDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Temperaturas', 14, 110)
    
    const temperatureData = [
      ['Sensor', 'Área', 'Temp. Promedio (°C)', 'Temp. Máxima (°C)', 'Temp. Mínima (°C)'],
      ['PILA-01', 'Fermentación', '22.5', '25.0', '20.0'],
      ['PILA-02', 'Fermentación', '23.1', '26.0', '20.5'],
      ['GUARDIOLA-01', 'Secado', '45.2', '48.0', '42.0'],
      ['GUARDIOLA-02', 'Secado', '44.8', '47.5', '41.5']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [temperatureData[0]],
      body: temperatureData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Generate occupation report content
  const generateOccupationPDFContent = (doc: jsPDF, report: Report) => {
    doc.setFontSize(14)
    doc.text('Resumen de Ocupación', 14, 110)
    
    const occupationData = [
      ['Área', 'Estado', 'Tiempo de Uso (hrs)', 'Última Actualización'],
      ['Área 1', 'Ocupado', '8.5', '2025-01-24 10:30'],
      ['Área 2', 'Libre', '0', '2025-01-24 09:15'],
      ['Área 3', 'Mantenimiento', '2.0', '2025-01-24 08:00'],
      ['Área 4', 'Ocupado', '6.0', '2025-01-24 11:45']
    ]
    
    autoTable(doc, {
      startY: 120,
      head: [occupationData[0]],
      body: occupationData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 167, 69] }
    })
  }

  // Download report
  const downloadReport = async (reportId: number) => {
    try {
      const report = reports.find(r => r.id === reportId)
      if (report) {
        // Update download count
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, download_count: r.download_count + 1, isNew: false }
            : r
        ))
        
        // Generate PDF
        const pdfDoc = generatePDFContent(report)
        pdfDoc.save(`${report.name}.pdf`)
      }
      
    } catch (err: any) {
      console.error('Error downloading report:', err)
      setError(err.response?.data?.message || 'Error descargando reporte')
      throw err
    }
  }

  // Get report data for preview
  const getReportPreviewData = (report: Report) => {
    return {
      name: report.name,
      type: getReportTypeName(report.report_type),
      format: report.format.toUpperCase(),
      createdBy: report.created_by,
      createdAt: new Date(report.created_at).toLocaleDateString(),
      generatedAt: new Date(report.generated_at || report.created_at).toLocaleDateString(),
      period: report.parameters.start_date && report.parameters.end_date 
        ? `${new Date(report.parameters.start_date).toLocaleDateString()} - ${new Date(report.parameters.end_date).toLocaleDateString()}`
        : 'No especificado',
      downloadCount: report.download_count,
      status: report.status
    }
  }

  // Get report data
  const getReportData = async (reportId: number) => {
    try {
      const response = await api.get(`/reports/${reportId}/data/`)
      return response.data
    } catch (err: any) {
      console.error('Error fetching report data:', err)
      setError(err.response?.data?.message || 'Error obteniendo datos del reporte')
      throw err
    }
  }

  // Delete report
  const deleteReport = async (reportId: number) => {
    try {
      // Simulate deletion for development
      setReports(prev => prev.filter(r => r.id !== reportId))
      
      // Uncomment below when backend is ready
      // await api.delete(`/reports/${reportId}/`)
      // await fetchReports()
      
    } catch (err: any) {
      console.error('Error deleting report:', err)
      setError(err.response?.data?.message || 'Error eliminando reporte')
      throw err
    }
  }

  useEffect(() => {
    fetchReports()
    fetchStats()
  }, [])

  return {
    reports,
    stats,
    loading,
    error,
    fetchReports,
    fetchStats,
    generateReport,
    downloadReport,
    getReportData,
    deleteReport,
    getReportPreviewData
  }
}

export default useReports
