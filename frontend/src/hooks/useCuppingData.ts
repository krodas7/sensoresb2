import { useState, useEffect } from 'react'
import api from '../services/api'

export interface CuppingRecord {
  id: number
  numero_ingreso: string
  peso_quintales: number
  rendimiento: number
  humedad: number
  apariencia_verde: string
  tueste: string
  quakers: number
  estado: string
  tipo: string
  taza: string
  fecha_catacion: string
  catador: string
  observaciones?: string
  lot_id: string
  isCommercialCupping: boolean
  timestamp: string
  status: string
}

export interface CuppingSummary {
  total_cuppings: number
  approved_cuppings: number
  rejected_cuppings: number
  pending_cuppings: number
  total_weight: number
  average_rendimiento: number
  average_humedad: number
  top_catador: string
  most_common_tipo: string
}

export const useCuppingData = () => {
  const [cuppingRecords, setCuppingRecords] = useState<CuppingRecord[]>([])
  const [summary, setSummary] = useState<CuppingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch cupping records for report generation
  const fetchCuppingData = async (startDate?: string, endDate?: string, tipo?: string, catador?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to fetch from localStorage first (since cupping data is stored locally)
      const storedLots = localStorage.getItem('cattedLots')
      if (storedLots) {
        const allCuppings = JSON.parse(storedLots)
        
        // Filter by date range if provided
        let filteredCuppings = allCuppings
        if (startDate || endDate) {
          filteredCuppings = allCuppings.filter((cupping: CuppingRecord) => {
            const cuppingDate = new Date(cupping.fecha_catacion || cupping.timestamp)
            if (startDate && cuppingDate < new Date(startDate)) return false
            if (endDate && cuppingDate > new Date(endDate)) return false
            return true
          })
        }
        
        // Filter by tipo if provided
        if (tipo) {
          filteredCuppings = filteredCuppings.filter((cupping: CuppingRecord) => cupping.tipo === tipo)
        }
        
        // Filter by catador if provided
        if (catador) {
          filteredCuppings = filteredCuppings.filter((cupping: CuppingRecord) => cupping.catador === catador)
        }
        
        setCuppingRecords(filteredCuppings)
        
        // Calculate summary
        const summaryData = calculateCuppingSummary(filteredCuppings)
        setSummary(summaryData)
      } else {
        // Fallback to mock data
        const mockData = generateMockCuppingData(startDate, endDate)
        setCuppingRecords(mockData)
        setSummary(calculateCuppingSummary(mockData))
      }
      
    } catch (err: any) {
      console.error('Error fetching cupping data:', err)
      setError(err.response?.data?.message || 'Error cargando datos de catación')
      
      // Fallback to mock data
      const mockData = generateMockCuppingData(startDate, endDate)
      setCuppingRecords(mockData)
      setSummary(calculateCuppingSummary(mockData))
    } finally {
      setLoading(false)
    }
  }

  // Calculate cupping summary
  const calculateCuppingSummary = (records: CuppingRecord[]): CuppingSummary => {
    const totalCuppings = records.length
    const approvedCuppings = records.filter(r => r.estado === 'Aprobado').length
    const rejectedCuppings = records.filter(r => r.estado === 'Rechazado').length
    const pendingCuppings = records.filter(r => r.estado === 'Pendiente').length
    const totalWeight = records.reduce((sum, r) => sum + (r.peso_quintales || 0), 0)
    
    const averageRendimiento = records.length > 0 
      ? records.reduce((sum, r) => sum + (r.rendimiento || 0), 0) / records.length 
      : 0
    
    const averageHumedad = records.length > 0 
      ? records.reduce((sum, r) => sum + (r.humedad || 0), 0) / records.length 
      : 0
    
    // Find top catador
    const catadorCounts = records.reduce((acc, r) => {
      acc[r.catador] = (acc[r.catador] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topCatador = Object.entries(catadorCounts).reduce((a, b) => 
      catadorCounts[a[0]] > catadorCounts[b[0]] ? a : b, ['N/A', 0])[0]
    
    // Find most common tipo
    const tipoCounts = records.reduce((acc, r) => {
      acc[r.tipo] = (acc[r.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostCommonTipo = Object.entries(tipoCounts).reduce((a, b) => 
      tipoCounts[a[0]] > tipoCounts[b[0]] ? a : b, ['N/A', 0])[0]
    
    return {
      total_cuppings: totalCuppings,
      approved_cuppings: approvedCuppings,
      rejected_cuppings: rejectedCuppings,
      pending_cuppings: pendingCuppings,
      total_weight: totalWeight,
      average_rendimiento: Math.round(averageRendimiento * 100) / 100,
      average_humedad: Math.round(averageHumedad * 100) / 100,
      top_catador: topCatador,
      most_common_tipo: mostCommonTipo
    }
  }

  // Generate mock data for development
  const generateMockCuppingData = (startDate?: string, endDate?: string): CuppingRecord[] => {
    const mockCatadores = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Rodríguez']
    const mockTipos = ['Comercial', 'Especial', 'Premium']
    const mockEstados = ['Aprobado', 'Rechazado', 'Pendiente']
    const mockApariencia = ['Excelente', 'Buena', 'Regular', 'Mala']
    const mockTueste = ['Claro', 'Medio', 'Oscuro']
    const mockTaza = ['Excelente', 'Buena', 'Regular', 'Defectuosa']

    const records: CuppingRecord[] = []
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate ? new Date(endDate) : new Date()
    
    // Generate 20 mock records
    for (let i = 0; i < 20; i++) {
      const recordDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
      
      records.push({
        id: i + 1,
        numero_ingreso: `LOTE-${String(i + 1).padStart(4, '0')}`,
        peso_quintales: Math.round((Math.random() * 50 + 10) * 100) / 100, // 10-60 quintales
        rendimiento: Math.round((Math.random() * 20 + 75) * 100) / 100, // 75-95%
        humedad: Math.round((Math.random() * 5 + 10) * 100) / 100, // 10-15%
        apariencia_verde: mockApariencia[Math.floor(Math.random() * mockApariencia.length)],
        tueste: mockTueste[Math.floor(Math.random() * mockTueste.length)],
        quakers: Math.floor(Math.random() * 5), // 0-4 quakers
        estado: mockEstados[Math.floor(Math.random() * mockEstados.length)],
        tipo: mockTipos[Math.floor(Math.random() * mockTipos.length)],
        taza: mockTaza[Math.floor(Math.random() * mockTaza.length)],
        fecha_catacion: recordDate.toISOString().split('T')[0],
        catador: mockCatadores[Math.floor(Math.random() * mockCatadores.length)],
        observaciones: `Observaciones del lote ${i + 1}`,
        lot_id: `LOT-${i + 1}`,
        isCommercialCupping: true,
        timestamp: recordDate.toISOString(),
        status: 'completed'
      })
    }
    
    return records
  }

  // Get cupping data by tipo
  const getCuppingByTipo = async (tipo: string, startDate?: string, endDate?: string) => {
    return await fetchCuppingData(startDate, endDate, tipo)
  }

  // Get cupping data by catador
  const getCuppingByCatador = async (catador: string, startDate?: string, endDate?: string) => {
    return await fetchCuppingData(startDate, endDate, undefined, catador)
  }

  // Get approved cuppings only
  const getApprovedCuppings = async (startDate?: string, endDate?: string) => {
    const data = await fetchCuppingData(startDate, endDate)
    const approved = data.filter((record: CuppingRecord) => record.estado === 'Aprobado')
    setCuppingRecords(approved)
    return approved
  }

  return {
    cuppingRecords,
    summary,
    loading,
    error,
    fetchCuppingData,
    getCuppingByTipo,
    getCuppingByCatador,
    getApprovedCuppings
  }
}

export default useCuppingData
