import { useState, useEffect } from 'react'
import api from '../services/api'

export interface ShippingWeight {
  id: number
  integration: {
    id: number
    name: string
    destination: string
    client: string
    date: string
    totalWeight: number
  }
  partidas: Array<{
    id: string
    numeroIngreso: string
    pesoEsperado: number
    tipo: string
    pesajes: Array<{
      id: number
      taraType: 'yute' | 'nylon'
      grossWeight: number
      netWeight: number
      date: string
      operator: string
    }>
  }>
  summary: {
    expectedWeight: number
    actualWeight: number
    difference: number
    percentageDiff: number
  }
  createdAt: string
}

export interface Integration {
  id: number
  name: string
  destination: string
  client: string
  date: string
  totalWeight: number
  status: 'draft' | 'completed' | 'shipped'
  lots: Array<{
    id: string
    numero_ingreso: string
    peso_quintales: number
    tipo: string
    estado: string
  }>
  createdAt: string
}

export interface ShippingSummary {
  total_shipments: number
  total_weight_sent: number
  total_integrations: number
  completed_integrations: number
  pending_integrations: number
  average_accuracy: number
  top_destination: string
  top_client: string
  most_used_tara_type: string
}

export const useShippingData = () => {
  const [shippingWeights, setShippingWeights] = useState<ShippingWeight[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [summary, setSummary] = useState<ShippingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch shipping weights data
  const fetchShippingWeights = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch from localStorage
      const storedReports = localStorage.getItem('weighingReports')
      const storedShipments = localStorage.getItem('shipmentHistory')
      
      let weightsData: ShippingWeight[] = []
      let integrationsData: Integration[] = []
      
      if (storedReports) {
        const reports = JSON.parse(storedReports)
        weightsData = reports.map((report: any) => ({
          id: report.id,
          integration: report.integration,
          partidas: report.partidas || [],
          summary: report.summary || {
            expectedWeight: 0,
            actualWeight: 0,
            difference: 0,
            percentageDiff: 0
          },
          createdAt: report.createdAt
        }))
      }
      
      if (storedShipments) {
        const shipments = JSON.parse(storedShipments)
        integrationsData = shipments.map((shipment: any) => ({
          id: shipment.id,
          name: shipment.integrationName,
          destination: shipment.destination,
          client: shipment.client,
          date: shipment.integrationDate,
          totalWeight: shipment.expectedWeight,
          status: 'completed' as const,
          lots: shipment.lots || [],
          createdAt: shipment.completedAt
        }))
      }
      
      // Filter by date range if provided
      if (startDate || endDate) {
        weightsData = weightsData.filter((weight: ShippingWeight) => {
          const weightDate = new Date(weight.createdAt)
          if (startDate && weightDate < new Date(startDate)) return false
          if (endDate && weightDate > new Date(endDate)) return false
          return true
        })
        
        integrationsData = integrationsData.filter((integration: Integration) => {
          const integrationDate = new Date(integration.createdAt)
          if (startDate && integrationDate < new Date(startDate)) return false
          if (endDate && integrationDate > new Date(endDate)) return false
          return true
        })
      }
      
      setShippingWeights(weightsData)
      setIntegrations(integrationsData)
      
      // Calculate summary
      const summaryData = calculateShippingSummary(weightsData, integrationsData)
      setSummary(summaryData)
      
    } catch (err: any) {
      console.error('Error fetching shipping data:', err)
      setError(err.response?.data?.message || 'Error cargando datos de envíos')
      
      // Fallback to mock data
      const mockData = generateMockShippingData(startDate, endDate)
      setShippingWeights(mockData.weights)
      setIntegrations(mockData.integrations)
      setSummary(calculateShippingSummary(mockData.weights, mockData.integrations))
    } finally {
      setLoading(false)
    }
  }

  // Calculate shipping summary
  const calculateShippingSummary = (weights: ShippingWeight[], integrations: Integration[]): ShippingSummary => {
    const totalShipments = weights.length
    const totalWeightSent = weights.reduce((sum, w) => sum + w.summary.actualWeight, 0)
    const totalIntegrations = integrations.length
    const completedIntegrations = integrations.filter(i => i.status === 'completed').length
    const pendingIntegrations = integrations.filter(i => i.status === 'draft').length
    
    const averageAccuracy = weights.length > 0 
      ? weights.reduce((sum, w) => sum + Math.abs(w.summary.percentageDiff), 0) / weights.length 
      : 0
    
    // Find top destination
    const destinationCounts = integrations.reduce((acc, i) => {
      acc[i.destination] = (acc[i.destination] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topDestination = Object.entries(destinationCounts).reduce((a, b) => 
      destinationCounts[a[0]] > destinationCounts[b[0]] ? a : b, ['N/A', 0])[0]
    
    // Find top client
    const clientCounts = integrations.reduce((acc, i) => {
      acc[i.client] = (acc[i.client] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topClient = Object.entries(clientCounts).reduce((a, b) => 
      clientCounts[a[0]] > clientCounts[b[0]] ? a : b, ['N/A', 0])[0]
    
    // Calculate most used tara type
    const taraCounts = weights.reduce((acc, w) => {
      w.partidas.forEach(partida => {
        partida.pesajes.forEach(pesaje => {
          acc[pesaje.taraType] = (acc[pesaje.taraType] || 0) + 1
        })
      })
      return acc
    }, {} as Record<string, number>)
    
    const mostUsedTaraType = Object.entries(taraCounts).reduce((a, b) => 
      taraCounts[a[0]] > taraCounts[b[0]] ? a : b, ['yute', 0])[0]
    
    return {
      total_shipments: totalShipments,
      total_weight_sent: totalWeightSent,
      total_integrations: totalIntegrations,
      completed_integrations: completedIntegrations,
      pending_integrations: pendingIntegrations,
      average_accuracy: Math.round(averageAccuracy * 100) / 100,
      top_destination: topDestination,
      top_client: topClient,
      most_used_tara_type: mostUsedTaraType
    }
  }

  // Generate mock data for development
  const generateMockShippingData = (startDate?: string, endDate?: string) => {
    const mockDestinations = ['Estados Unidos', 'Canadá', 'Europa', 'Japón', 'Australia']
    const mockClients = ['Starbucks', 'Blue Bottle', 'Intelligentsia', 'Counter Culture', 'Ritual Coffee']
    const mockTaraTypes = ['yute', 'nylon'] as const
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    const weights: ShippingWeight[] = []
    const integrations: Integration[] = []
    
    // Generate 10 mock shipping weights
    for (let i = 0; i < 10; i++) {
      const createdAt = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
      const destination = mockDestinations[Math.floor(Math.random() * mockDestinations.length)]
      const client = mockClients[Math.floor(Math.random() * mockClients.length)]
      const expectedWeight = Math.round((Math.random() * 100 + 50) * 100) / 100
      const actualWeight = expectedWeight + (Math.random() - 0.5) * 2 // ±1 quintal variation
      
      const integration = {
        id: i + 1,
        name: `INT-${String(i + 1).padStart(4, '0')}`,
        destination,
        client,
        date: createdAt.toISOString().split('T')[0],
        totalWeight: expectedWeight,
        status: 'completed' as const,
        lots: [
          {
            id: `LOT-${i + 1}`,
            numero_ingreso: `LOTE-${String(i + 1).padStart(4, '0')}`,
            peso_quintales: expectedWeight / 2,
            tipo: 'Comercial',
            estado: 'Aprobado'
          },
          {
            id: `LOT-${i + 2}`,
            numero_ingreso: `LOTE-${String(i + 2).padStart(4, '0')}`,
            peso_quintales: expectedWeight / 2,
            tipo: 'Comercial',
            estado: 'Aprobado'
          }
        ],
        createdAt: createdAt.toISOString()
      }
      
      integrations.push(integration)
      
      // Generate mock pesajes
      const pesajes = []
      for (let j = 0; j < 3; j++) {
        const taraType = mockTaraTypes[Math.floor(Math.random() * mockTaraTypes.length)]
        const grossWeight = Math.round((Math.random() * 50 + 20) * 100) / 100
        const taraWeight = taraType === 'yute' ? 1.5 : 1.0
        const netWeight = grossWeight - taraWeight
        
        pesajes.push({
          id: j + 1,
          taraType,
          grossWeight,
          netWeight,
          date: createdAt.toISOString().split('T')[0],
          operator: 'Operador Sistema'
        })
      }
      
      weights.push({
        id: i + 1,
        integration,
        partidas: [
          {
            id: `partida-${i + 1}`,
            numeroIngreso: `LOTE-${String(i + 1).padStart(4, '0')}`,
            pesoEsperado: expectedWeight / 2,
            tipo: 'Comercial',
            pesajes: pesajes.slice(0, 2)
          }
        ],
        summary: {
          expectedWeight,
          actualWeight,
          difference: actualWeight - expectedWeight,
          percentageDiff: ((actualWeight - expectedWeight) / expectedWeight) * 100
        },
        createdAt: createdAt.toISOString()
      })
    }
    
    return { weights, integrations }
  }

  // Get shipping data by destination
  const getShippingByDestination = async (destination: string, startDate?: string, endDate?: string) => {
    await fetchShippingWeights(startDate, endDate)
    const filtered = shippingWeights.filter(w => w.integration.destination === destination)
    setShippingWeights(filtered)
    return filtered
  }

  // Get shipping data by client
  const getShippingByClient = async (client: string, startDate?: string, endDate?: string) => {
    await fetchShippingWeights(startDate, endDate)
    const filtered = shippingWeights.filter(w => w.integration.client === client)
    setShippingWeights(filtered)
    return filtered
  }

  // Get pending integrations
  const getPendingIntegrations = async () => {
    const storedIntegrations = localStorage.getItem('lotIntegrations')
    if (storedIntegrations) {
      const integrations = JSON.parse(storedIntegrations)
      const pending = integrations.filter((i: any) => i.status === 'draft' || !i.used)
      setIntegrations(pending)
      return pending
    }
    return []
  }

  return {
    shippingWeights,
    integrations,
    summary,
    loading,
    error,
    fetchShippingWeights,
    getShippingByDestination,
    getShippingByClient,
    getPendingIntegrations
  }
}

export default useShippingData
