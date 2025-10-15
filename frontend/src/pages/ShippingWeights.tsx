import React, { useState, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { 
  ScaleIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CalculatorIcon,
  DocumentTextIcon,
  TruckIcon,
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  ScaleIcon as WeightIcon,
  MinusIcon,
  UserIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  XCircleIcon,
  LinkIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'

interface Pesaje {
  id: number
  taraType: 'yute' | 'nylon'
  taraWeight: number // 1.5 for yute, 1.0 for nylon
  bultosCount: number // Cantidad de bultos
  totalTaraWeight: number // taraWeight * bultosCount
  grossWeight: number
  netWeight: number
  date: string
  time: string
  operator: string
  notes: string
  createdAt: Date
}

interface Partida {
  id: number
  partidaNumber: string
  totalGrossWeight: number // Suma de todos los pesajes
  totalNetWeight: number // Suma de todos los pesajes
  totalTaraWeight: number // Suma de todas las taras
  totalBultos: number // Suma de todos los bultos
  pesajes: Pesaje[] // Múltiples pesajes por partida
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

interface Lote {
  id: number
  loteNumber: string
  totalWeight: number // Peso total del lote en quintales
  currentWeight: number // Peso actual acumulado
  partidas: Partida[]
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

interface IntegrationSummary {
  totalLotes: number
  completedLotes: number
  totalPartidas: number
  totalGrossWeight: number
  totalNetWeight: number
  totalTaraWeight: number
  yutePartidas: number
  nylonPartidas: number
}

// Nueva interfaz para partidas de pesaje
interface PartidaPesaje {
  id: string
  numeroIngreso: string
  pesoEsperado: number // en quintales
  tipo: string
  pesajes: Pesaje[]
  pesoTotalRegistrado: number // suma de todos los pesajes netos
  isCompleted: boolean
}

// Interfaces para el sistema de pesaje mejorado
interface PesajeWeighing {
  id: string
  ingresoId: string
  pesoBruto: number
  tara: number
  pesoNeto: number
  fecha: string
  hora: string
  operador: string
  observaciones?: string
}

interface IntegrationWeighing {
  id: number
  name: string
  destination: string
  client: string
  date: string
  status: 'draft' | 'completed' | 'weighing' | 'shipped'
  totalWeight: number // en quintales
  lots: IntegrationLot[]
  createdAt: string
  pesajes: PesajeWeighing[]
  currentIngresoId?: string
  pesoRegistrado: number // en lbs
}

interface IntegrationLot {
  id: number | string
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

interface Integration {
  id: number
  name: string
  destination: string
  client: string
  date: string
  totalWeight: number
  status: 'draft' | 'completed'
  lots: IntegrationLot[]
  createdAt: string
}

export default function ShippingWeights() {
  const [currentLote, setCurrentLote] = useState<Lote | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [showNewLoteModal, setShowNewLoteModal] = useState(false)
  const [showPesajeModal, setShowPesajeModal] = useState(false)
  const [editingPesaje, setEditingPesaje] = useState<Pesaje | null>(null)
  const [selectedPartidaNumber, setSelectedPartidaNumber] = useState('')
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentOperator, setCurrentOperator] = useState('')
  const [showOperatorModal, setShowOperatorModal] = useState(false)
  
  // Estados para integraciones
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showIntegrationSelector, setShowIntegrationSelector] = useState(false)
  const [isWeighing, setIsWeighing] = useState(false)
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [weighingData, setWeighingData] = useState<any[]>([])
  
  // Estados para el formulario de pesaje
  const [partidas, setPartidas] = useState<PartidaPesaje[]>([])
  const [selectedPartida, setSelectedPartida] = useState<PartidaPesaje | null>(null)
  const [pesajeForm, setPesajeForm] = useState({
    taraType: 'yute' as 'yute' | 'nylon',
    grossWeight: '',
    bags: '',
    notes: ''
  })
  
  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState<'integrations' | 'history' | 'reports'>('integrations')
  
  // Estado para reportes guardados
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [reportSearchTerm, setReportSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showReportViewer, setShowReportViewer] = useState(false)
  
  // Estado para historial de envíos
  const [shipmentHistory, setShipmentHistory] = useState<any[]>([])
  const [shipmentSearchTerm, setShipmentSearchTerm] = useState('')
  
  // Estados para el sistema de pesaje mejorado
  const [activeIntegration, setActiveIntegration] = useState<IntegrationWeighing | null>(null)
  const [showWeighingModal, setShowWeighingModal] = useState(false)
  const [selectedPartidaForWeighing, setSelectedPartidaForWeighing] = useState<PartidaPesaje | null>(null)
  const [weighingForm, setWeighingForm] = useState({
    pesoBruto: '',
    tara: '',
    bultos: '',
    observaciones: '',
    operador: 'Operador 1'
  })
  
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  // Update calculations in real-time
  useEffect(() => {
    const updateCalculations = () => {
      const taraTypeSelect = document.querySelector('select[name="taraType"]') as HTMLSelectElement
      const bultosInput = document.querySelector('input[name="bultosCount"]') as HTMLInputElement
      const grossWeightInput = document.querySelector('input[name="grossWeight"]') as HTMLInputElement
      
      if (taraTypeSelect && bultosInput && grossWeightInput) {
        const taraType = taraTypeSelect.value as 'yute' | 'nylon'
        const bultosCount = Number(bultosInput.value) || 0
        const grossWeight = Number(grossWeightInput.value) || 0
        
        if (taraType && bultosCount > 0) {
          const totalTaraWeight = calculateTotalTaraWeight(taraType, bultosCount)
          const netWeight = calculateNetWeight(grossWeight, bultosCount, taraType)
          
          const totalTaraElement = document.getElementById('calculatedTotalTara')
          const netWeightElement = document.getElementById('calculatedNetWeight')
          
          if (totalTaraElement) {
            totalTaraElement.textContent = `${totalTaraWeight} lbs`
          }
          if (netWeightElement) {
            netWeightElement.textContent = `${netWeight} lbs`
          }
        }
      }
    }

    // Add event listeners
    const taraTypeSelect = document.querySelector('select[name="taraType"]')
    const bultosInput = document.querySelector('input[name="bultosCount"]')
    const grossWeightInput = document.querySelector('input[name="grossWeight"]')
    
    if (taraTypeSelect) taraTypeSelect.addEventListener('change', updateCalculations)
    if (bultosInput) bultosInput.addEventListener('input', updateCalculations)
    if (grossWeightInput) grossWeightInput.addEventListener('input', updateCalculations)

    return () => {
      if (taraTypeSelect) taraTypeSelect.removeEventListener('change', updateCalculations)
      if (bultosInput) bultosInput.removeEventListener('input', updateCalculations)
      if (grossWeightInput) grossWeightInput.removeEventListener('input', updateCalculations)
    }
  }, [showPesajeModal])

  // Load operator from localStorage
  useEffect(() => {
    const savedOperator = localStorage.getItem('shippingWeightsOperator')
    if (savedOperator) {
      setCurrentOperator(savedOperator)
    } else {
      setShowOperatorModal(true)
    }
  }, [])

  // Debug: Log cuando cambien las partidas
  useEffect(() => {
    console.log('🔄 Estado de partidas actualizado:', partidas)
    console.log('📊 partidas.length:', partidas.length)
  }, [partidas])

  // Inicializar partidas automáticamente cuando se selecciona una integración y está en modo pesaje
  useEffect(() => {
    if (selectedIntegration && isWeighing && partidas.length === 0) {
      console.log('🚀 Inicializando partidas automáticamente')
      const initialPartidas: PartidaPesaje[] = selectedIntegration.lots.map((lot) => ({
        id: `partida-${lot.id}`,
        numeroIngreso: lot.numero_ingreso,
        pesoEsperado: lot.peso_quintales,
        tipo: lot.tipo,
        pesajes: [],
        pesoTotalRegistrado: 0,
        isCompleted: false
      }))
      console.log('📦 Partidas inicializadas automáticamente:', initialPartidas)
      setPartidas(initialPartidas)
    }
  }, [selectedIntegration, isWeighing, partidas.length])

  // Persistir estado del pesaje activo
  useEffect(() => {
    if (selectedIntegration && isWeighing) {
      const activeWeighingData = {
        integration: selectedIntegration,
        partidas: partidas,
        weighingData: weighingData,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('activeWeighing', JSON.stringify(activeWeighingData))
      console.log('💾 Estado del pesaje guardado:', activeWeighingData)
    }
    // Solo eliminar el estado si explícitamente se cancela el pesaje
    // No eliminar automáticamente cuando se navega entre módulos
  }, [selectedIntegration, isWeighing, partidas, weighingData])

  // Restaurar estado del pesaje al cargar el componente
  useEffect(() => {
    const loadActiveWeighing = () => {
      try {
        const storedActiveWeighing = localStorage.getItem('activeWeighing')
        console.log('🔍 Verificando localStorage para activeWeighing:', storedActiveWeighing ? 'EXISTS' : 'NOT_FOUND')
        
        if (storedActiveWeighing) {
          const activeWeighing = JSON.parse(storedActiveWeighing)
          console.log('🔄 Restaurando estado del pesaje completo:', {
            integration: activeWeighing.integration?.name,
            partidas: activeWeighing.partidas?.length || 0,
            weighingData: activeWeighing.weighingData?.length || 0,
            timestamp: activeWeighing.timestamp
          })
          
          setSelectedIntegration(activeWeighing.integration)
          setWeighingData(activeWeighing.weighingData || [])
          setIsWeighing(true)
          
          // Si no hay partidas o están vacías, inicializarlas
          if (!activeWeighing.partidas || activeWeighing.partidas.length === 0) {
            console.log('🔧 Inicializando partidas desde integración restaurada')
            const initialPartidas: PartidaPesaje[] = activeWeighing.integration.lots.map((lot: any) => ({
              id: `partida-${lot.id}`,
              numeroIngreso: lot.numero_ingreso,
              pesoEsperado: lot.peso_quintales,
              tipo: lot.tipo,
              pesajes: [],
              pesoTotalRegistrado: 0,
              isCompleted: false
            }))
            setPartidas(initialPartidas)
            console.log('📦 Partidas inicializadas:', initialPartidas.length)
          } else {
            setPartidas(activeWeighing.partidas)
            console.log('📦 Partidas restauradas:', activeWeighing.partidas.length)
          }
        } else {
          console.log('❌ No hay estado de pesaje activo en localStorage')
        }
      } catch (error) {
        console.error('Error loading active weighing:', error)
      }
    }

    loadActiveWeighing()
  }, [])

  // Load integrations from localStorage
  useEffect(() => {
    const loadIntegrations = () => {
      try {
        const storedIntegrations = localStorage.getItem('lotIntegrations')
        if (storedIntegrations) {
          const parsedIntegrations = JSON.parse(storedIntegrations)
          // Filtrar solo las integraciones que no han sido usadas
          const availableIntegrations = parsedIntegrations.filter((integration: any) => !integration.used)
          console.log('🔍 Integraciones cargadas desde localStorage:', availableIntegrations)
          setIntegrations(availableIntegrations)
        } else {
          console.log('❌ No se encontraron integraciones en localStorage con la clave "lotIntegrations"')
          // Debug: mostrar todas las claves disponibles
          const allKeys = Object.keys(localStorage)
          console.log('🔑 Todas las claves en localStorage:', allKeys)
          const lotIntegrations = localStorage.getItem('lotIntegrations')
          console.log('📦 Contenido de lotIntegrations:', lotIntegrations)
        }
        
        // Check if there's a selected integration from LotIntegration module
        const selectedIntegrationData = localStorage.getItem('selectedIntegration')
        if (selectedIntegrationData) {
          const integration = JSON.parse(selectedIntegrationData)
          setSelectedIntegration(integration)
          localStorage.removeItem('selectedIntegration') // Clear after loading
        }
      } catch (error) {
        console.error('Error loading integrations:', error)
      }
    }

    loadIntegrations()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lotIntegrations') {
        loadIntegrations()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Load saved reports from localStorage
  useEffect(() => {
    const loadSavedReports = () => {
      try {
        const storedReports = localStorage.getItem('weighingReports')
        if (storedReports) {
          const parsedReports = JSON.parse(storedReports)
          console.log('📄 Reportes guardados cargados:', parsedReports.length)
          setSavedReports(parsedReports)
        } else {
          console.log('❌ No se encontraron reportes guardados')
          setSavedReports([])
        }
      } catch (error) {
        console.error('Error loading saved reports:', error)
        setSavedReports([])
      }
    }

    loadSavedReports()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'weighingReports') {
        loadSavedReports()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Load shipment history from localStorage
  useEffect(() => {
    const loadShipmentHistory = () => {
      try {
        const storedHistory = localStorage.getItem('shipmentHistory')
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory)
          console.log('📦 Historial de envíos cargado:', parsedHistory.length, 'envíos')
          setShipmentHistory(parsedHistory)
        } else {
          console.log('❌ No se encontró historial de envíos')
          setShipmentHistory([])
        }
      } catch (error) {
        console.error('Error loading shipment history:', error)
        setShipmentHistory([])
      }
    }

    loadShipmentHistory()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shipmentHistory') {
        loadShipmentHistory()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Save data to localStorage for dashboard monitoring
  useEffect(() => {
    const shippingData = {
      currentLoteId: currentLote?.id || null,
      currentLote: currentLote,
      lotes: lotes
    }
    localStorage.setItem('shippingWeightsData', JSON.stringify(shippingData))
  }, [currentLote, lotes])

  // Sample data - Lotes disponibles en inventario
  const availableLotes = [
    { id: 1, loteNumber: "1189", totalWeight: 100, description: "Café Arábica Premium" },
    { id: 2, loteNumber: "1190", totalWeight: 75, description: "Café Robusta Selecto" },
    { id: 3, loteNumber: "1191", totalWeight: 50, description: "Café Especial" },
    { id: 4, loteNumber: "1192", totalWeight: 120, description: "Café Orgánico" }
  ]

  // Initialize with sample data
  useEffect(() => {
    const sampleLotes: Lote[] = [
      // Lote actual en progreso
      {
        id: 1,
        loteNumber: "1189",
        totalWeight: 100,
        currentWeight: 0,
        partidas: [
          {
            id: 1,
            partidaNumber: "P001",
            totalGrossWeight: 250.0,
            totalNetWeight: 200.0,
            totalTaraWeight: 50.0,
            totalBultos: 35,
            pesajes: [
              {
                id: 1,
                taraType: "yute",
                taraWeight: 1.5,
                bultosCount: 20,
                totalTaraWeight: 30.0, // 1.5 * 20
                grossWeight: 150.0,
                netWeight: 120.0, // 150 - 30
                date: new Date().toISOString().split('T')[0],
                time: "10:30",
                operator: "Juan Pérez",
                notes: "Primer pesaje - 20 bultos yute",
                createdAt: new Date()
              },
              {
                id: 2,
                taraType: "yute",
                taraWeight: 1.5,
                bultosCount: 15,
                totalTaraWeight: 22.5, // 1.5 * 15
                grossWeight: 100.0,
                netWeight: 77.5, // 100 - 22.5
                date: new Date().toISOString().split('T')[0],
                time: "11:00",
                operator: "Juan Pérez",
                notes: "Segundo pesaje - 15 bultos yute",
                createdAt: new Date()
              }
            ],
            isCompleted: false,
            createdAt: new Date()
          },
          {
            id: 2,
            partidaNumber: "P002",
            totalGrossWeight: 100.0,
            totalNetWeight: 85.0,
            totalTaraWeight: 15.0,
            totalBultos: 15,
            pesajes: [
              {
                id: 3,
                taraType: "nylon",
                taraWeight: 1.0,
                bultosCount: 15,
                totalTaraWeight: 15.0, // 1.0 * 15
                grossWeight: 100.0,
                netWeight: 85.0, // 100 - 15
                date: new Date().toISOString().split('T')[0],
                time: "11:15",
                operator: "María García",
                notes: "Partida completa con nylon",
                createdAt: new Date()
              }
            ],
            isCompleted: false,
            createdAt: new Date()
          }
        ],
        isCompleted: false,
        createdAt: new Date()
      },
      // Lote completado - Envío semana pasada
      {
        id: 2,
        loteNumber: "1188",
        totalWeight: 80,
        currentWeight: 80,
        partidas: [
          {
            id: 3,
            partidaNumber: "P001",
            totalGrossWeight: 180.0,
            totalNetWeight: 150.0,
            totalTaraWeight: 30.0,
            totalBultos: 20,
            pesajes: [
              {
                id: 4,
                taraType: "yute",
                taraWeight: 1.5,
                bultosCount: 20,
                totalTaraWeight: 30.0,
                grossWeight: 180.0,
                netWeight: 150.0,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: "14:30",
                operator: "Carlos López",
                notes: "Envío completo - 20 bultos yute",
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            ],
            isCompleted: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        ],
        isCompleted: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      // Lote completado - Envío hace 2 semanas
      {
        id: 3,
        loteNumber: "1187",
        totalWeight: 120,
        currentWeight: 120,
        partidas: [
          {
            id: 4,
            partidaNumber: "P001",
            totalGrossWeight: 200.0,
            totalNetWeight: 170.0,
            totalTaraWeight: 30.0,
            totalBultos: 20,
            pesajes: [
              {
                id: 5,
                taraType: "yute",
                taraWeight: 1.5,
                bultosCount: 20,
                totalTaraWeight: 30.0,
                grossWeight: 200.0,
                netWeight: 170.0,
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: "09:15",
                operator: "Ana Rodríguez",
                notes: "Envío completo - 20 bultos yute",
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
              }
            ],
            isCompleted: true,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          },
          {
            id: 5,
            partidaNumber: "P002",
            totalGrossWeight: 150.0,
            totalNetWeight: 135.0,
            totalTaraWeight: 15.0,
            totalBultos: 15,
            pesajes: [
              {
                id: 6,
                taraType: "nylon",
                taraWeight: 1.0,
                bultosCount: 15,
                totalTaraWeight: 15.0,
                grossWeight: 150.0,
                netWeight: 135.0,
                date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: "10:45",
                operator: "Ana Rodríguez",
                notes: "Segunda partida - 15 bultos nylon",
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
              }
            ],
            isCompleted: true,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        ],
        isCompleted: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ]
    
    // Calculate current weights
    sampleLotes.forEach(lote => {
      lote.currentWeight = lote.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0)
    })
    
    setLotes(sampleLotes)
    setCurrentLote(sampleLotes[0])
  }, [])

  // CRUD Functions
  const handleCreateLote = (loteNumber: string, totalWeight: number) => {
    const newLote: Lote = {
      id: Math.max(...lotes.map(l => l.id), 0) + 1,
      loteNumber,
      totalWeight,
      currentWeight: 0,
      partidas: [],
      isCompleted: false,
      createdAt: new Date()
    }
    setLotes(prev => [...prev, newLote])
    setCurrentLote(newLote)
    setShowNewLoteModal(false)
  }

  // Función comentada - no se está utilizando actualmente y causaba errores de tipo
  // const handleAddPesaje = (pesajeData: Omit<Pesaje, 'id' | 'createdAt' | 'totalTaraWeight'>) => {
  //   // Esta función no se está utilizando y causaba errores de tipo
  //   // Se puede implementar más adelante si es necesario
  // }

  const handleEditPesaje = (updatedPesaje: Pesaje) => {
    if (!currentLote) return

    // Recalculate total tara weight and net weight
    const totalTaraWeight = calculateTotalTaraWeight(updatedPesaje.taraType, updatedPesaje.bultosCount)
    const netWeight = calculateNetWeight(updatedPesaje.grossWeight, updatedPesaje.bultosCount, updatedPesaje.taraType)
    
    const finalPesaje = {
      ...updatedPesaje,
      totalTaraWeight,
      netWeight
    }

    // Find and update the pesaje in the partida
    const updatedLote = {
      ...currentLote,
      partidas: currentLote.partidas.map(p => ({
        ...p,
        pesajes: p.pesajes.map(pe => pe.id === updatedPesaje.id ? finalPesaje : pe)
      }))
    }

    // Recalculate partida totals
    updatedLote.partidas.forEach(partida => {
      partida.totalGrossWeight = partida.pesajes.reduce((sum, pe) => sum + pe.grossWeight, 0)
      partida.totalNetWeight = partida.pesajes.reduce((sum, pe) => sum + pe.netWeight, 0)
      partida.totalTaraWeight = partida.pesajes.reduce((sum, pe) => sum + pe.totalTaraWeight, 0)
      partida.totalBultos = partida.pesajes.reduce((sum, pe) => sum + pe.bultosCount, 0)
    })

    // Recalculate current weight
    updatedLote.currentWeight = updatedLote.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0)

    // Check if lote is completed
    if (updatedLote.currentWeight >= updatedLote.totalWeight) {
      updatedLote.isCompleted = true
      updatedLote.completedAt = new Date()
    } else {
      updatedLote.isCompleted = false
      updatedLote.completedAt = undefined
    }

    setLotes(prev => prev.map(l => l.id === currentLote.id ? updatedLote : l))
    setCurrentLote(updatedLote)
    setShowPesajeModal(false)
    setEditingPesaje(null)
  }

  const handleDeletePesaje = (pesajeId: number) => {
    if (!currentLote) return

    if (window.confirm('¿Estás seguro de que quieres eliminar este pesaje?')) {
      const updatedLote = {
        ...currentLote,
        partidas: currentLote.partidas.map(p => ({
          ...p,
          pesajes: p.pesajes.filter(pe => pe.id !== pesajeId)
        })).filter(p => p.pesajes.length > 0) // Remove partidas with no pesajes
      }

      // Recalculate partida totals
      updatedLote.partidas.forEach(partida => {
        partida.totalGrossWeight = partida.pesajes.reduce((sum, pe) => sum + pe.grossWeight, 0)
        partida.totalNetWeight = partida.pesajes.reduce((sum, pe) => sum + pe.netWeight, 0)
        partida.totalTaraWeight = partida.pesajes.reduce((sum, pe) => sum + pe.totalTaraWeight, 0)
        partida.totalBultos = partida.pesajes.reduce((sum, pe) => sum + pe.bultosCount, 0)
      })

      // Recalculate current weight
      updatedLote.currentWeight = updatedLote.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0)

      // Check if lote is completed
      if (updatedLote.currentWeight >= updatedLote.totalWeight) {
        updatedLote.isCompleted = true
        updatedLote.completedAt = new Date()
      } else {
        updatedLote.isCompleted = false
        updatedLote.completedAt = undefined
      }

      setLotes(prev => prev.map(l => l.id === currentLote.id ? updatedLote : l))
      setCurrentLote(updatedLote)
    }
  }

  const handleDeletePartida = (partidaId: number) => {
    if (!currentLote) return

    if (window.confirm('¿Estás seguro de que quieres eliminar esta partida completa?')) {
      const updatedLote = {
        ...currentLote,
        partidas: currentLote.partidas.filter(p => p.id !== partidaId)
      }

      // Recalculate current weight
      updatedLote.currentWeight = updatedLote.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0)

      // Check if lote is completed
      if (updatedLote.currentWeight >= updatedLote.totalWeight) {
        updatedLote.isCompleted = true
        updatedLote.completedAt = new Date()
      } else {
        updatedLote.isCompleted = false
        updatedLote.completedAt = undefined
      }

      setLotes(prev => prev.map(l => l.id === currentLote.id ? updatedLote : l))
      setCurrentLote(updatedLote)
    }
  }

  const handleDeleteLote = (loteId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lote completo? Esta acción eliminará todas las partidas y pesajes asociados.')) {
      const updatedLotes = lotes.filter(l => l.id !== loteId)
      setLotes(updatedLotes)
      
      // Si el lote eliminado era el actual, seleccionar otro o limpiar
      if (currentLote?.id === loteId) {
        setCurrentLote(updatedLotes.length > 0 ? updatedLotes[0] : null)
      }
    }
  }

  const handleCloseLote = (loteId: number) => {
    if (window.confirm('¿Estás seguro de que quieres cerrar este lote? Una vez cerrado, no se podrán agregar más pesajes.')) {
      const updatedLotes = lotes.map(l => 
        l.id === loteId 
          ? { 
              ...l, 
              isCompleted: true, 
              completedAt: new Date(),
              currentWeight: l.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0)
            }
          : l
      )
      setLotes(updatedLotes)
      
      // Update current lote if it's the one being closed
      if (currentLote?.id === loteId) {
        const updatedLote = updatedLotes.find(l => l.id === loteId)
        if (updatedLote) {
          setCurrentLote(updatedLote)
        }
      }
    }
  }

  const handleSetOperator = (operator: string) => {
    setCurrentOperator(operator)
    localStorage.setItem('shippingWeightsOperator', operator)
    setShowOperatorModal(false)
  }

  const handleChangeOperator = () => {
    setShowOperatorModal(true)
  }

  // Funciones para manejar integraciones
  const handleSelectIntegration = (integration: Integration) => {
    console.log('✅ Integración seleccionada:', integration)
    setSelectedIntegration(integration)
    setShowIntegrationSelector(false)
    setIsWeighing(true)
    setWeighingData([]) // Limpiar datos de pesaje anteriores
  }

  const handleStartWeighing = () => {
    console.log('🔘 handleStartWeighing llamada')
    console.log('🔍 selectedIntegration:', selectedIntegration)
    
    if (selectedIntegration) {
      console.log('🚀 Iniciando pesaje para integración:', selectedIntegration)
      console.log('📋 selectedIntegration.lots:', selectedIntegration.lots)
      console.log('📊 Número de lotes:', selectedIntegration.lots?.length)
      
      setIsWeighing(true)
      setWeighingData([])
      
      // Inicializar partidas basadas en los lotes de la integración
      const initialPartidas: PartidaPesaje[] = selectedIntegration.lots.map((lot, index) => {
        console.log(`📦 Procesando lote ${index}:`, lot)
        return {
          id: `partida-${lot.id}`,
          numeroIngreso: lot.numero_ingreso,
          pesoEsperado: lot.peso_quintales,
          tipo: lot.tipo,
          pesajes: [],
          pesoTotalRegistrado: 0,
          isCompleted: false
        }
      })
      
      console.log('📦 Partidas inicializadas:', initialPartidas)
      console.log('📊 Número de partidas creadas:', initialPartidas.length)
      setPartidas(initialPartidas)
    } else {
      console.log('❌ No hay integración seleccionada')
    }
  }

  const handleFinishWeighing = () => {
    // Guardar reporte automáticamente (sin notificación)
    handleSaveReport(false)
    
    // Registrar envío en historial
    handleRegisterShipment()
    
    setIsWeighing(false)
    setShowFinalReport(true)
    // El estado se limpiará automáticamente cuando isWeighing y selectedIntegration sean false
  }

  const handleCloseReport = () => {
    setShowFinalReport(false)
    // No limpiar el estado aquí para mantener la persistencia
    // El estado se mantendrá para continuar el pesaje si es necesario
  }

  // Función para cancelar completamente el pesaje
  const handleCancelWeighing = () => {
    setSelectedIntegration(null)
    setIsWeighing(false)
    setWeighingData([])
    setPartidas([])
    setSelectedPartida(null)
    setShowFinalReport(false)
    localStorage.removeItem('activeWeighing')
    console.log('🗑️ Pesaje cancelado completamente')
  }

  // Función para guardar el reporte completo
  const handleSaveReport = (showNotification: boolean = true) => {
    if (!selectedIntegration || weighingData.length === 0) {
      if (showNotification) {
        showError('No hay datos suficientes para guardar el reporte')
      }
      return
    }

    const reportData = {
      id: Date.now(),
      integration: selectedIntegration,
      partidas: partidas,
      weighingData: weighingData,
      summary: {
        expectedWeight: selectedIntegration.totalWeight,
        actualWeight: weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100,
        difference: (weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100) - selectedIntegration.totalWeight,
        percentageDiff: selectedIntegration.totalWeight > 0 
          ? (((weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100) - selectedIntegration.totalWeight) / selectedIntegration.totalWeight) * 100
          : 0
      },
      createdAt: new Date().toISOString(),
      reportNumber: `REP-${Date.now().toString().slice(-6)}`
    }

    // Guardar en localStorage
    const existingReports = JSON.parse(localStorage.getItem('weighingReports') || '[]')
    existingReports.push(reportData)
    localStorage.setItem('weighingReports', JSON.stringify(existingReports))

    if (showNotification) {
      showSuccess(`Reporte guardado exitosamente: ${reportData.reportNumber}`)
    }
    console.log('📄 Reporte guardado:', reportData)
  }

  // Función para registrar envío en historial
  const handleRegisterShipment = () => {
    if (!selectedIntegration || weighingData.length === 0) {
      showError('No hay datos suficientes para registrar el envío')
      return
    }

    const shipmentData = {
      id: Date.now(),
      integrationId: selectedIntegration.id,
      integrationName: selectedIntegration.name,
      destination: selectedIntegration.destination,
      client: selectedIntegration.client,
      integrationDate: selectedIntegration.date, // Fecha original de la integración
      expectedWeight: selectedIntegration.totalWeight,
      actualWeight: weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100,
      difference: (weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100) - selectedIntegration.totalWeight,
      percentageDiff: selectedIntegration.totalWeight > 0 
        ? (((weighingData.reduce((sum, item) => sum + item.netWeight, 0) / 100) - selectedIntegration.totalWeight) / selectedIntegration.totalWeight) * 100
        : 0,
      lots: selectedIntegration.lots,
      partidas: partidas,
      weighingData: weighingData,
      completedAt: new Date().toISOString(),
      status: 'completed'
    }

    // Guardar en historial de envíos
    const existingShipments = JSON.parse(localStorage.getItem('shipmentHistory') || '[]')
    existingShipments.push(shipmentData)
    localStorage.setItem('shipmentHistory', JSON.stringify(existingShipments))

    // Marcar integración como usada
    const existingIntegrations = JSON.parse(localStorage.getItem('lotIntegrations') || '[]')
    const updatedIntegrations = existingIntegrations.map((integration: any) => {
      if (integration.id === selectedIntegration.id) {
        return {
          ...integration,
          status: 'completed',
          completedAt: new Date().toISOString(),
          used: true
        }
      }
      return integration
    })
    localStorage.setItem('lotIntegrations', JSON.stringify(updatedIntegrations))

    showSuccess(`Envío registrado exitosamente: ${selectedIntegration.name}`)
    console.log('📦 Envío registrado:', shipmentData)
  }

  // Función para ver un reporte guardado
  const handleViewReport = (report: any) => {
    setSelectedReport(report)
    setShowReportViewer(true)
  }

  // Función para imprimir un reporte guardado
  const handlePrintReport = (report: any) => {
    // Crear una ventana nueva para imprimir
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Pesaje - ${report.reportNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { display: flex; justify-content: space-around; margin: 20px 0; }
              .summary-item { text-align: center; padding: 10px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REPORTE FINAL DE PESAJE</h1>
              <h2>${report.integration.name}</h2>
              <p>Reporte: ${report.reportNumber}</p>
              <p>Fecha: ${new Date(report.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h3>Información de la Integración</h3>
              <p><strong>Destino:</strong> ${report.integration.destination}</p>
              <p><strong>Cliente:</strong> ${report.integration.client}</p>
              <p><strong>Fecha:</strong> ${report.integration.date}</p>
            </div>
            
            <div class="summary">
              <div class="summary-item">
                <h4>Peso Esperado</h4>
                <p>${report.summary.expectedWeight} qq</p>
              </div>
              <div class="summary-item">
                <h4>Peso Registrado</h4>
                <p>${report.summary.actualWeight.toFixed(2)} qq</p>
              </div>
              <div class="summary-item">
                <h4>Diferencia</h4>
                <p>${report.summary.difference.toFixed(2)} qq</p>
              </div>
            </div>
            
            <div class="section">
              <h3>Detalles de Pesaje</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Partida</th>
                    <th>Tara</th>
                    <th>Bultos</th>
                    <th>Peso Bruto</th>
                    <th>Peso Neto</th>
                    <th>Fecha/Hora</th>
                    <th>Operador</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.weighingData.map((pesaje: any, index: number) => {
                    const partida = report.partidas.find((p: any) => p.pesajes.some((pe: any) => pe.id === pesaje.id))
                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${partida?.numeroIngreso || 'N/A'}</td>
                        <td>${pesaje.taraType === 'yute' ? 'Yute (1.5 lbs)' : 'Nylon (1.0 lbs)'}</td>
                        <td>${pesaje.bultosCount}</td>
                        <td>${(pesaje.grossWeight / 100).toFixed(2)} qq</td>
                        <td>${(pesaje.netWeight / 100).toFixed(2)} qq</td>
                        <td>${pesaje.date} ${pesaje.time}</td>
                        <td>${pesaje.operator}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Función para filtrar reportes
  const filteredReports = savedReports.filter(report => {
    const searchTerm = reportSearchTerm.toLowerCase()
    
    return (
      (report.reportNumber && report.reportNumber.toLowerCase().includes(searchTerm)) ||
      (report.integration?.name && report.integration.name.toLowerCase().includes(searchTerm)) ||
      (report.integration?.destination && report.integration.destination.toLowerCase().includes(searchTerm)) ||
      (report.integration?.client && report.integration.client.toLowerCase().includes(searchTerm))
    )
  })

  // Función para filtrar envíos
  const filteredShipments = shipmentHistory.filter(shipment => {
    const searchTerm = shipmentSearchTerm.toLowerCase()
    
    return (
      (shipment.integrationName && shipment.integrationName.toLowerCase().includes(searchTerm)) ||
      (shipment.destination && shipment.destination.toLowerCase().includes(searchTerm)) ||
      (shipment.client && shipment.client.toLowerCase().includes(searchTerm)) ||
      (shipment.integrationDate && shipment.integrationDate.toLowerCase().includes(searchTerm)) ||
      (shipment.completedAt && new Date(shipment.completedAt).toLocaleDateString().toLowerCase().includes(searchTerm))
    )
  })

  // Funciones para calcular métricas y KPIs
  const calculateShippingMetrics = () => {
    const totalShipments = shipmentHistory.length
    const totalWeightSent = shipmentHistory.reduce((sum, shipment) => sum + (shipment.actualWeight || 0), 0)
    const totalExpectedWeight = shipmentHistory.reduce((sum, shipment) => sum + (shipment.expectedWeight || 0), 0)
    const totalWeightDifference = totalWeightSent - totalExpectedWeight
    const averageAccuracy = totalExpectedWeight > 0 ? ((totalWeightSent / totalExpectedWeight) * 100) : 0

    // Métricas por cliente
    const clientMetrics = shipmentHistory.reduce((acc, shipment) => {
      const client = shipment.client || 'Sin Cliente'
      if (!acc[client]) {
        acc[client] = {
          shipments: 0,
          totalWeight: 0,
          totalExpected: 0
        }
      }
      acc[client].shipments += 1
      acc[client].totalWeight += shipment.actualWeight || 0
      acc[client].totalExpected += shipment.expectedWeight || 0
      return acc
    }, {} as Record<string, { shipments: number; totalWeight: number; totalExpected: number }>)

    // Métricas por destino
    const destinationMetrics = shipmentHistory.reduce((acc, shipment) => {
      const destination = shipment.destination || 'Sin Destino'
      if (!acc[destination]) {
        acc[destination] = {
          shipments: 0,
          totalWeight: 0,
          totalExpected: 0
        }
      }
      acc[destination].shipments += 1
      acc[destination].totalWeight += shipment.actualWeight || 0
      acc[destination].totalExpected += shipment.expectedWeight || 0
      return acc
    }, {} as Record<string, { shipments: number; totalWeight: number; totalExpected: number }>)

    // Métricas mensuales (últimos 12 meses)
    const monthlyMetrics = shipmentHistory.reduce((acc, shipment) => {
      const date = new Date(shipment.completedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = {
          shipments: 0,
          totalWeight: 0,
          totalExpected: 0
        }
      }
      acc[monthKey].shipments += 1
      acc[monthKey].totalWeight += shipment.actualWeight || 0
      acc[monthKey].totalExpected += shipment.expectedWeight || 0
      return acc
    }, {} as Record<string, { shipments: number; totalWeight: number; totalExpected: number }>)

    // Top clientes por peso enviado
    const topClients = Object.entries(clientMetrics)
      .map(([client, data]) => {
        const clientData = data as { shipments: number; totalWeight: number; totalExpected: number }
        return {
          client,
          shipments: clientData.shipments,
          totalWeight: clientData.totalWeight,
          totalExpected: clientData.totalExpected,
          accuracy: clientData.totalExpected > 0 ? ((clientData.totalWeight / clientData.totalExpected) * 100) : 0
        }
      })
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 5)

    // Top destinos por peso enviado
    const topDestinations = Object.entries(destinationMetrics)
      .map(([destination, data]) => {
        const destinationData = data as { shipments: number; totalWeight: number; totalExpected: number }
        return {
          destination,
          shipments: destinationData.shipments,
          totalWeight: destinationData.totalWeight,
          totalExpected: destinationData.totalExpected,
          accuracy: destinationData.totalExpected > 0 ? ((destinationData.totalWeight / destinationData.totalExpected) * 100) : 0
        }
      })
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 5)

    return {
      totalShipments,
      totalWeightSent,
      totalExpectedWeight,
      totalWeightDifference,
      averageAccuracy,
      clientMetrics,
      destinationMetrics,
      monthlyMetrics,
      topClients,
      topDestinations
    }
  }

  const metrics = calculateShippingMetrics()

  // Funciones para manejar el pesaje
  const handleSelectPartida = (partida: PartidaPesaje) => {
    console.log('🎯 Partida seleccionada:', partida)
    setSelectedPartida(partida)
    setShowPesajeModal(true)
    setPesajeForm({
      taraType: 'yute',
      grossWeight: '',
      bags: '',
      notes: ''
    })
  }

  const handlePesajeFormChange = (field: string, value: string | number) => {
    setPesajeForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateNetWeight = (grossWeight: number, bags: number, taraType: 'yute' | 'nylon'): number => {
    const taraWeight = taraType === 'yute' ? 1.5 : 1.0
    const totalTara = taraWeight * bags
    return grossWeight - totalTara
  }

    const handleSubmitPesaje = () => {
      if (!selectedPartida || !pesajeForm.grossWeight || !pesajeForm.bags) {
        alert('Por favor complete todos los campos requeridos')
        return
      }

      const grossWeightQq = parseFloat(pesajeForm.grossWeight) // Peso bruto en quintales
      const grossWeightLbs = grossWeightQq * 100 // Convertir a libras
      const bags = parseInt(pesajeForm.bags)
      
      if (grossWeightQq <= 0 || bags <= 0) {
        alert('Los valores deben ser mayores a 0')
        return
      }

      const netWeight = calculateNetWeight(grossWeightLbs, bags, pesajeForm.taraType)
      
      if (netWeight <= 0) {
        alert('El peso neto no puede ser negativo o cero')
        return
      }

      const newPesaje: Pesaje = {
        id: Date.now(),
        taraType: pesajeForm.taraType,
        taraWeight: pesajeForm.taraType === 'yute' ? 1.5 : 1.0,
        bultosCount: bags,
        totalTaraWeight: (pesajeForm.taraType === 'yute' ? 1.5 : 1.0) * bags,
        grossWeight: grossWeightLbs, // Guardar en libras
        netWeight,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        operator: currentOperator || 'Admin',
        notes: pesajeForm.notes,
        createdAt: new Date()
      }

    // Actualizar la partida con el nuevo pesaje
    const updatedPartidas = partidas.map(partida => {
      if (partida.id === selectedPartida.id) {
        const updatedPesajes = [...partida.pesajes, newPesaje]
        const newPesoTotal = updatedPesajes.reduce((sum, pesaje) => sum + pesaje.netWeight, 0)
        
        return {
          ...partida,
          pesajes: updatedPesajes,
          pesoTotalRegistrado: newPesoTotal,
          isCompleted: newPesoTotal >= partida.pesoEsperado * 100 // Convertir quintales a libras
        }
      }
      return partida
    })

    setPartidas(updatedPartidas)
    setShowPesajeModal(false)
    setSelectedPartida(null)
    
    // Actualizar weighingData para el reporte
    const allPesajes = updatedPartidas.flatMap(p => p.pesajes)
    setWeighingData(allPesajes)
    
    // Notificar actualización
    showSuccess(`Pesaje registrado: ${newPesaje.netWeight} lbs para la partida ${selectedPartida.numeroIngreso}`)
  }

  const handleClosePesajeModal = () => {
    setShowPesajeModal(false)
    setSelectedPartida(null)
    setPesajeForm({
      taraType: 'yute',
      grossWeight: '',
      bags: '',
      notes: ''
    })
  }

  // Funciones para el sistema de pesaje mejorado
  const startWeighing = (integration: IntegrationWeighing) => {
    // Inicializar la integración con datos de pesaje si no los tiene
    const integrationWithPesaje = {
      ...integration,
      status: 'weighing' as const,
      pesajes: integration.pesajes || [],
      pesoRegistrado: integration.pesoRegistrado || 0,
      currentIngresoId: integration.currentIngresoId || integration.lots[0]?.id
    }
    setActiveIntegration(integrationWithPesaje)
    
    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === integration.id ? integrationWithPesaje : i
    )
    setIntegrations(updatedIntegrations)
  }

  const addWeighing = () => {
    if (!selectedPartidaForWeighing) {
      showError('Por favor selecciona una partida para pesar')
      return
    }

    const pesoBruto = parseFloat(weighingForm.pesoBruto)
    const tara = parseFloat(weighingForm.tara)
    const bultos = parseInt(weighingForm.bultos)
    
    if (isNaN(pesoBruto) || isNaN(tara) || isNaN(bultos) || pesoBruto <= 0 || tara < 0 || bultos <= 0) {
      showError('Por favor ingresa valores válidos para peso bruto, tara y bultos')
      return
    }

    const pesoNeto = pesoBruto - tara
    const newPesaje: Pesaje = {
      id: Date.now(),
      taraType: 'yute', // Por defecto, se puede cambiar después
      taraWeight: tara / bultos, // Tara por bulto
      bultosCount: bultos,
      totalTaraWeight: tara,
      grossWeight: pesoBruto,
      netWeight: pesoNeto,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      operator: weighingForm.operador,
      notes: weighingForm.observaciones,
      createdAt: new Date()
    }

    // Actualizar la partida con el nuevo pesaje
    const updatedPartidas = partidas.map(partida => {
      if (partida.id === selectedPartidaForWeighing.id) {
        const updatedPesajes = [...partida.pesajes, newPesaje]
        const newPesoTotal = updatedPesajes.reduce((sum, pesaje) => sum + pesaje.netWeight, 0)
        
        return {
          ...partida,
          pesajes: updatedPesajes,
          pesoTotalRegistrado: newPesoTotal,
          isCompleted: newPesoTotal >= partida.pesoEsperado * 100 // Convertir quintales a libras
        }
      }
      return partida
    })

    setPartidas(updatedPartidas)
    setWeighingForm({ pesoBruto: '', tara: '', bultos: '', observaciones: '', operador: 'Operador 1' })
    setShowWeighingModal(false)
    setSelectedPartidaForWeighing(null)

    showSuccess(`Pesaje registrado: ${newPesaje.netWeight} lbs para la partida ${selectedPartidaForWeighing.numeroIngreso}`)
  }

  const changeIngreso = (ingresoId: string) => {
    if (!activeIntegration) return
    
    const updatedIntegration = {
      ...activeIntegration,
      currentIngresoId: ingresoId
    }
    setActiveIntegration(updatedIntegration)

    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === activeIntegration.id ? updatedIntegration : i
    )
    setIntegrations(updatedIntegrations)
  }

  const finishWeighing = () => {
    if (!activeIntegration) return

    const updatedIntegration = {
      ...activeIntegration,
      status: 'shipped' as const
    }
    setActiveIntegration(null)

    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === activeIntegration.id ? updatedIntegration : i
    )
    setIntegrations(updatedIntegrations)

    showSuccess('Pesaje finalizado exitosamente')
  }

  const cancelWeighing = () => {
    if (!activeIntegration) return

    const updatedIntegration = {
      ...activeIntegration,
      status: 'draft' as const,
      pesajes: [],
      pesoRegistrado: 0,
      currentIngresoId: undefined
    }

    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === activeIntegration.id ? updatedIntegration : i
    )
    setIntegrations(updatedIntegrations)
    setActiveIntegration(null)

    showSuccess('Pesaje cancelado')
  }

  const getProgressPercentage = () => {
    if (partidas.length === 0) return 0
    const totalExpectedWeight = partidas.reduce((sum, partida) => sum + (partida.pesoEsperado * 100), 0)
    const totalRegisteredWeight = partidas.reduce((sum, partida) => sum + partida.pesoTotalRegistrado, 0)
    return Math.min((totalRegisteredWeight / totalExpectedWeight) * 100, 100)
  }

  const getTotalRegisteredWeight = () => {
    return partidas.reduce((sum, partida) => sum + partida.pesoTotalRegistrado, 0)
  }

  const getTotalExpectedWeight = () => {
    return partidas.reduce((sum, partida) => sum + (partida.pesoEsperado * 100), 0)
  }


  const handleClearIntegration = () => {
    setSelectedIntegration(null)
    setIsWeighing(false)
    setPartidas([])
    setWeighingData([])
  }

  const calculateWeightComparison = () => {
    if (!selectedIntegration || !currentLote) return null

    const integrationWeight = selectedIntegration.totalWeight // en quintales
    const integrationWeightLbs = integrationWeight * 100 // convertir a libras (1 quintal = 100 lbs)
    const actualWeight = currentLote.partidas.reduce((sum, p) => sum + p.totalNetWeight, 0) // en libras
    const difference = actualWeight - integrationWeightLbs
    const percentageDiff = integrationWeightLbs > 0 ? (difference / integrationWeightLbs) * 100 : 0

    return {
      expected: integrationWeightLbs,
      actual: actualWeight,
      difference: difference,
      percentageDiff: percentageDiff,
      status: Math.abs(percentageDiff) <= 5 ? 'good' : Math.abs(percentageDiff) <= 10 ? 'warning' : 'error'
    }
  }


  const calculateTotalTaraWeight = (taraType: 'yute' | 'nylon', bultosCount: number) => {
    const taraWeight = taraType === 'yute' ? 1.5 : 1.0
    return Math.round((taraWeight * bultosCount) * 100) / 100
  }

  const filteredLotes = lotes.filter(lote => {
    const matchesSearch = lote.loteNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = lote.createdAt.toISOString().split('T')[0] === selectedDate
    return matchesSearch && matchesDate
  })

  const summary: IntegrationSummary = {
    totalLotes: integrations.length,
    completedLotes: integrations.filter(i => i.status === 'completed').length,
    totalPartidas: lotes.reduce((sum, l) => sum + l.partidas.length, 0),
    totalGrossWeight: Math.round(lotes.reduce((sum, l) => 
      sum + l.partidas.reduce((pSum, p) => pSum + p.totalGrossWeight, 0), 0) * 100) / 100,
    totalNetWeight: Math.round(lotes.reduce((sum, l) => 
      sum + l.partidas.reduce((pSum, p) => pSum + p.totalNetWeight, 0), 0) * 100) / 100,
    totalTaraWeight: Math.round(lotes.reduce((sum, l) => 
      sum + l.partidas.reduce((pSum, p) => pSum + p.totalTaraWeight, 0), 0) * 100) / 100,
    yutePartidas: lotes.reduce((sum, l) => 
      sum + l.partidas.reduce((pSum, p) => pSum + p.pesajes.filter(pe => pe.taraType === 'yute').length, 0), 0),
    nylonPartidas: lotes.reduce((sum, l) => 
      sum + l.partidas.reduce((pSum, p) => pSum + p.pesajes.filter(pe => pe.taraType === 'nylon').length, 0), 0)
  }

  const getTaraColor = (taraType: string) => {
    switch (taraType) {
      case 'yute':
        return 'bg-amber-100 text-amber-800'
      case 'nylon':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaraText = (taraType: string) => {
    switch (taraType) {
      case 'yute':
        return 'Yute (1.5 lbs)'
      case 'nylon':
        return 'Nylon (1.0 lbs)'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pesos de Envío</h1>
          <p className="text-gray-600 mt-2">Sistema de pesaje por partidas para integración de lotes de café</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Operador actual */}
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <UserIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {currentOperator || 'Sin operador'}
            </span>
            <button 
              onClick={handleChangeOperator}
              className="text-blue-600 hover:text-blue-800"
              title="Cambiar operador"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowNewLoteModal(true)}
              className="btn btn-secondary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Lote
            </button>
            {currentLote && (
              <button 
                onClick={() => setShowPesajeModal(true)}
                disabled={currentLote.isCompleted}
                className={`btn ${currentLote.isCompleted ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                title={currentLote.isCompleted ? 'Lote cerrado - No se pueden agregar más pesajes' : 'Agregar nuevo pesaje'}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Pesaje
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard de Métricas y KPIs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ChartPieIcon className="h-6 w-6 mr-2 text-emerald-600" />
            Métricas de Envíos
          </h2>
          <div className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString()}
            </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Envíos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Envíos</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalShipments}</p>
                </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TruckIcon className="h-6 w-6 text-blue-700" />
              </div>
                </div>
              </div>

          {/* Total de Quintales Enviados */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Quintales Enviados</p>
                <p className="text-2xl font-bold text-emerald-900">{metrics.totalWeightSent.toFixed(2)} qq</p>
                <p className="text-xs text-emerald-700">{(metrics.totalWeightSent * 100).toFixed(0)} lbs</p>
                </div>
              <div className="p-3 bg-emerald-200 rounded-full">
                <ScaleIcon className="h-6 w-6 text-emerald-700" />
                </div>
                </div>
                </div>

          {/* Precisión Promedio */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Precisión Promedio</p>
                <p className="text-2xl font-bold text-amber-900">{metrics.averageAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-amber-700">
                  {metrics.totalWeightDifference >= 0 ? '+' : ''}{metrics.totalWeightDifference.toFixed(2)} qq dif.
                </p>
          </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-amber-700" />
              </div>
                </div>
      </div>

          {/* Reportes Generados */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Reportes</p>
                <p className="text-2xl font-bold text-purple-900">{savedReports.length}</p>
                <p className="text-xs text-purple-700">Guardados</p>
            </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Análisis Detallado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clientes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
              Top Clientes por Peso
            </h3>
            {metrics.topClients.length > 0 ? (
              <div className="space-y-3">
                {metrics.topClients.map((client, index) => (
                  <div key={client.client} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
            </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.client}</p>
                        <p className="text-sm text-gray-500">{client.shipments} envíos</p>
            </div>
          </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{client.totalWeight.toFixed(2)} qq</p>
                      <p className="text-sm text-gray-500">{client.accuracy.toFixed(1)}% precisión</p>
            </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de clientes disponibles</p>
          </div>
        )}
        </div>

          {/* Top Destinos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TruckIcon className="h-5 w-5 mr-2 text-gray-600" />
              Top Destinos por Peso
            </h3>
            {metrics.topDestinations.length > 0 ? (
              <div className="space-y-3">
                {metrics.topDestinations.map((destination, index) => (
                  <div key={destination.destination} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
            </div>
                      <div>
                        <p className="font-medium text-gray-900">{destination.destination}</p>
                        <p className="text-sm text-gray-500">{destination.shipments} envíos</p>
            </div>
          </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{destination.totalWeight.toFixed(2)} qq</p>
                      <p className="text-sm text-gray-500">{destination.accuracy.toFixed(1)}% precisión</p>
        </div>
            </div>
                ))}
            </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TruckIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de destinos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Rendimiento */}
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-emerald-600" />
            Resumen de Rendimiento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Peso Esperado Total</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalExpectedWeight.toFixed(2)} qq</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Peso Real Total</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalWeightSent.toFixed(2)} qq</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Estado General</p>
              <div className="flex items-center justify-center">
                {metrics.averageAccuracy >= 95 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Excelente
                  </span>
                ) : metrics.averageAccuracy >= 90 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Bueno
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Necesita Mejora
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Pesaje con Partidas */}
      {partidas.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <ScaleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">⚖️ Sistema de Pesaje</h2>
                  <p className="text-sm text-gray-600">Registro de pesajes por partidas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeighingModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nuevo Pesaje
                </button>
              </div>
            </div>

            {/* Información del progreso */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Partidas</p>
                  <p className="font-semibold text-gray-900">{partidas.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso Esperado</p>
                  <p className="font-semibold text-gray-900">{(getTotalExpectedWeight() / 100).toFixed(2)} qq</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso Registrado</p>
                  <p className="font-semibold text-gray-900">{(getTotalRegisteredWeight() / 100).toFixed(2)} qq</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Progreso</p>
                  <p className="font-semibold text-gray-900">{getProgressPercentage().toFixed(1)}%</p>
                </div>
              </div>
              
              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso General del Pesaje</span>
                  <span className="text-sm font-bold text-gray-900">
                    {getProgressPercentage().toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Registrado: {(getTotalRegisteredWeight() / 100).toFixed(2)} qq</span>
                  <span>Total: {(getTotalExpectedWeight() / 100).toFixed(2)} qq</span>
                </div>
              </div>
            </div>

            {/* Tabla de Partidas con Pesajes */}
            <div className="bg-white rounded-lg overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                Partidas y Pesajes Registrados
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número de Partida
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peso Esperado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peso Registrado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pesajes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {partidas.map((partida) => (
                      <tr key={partida.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {partida.numeroIngreso}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {partida.pesoEsperado} qq
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {(partida.pesoTotalRegistrado / 100).toFixed(2)} qq
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {partida.pesajes.length}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            partida.isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {partida.isCompleted ? 'Completada' : 'En Progreso'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setSelectedPartidaForWeighing(partida)
                              setShowWeighingModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Agregar Pesaje
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabla detallada de pesajes */}
            {partidas.some(p => p.pesajes.length > 0) && (
              <div className="bg-white rounded-lg overflow-hidden mt-6">
                <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                  Detalle de Pesajes por Partida
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Partida
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso Bruto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bultos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tara
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso Neto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operador
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partidas.flatMap(partida => 
                        partida.pesajes.map(pesaje => (
                          <tr key={pesaje.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {partida.numeroIngreso}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {pesaje.date} {pesaje.time}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pesaje.grossWeight.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pesaje.bultosCount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pesaje.totalTaraWeight.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                              {pesaje.netWeight.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {pesaje.operator}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
          <div className="flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Integración de Lotes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Historial de Envíos
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Reportes Guardados
          </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'integrations' && (
        <>
          {/* Selector de Integración */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
            Integración de Lotes
            </h2>
          <div className="flex items-center gap-2">
            {selectedIntegration && (
            <button 
                onClick={handleClearIntegration}
                className="btn btn-secondary btn-sm"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Limpiar
              </button>
            )}
            <button 
              onClick={() => setShowIntegrationSelector(true)}
              className="btn btn-primary btn-sm"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Seleccionar Integración
            </button>
          </div>
        </div>

        {selectedIntegration && !isWeighing ? (
          <div className="space-y-4">
            {/* Información de la integración seleccionada */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    {selectedIntegration.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-green-700 mt-1">
                    <span><strong>Destino:</strong> {selectedIntegration.destination}</span>
                    <span><strong>Cliente:</strong> {selectedIntegration.client}</span>
                    <span><strong>Fecha:</strong> {selectedIntegration.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-700">Peso Total Integrado</div>
                  <div className="text-xl font-bold text-green-900">
                    {selectedIntegration.totalWeight} qq
                  </div>
                </div>
              </div>
            </div>

            {/* Lotes de la integración */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedIntegration.lots.map((lot) => (
                <div key={lot.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      Lote {lot.numero_ingreso}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lot.estado === 'Aprobado' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                      {lot.estado}
              </span>
                </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Peso:</span>
                      <span className="font-medium">{lot.peso_quintales} qq</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rendimiento:</span>
                      <span className="font-medium">{lot.rendimiento}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humedad:</span>
                      <span className="font-medium">{lot.humedad}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <span className="font-medium">{lot.tipo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para comenzar pesaje */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  console.log('🔘 Botón Comenzar Pesaje clickeado')
                  handleStartWeighing()
                }}
                className="btn btn-primary btn-lg"
              >
                <ScaleIcon className="h-5 w-5 mr-2" />
                Comenzar Pesaje
              </button>
            </div>
          </div>
        ) : isWeighing && selectedIntegration ? (
          <div className="space-y-4">
            {/* Header del pesaje activo - Versión simplificada */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                    <ScaleIcon className="h-5 w-5 mr-2" />
                    Pesaje en Progreso
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Integración: <strong>{selectedIntegration.name}</strong>
                  </p>
              </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleFinishWeighing}
                    className="btn btn-success btn-sm"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Finalizar Pesaje
                  </button>
                  <button
                    onClick={handleCancelWeighing}
                    className="btn btn-danger btn-sm"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancelar Pesaje
                  </button>
            </div>
              </div>
            </div>

            {/* Información resumida de la integración */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Destino</p>
                  <p className="font-semibold text-gray-900">{selectedIntegration.destination}</p>
              </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold text-gray-900">{selectedIntegration.client}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Peso Total</p>
                  <p className="font-semibold text-gray-900">{selectedIntegration.totalWeight} qq</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Pesajes</p>
                  <p className="font-semibold text-gray-900">{weighingData.length}</p>
            </div>
          </div>
          
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Peso registrado: <span className="font-medium">
                    {weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0).toFixed(2)} lbs
                  </span>
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      // Función simplificada para agregar pesaje directo
                      const firstPartida = partidas[0]
                      if (firstPartida) {
                        handleSelectPartida(firstPartida)
                      }
                    }}
                    className="btn btn-primary btn-sm"
                    disabled={partidas.length === 0}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar Pesaje
                  </button>
            </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="text-center py-8">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay integración seleccionada
            </h3>
            <p className="text-gray-500 mb-4">
              Selecciona una integración de lotes para comenzar el proceso de pesaje
            </p>
            <button
              onClick={() => setShowIntegrationSelector(true)}
              className="btn btn-primary"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Seleccionar Integración
            </button>
        </div>
      )}
      </div>




      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen por Tipo de Tara</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <CubeIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-amber-900">Partidas de Yute</p>
                  <p className="text-xs text-amber-700">Tara: 1.5 lbs por bulto</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-900">{summary.yutePartidas}</p>
                <p className="text-sm text-amber-700">partidas</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <CubeIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Partidas de Nylon</p>
                  <p className="text-xs text-blue-700">Tara: 1.0 lbs por bulto</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{summary.nylonPartidas}</p>
                <p className="text-sm text-blue-700">partidas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalle de Pesos</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Peso Bruto Total:</span>
              <span className="text-sm font-semibold text-gray-900">{summary.totalGrossWeight} lbs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tara Total:</span>
              <span className="text-sm font-semibold text-gray-900">{summary.totalTaraWeight} lbs</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm font-semibold text-gray-800">Peso Neto Total:</span>
              <span className="text-sm font-bold text-gray-900">{summary.totalNetWeight} lbs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promedio por Partida:</span>
              <span className="text-sm font-semibold text-gray-900">
                {summary.totalPartidas > 0 ? (summary.totalNetWeight / summary.totalPartidas).toFixed(2) : '0.00'} lbs
              </span>
            </div>
          </div>
        </div>
      </div>



        </>
      )}

      {/* Tab Content - Historial de Envíos */}
      {activeTab === 'history' && (
        <>
          {/* Historial de Envíos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
            Historial de Envíos
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
              {filteredShipments.length} de {shipmentHistory.length} envío(s)
              </span>
            </div>
          </div>

        {/* Barra de búsqueda */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por integración, destino, cliente o fecha..."
              value={shipmentSearchTerm}
              onChange={(e) => setShipmentSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                              </div>
        </div>

        <div className="space-y-4">
          {filteredShipments
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .map((shipment) => (
            <div key={shipment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {shipment.integrationName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Completado el {new Date(shipment.completedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Enviado</div>
                  <div className="text-lg font-bold text-green-600">
                    {shipment.actualWeight.toFixed(2)} qq
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {shipment.lots.length}
                  </div>
                  <div className="text-xs text-gray-500">Lotes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {shipment.weighingData.length}
                  </div>
                  <div className="text-xs text-gray-500">Pesajes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {shipment.expectedWeight} qq
                  </div>
                  <div className="text-xs text-gray-500">Esperado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {shipment.actualWeight.toFixed(2)} qq
                  </div>
                  <div className="text-xs text-gray-500">Registrado</div>
                </div>
              </div>

              {/* Información de la Integración */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Información del Envío:</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">Destino:</span>
                    <p className="text-gray-600">{shipment.destination}</p>
                      </div>
                  <div>
                    <span className="font-medium text-gray-800">Cliente:</span>
                    <p className="text-gray-600">{shipment.client}</p>
                      </div>
                  <div>
                    <span className="font-medium text-gray-800">Fecha Integración:</span>
                    <p className="text-gray-600">{shipment.integrationDate}</p>
                    </div>
                  <div>
                    <span className="font-medium text-gray-800">Diferencia:</span>
                    <p className={`font-medium ${shipment.percentageDiff >= -5 && shipment.percentageDiff <= 5 ? 'text-green-600' : shipment.percentageDiff >= -10 && shipment.percentageDiff <= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {shipment.difference > 0 ? '+' : ''}{shipment.difference.toFixed(2)} qq ({shipment.percentageDiff > 0 ? '+' : ''}{shipment.percentageDiff.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredShipments.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {shipmentHistory.length === 0 ? 'No hay envíos completados' : 'No se encontraron envíos'}
            </h3>
            <p className="text-sm text-gray-500">
              {shipmentHistory.length === 0 
                ? 'Los envíos completados aparecerán aquí para consulta histórica'
                : 'Intenta con otros términos de búsqueda'
              }
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Tab Content - Reportes Guardados */}
      {activeTab === 'reports' && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Reportes de Pesaje Guardados
              </h2>
              <div className="text-sm text-gray-500">
                {savedReports.length} reporte(s) guardado(s)
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por número de reporte, integración, destino o cliente..."
                  value={reportSearchTerm}
                  onChange={(e) => setReportSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Lista de reportes */}
            {filteredReports.length > 0 ? (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.reportNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {report.integration.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Destino</p>
                        <p className="font-medium">{report.integration.destination}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="font-medium">{report.integration.client}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pesajes</p>
                        <p className="font-medium">{report.weighingData.length}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.summary.percentageDiff >= -5 && report.summary.percentageDiff <= 5
                            ? 'bg-green-100 text-green-800'
                            : report.summary.percentageDiff >= -10 && report.summary.percentageDiff <= 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.summary.percentageDiff > 0 ? '+' : ''}{report.summary.percentageDiff.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          Esperado: {report.summary.expectedWeight} qq | 
                          Registrado: {report.summary.actualWeight.toFixed(2)} qq
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="btn btn-sm btn-secondary"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => handlePrintReport(report)}
                          className="btn btn-sm btn-primary"
                        >
                          <PrinterIcon className="h-4 w-4 mr-1" />
                          Imprimir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {reportSearchTerm ? 'No se encontraron reportes' : 'No hay reportes guardados'}
                </h3>
                <p className="text-sm text-gray-500">
                  {reportSearchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Los reportes se guardan automáticamente cuando finalizas un pesaje'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Operator Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Configurar Operador
                </h3>
                <button 
                  onClick={() => setShowOperatorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Operador
                  </label>
                  <input 
                    type="text"
                    id="operatorInput"
                    className="input w-full"
                    placeholder="Ingresa tu nombre"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        if (input.value.trim()) {
                          handleSetOperator(input.value.trim())
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este nombre se usará automáticamente para todos los pesajes
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowOperatorModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('operatorInput') as HTMLInputElement
                      if (input.value.trim()) {
                        handleSetOperator(input.value.trim())
                      }
                    }}
                    className="btn btn-primary"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lote Modal */}
      {showNewLoteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nuevo Lote</h3>
                <button 
                  onClick={() => setShowNewLoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const loteNumber = formData.get('loteNumber') as string
                  const totalWeight = Number(formData.get('totalWeight'))
                  handleCreateLote(loteNumber, totalWeight)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="label">Número de Lote</label>
                  <input 
                    type="text" 
                    name="loteNumber"
                    className="input" 
                    placeholder="1189, 1190, etc."
                    required 
                  />
                </div>
                
                <div>
                  <label className="label">Peso Total del Lote (qq)</label>
                  <input 
                    type="number" 
                    name="totalWeight"
                    className="input" 
                    step="0.1"
                    min="0"
                    placeholder="100"
                    required 
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowNewLoteModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Crear Lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Integration Selector Modal */}
      {showIntegrationSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Seleccionar Integración de Lotes
                </h3>
                <button 
                  onClick={() => setShowIntegrationSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  console.log('📊 Estado actual de integrations:', integrations)
                  return integrations.length > 0
                })() ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {integrations.map((integration) => (
                      <div 
                        key={integration.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSelectIntegration(integration)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {integration.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            integration.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {integration.status === 'completed' ? 'Completada' : 'Borrador'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Destino:</span>
                            <span className="font-medium">{integration.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="font-medium">{integration.client}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span className="font-medium">{integration.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lotes:</span>
                            <span className="font-medium">{integration.lots.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Peso Total:</span>
                            <span className="font-medium text-green-600">{integration.totalWeight} qq</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Lotes incluidos:</div>
                          <div className="flex flex-wrap gap-1">
                            {integration.lots.slice(0, 3).map((lot) => (
                              <span key={lot.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {lot.numero_ingreso}
                              </span>
                            ))}
                            {integration.lots.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                +{integration.lots.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay integraciones disponibles
                    </h3>
                    <p className="text-gray-500">
                      Ve al módulo "Integración de Lotes" para crear una integración primero
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setShowIntegrationSelector(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte Final */}
      {showFinalReport && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reporte Final de Pesaje
                </h2>
                <button
                  onClick={handleCloseReport}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Información de la Integración */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  {selectedIntegration.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Destino:</span>
                    <p className="text-green-700">{selectedIntegration.destination}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Cliente:</span>
                    <p className="text-green-700">{selectedIntegration.client}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Fecha:</span>
                    <p className="text-green-700">{selectedIntegration.date}</p>
                  </div>
                </div>
              </div>

              {/* Resumen de Pesajes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Peso Esperado</h4>
                  <p className="text-2xl font-bold text-blue-800">
                    {selectedIntegration.totalWeight} qq
                  </p>
                  <p className="text-sm text-blue-600">
                    {(selectedIntegration.totalWeight * 100).toFixed(2)} lbs
                    </p>
                  </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Peso Registrado</h4>
                  <p className="text-2xl font-bold text-green-800">
                    {(weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0) / 100).toFixed(2)} qq
                  </p>
                  <p className="text-sm text-green-600">
                    {weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0).toFixed(2)} lbs
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Diferencia</h4>
                  {(() => {
                    const expected = selectedIntegration.totalWeight * 100
                    const actual = weighingData.reduce((sum, item) => sum + (item.netWeight || 0), 0)
                    const difference = actual - expected
                    const percentage = expected > 0 ? ((difference / expected) * 100) : 0
                    
                    return (
                      <>
                        <p className={`text-2xl font-bold ${difference >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {difference > 0 ? '+' : ''}{difference.toFixed(2)} lbs
                        </p>
                        <p className={`text-sm ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Detalles de Lotes */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalles de Lotes
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lote
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso Esperado
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedIntegration.lots.map((lot) => (
                        <tr key={lot.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {lot.numero_ingreso}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {lot.peso_quintales} qq
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {lot.tipo}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lot.estado === 'Aprobado' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lot.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Datos de Pesaje */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Datos de Pesaje Registrados
                </h4>
                {weighingData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Partida
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tara
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bultos
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peso Bruto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peso Neto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Operador
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {weighingData.map((pesaje, index) => {
                          // Encontrar la partida correspondiente
                          const partida = partidas.find(p => p.pesajes.some(pe => pe.id === pesaje.id))
                          return (
                            <tr key={pesaje.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {partida?.numeroIngreso || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  pesaje.taraType === 'yute' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {pesaje.taraType === 'yute' ? 'Yute (1.5 lbs)' : 'Nylon (1.0 lbs)'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {pesaje.bultosCount}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {(pesaje.grossWeight / 100).toFixed(2)} qq
                                <br />
                                <span className="text-xs text-gray-500">{pesaje.grossWeight.toFixed(2)} lbs</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-semibold">{(pesaje.netWeight / 100).toFixed(2)} qq</span>
                                <br />
                                <span className="text-xs text-gray-500">{pesaje.netWeight.toFixed(2)} lbs</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {pesaje.date}
                                <br />
                                <span className="text-xs text-gray-500">{pesaje.time}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {pesaje.operator}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      No se registraron pesajes individuales
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseReport}
                  className="btn btn-secondary"
                >
                  Cerrar Reporte
                </button>
                <div className="space-x-3">
                  <button
                    onClick={() => handleSaveReport(true)}
                    className="btn btn-warning"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Guardar Reporte
                  </button>
                  <button
                    onClick={() => {
                      // Función para imprimir reporte
                      window.print()
                    }}
                    className="btn btn-primary"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Imprimir Reporte
                  </button>
                  <button
                    onClick={() => {
                      // Función para exportar reporte
                      console.log('Exportar reporte')
                    }}
                    className="btn btn-success"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Exportar Datos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Formulario de Pesaje */}
      {showPesajeModal && selectedPartida && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Registrar Pesaje
                </h2>
                <button
                  onClick={handleClosePesajeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Información de la Partida */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h3 className="text-base font-semibold text-blue-900 mb-2">
                  Partida: {selectedPartida.numeroIngreso}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-blue-800">Tipo:</span>
                    <p className="text-blue-700">{selectedPartida.tipo}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Peso Esperado:</span>
                    <p className="text-blue-700">{selectedPartida.pesoEsperado} qq</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Registrado:</span>
                    <p className="text-blue-700">
                      {(selectedPartida.pesoTotalRegistrado / 100).toFixed(2)} qq
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Pesajes:</span>
                    <p className="text-blue-700">{selectedPartida.pesajes.length}</p>
                  </div>
                </div>
              </div>

              {/* Formulario de Pesaje */}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitPesaje(); }}>
                <div className="space-y-3">
                  {/* Tipo de Tara */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Tara
                    </label>
                    <div className="flex space-x-3">
                      <label className="flex items-center">
                    <input 
                          type="radio"
                          name="taraType"
                          value="yute"
                          checked={pesajeForm.taraType === 'yute'}
                          onChange={(e) => handlePesajeFormChange('taraType', e.target.value)}
                          className="mr-1"
                        />
                        <span className="text-xs text-gray-700">Yute (1.5 lbs)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="taraType"
                          value="nylon"
                          checked={pesajeForm.taraType === 'nylon'}
                          onChange={(e) => handlePesajeFormChange('taraType', e.target.value)}
                          className="mr-1"
                        />
                        <span className="text-xs text-gray-700">Nylon (1.0 lbs)</span>
                      </label>
                  </div>
                  </div>

                  {/* Peso Bruto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso Bruto (qq)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={pesajeForm.grossWeight}
                      onChange={(e) => handlePesajeFormChange('grossWeight', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0.00"
                      required 
                    />
                  </div>

                  {/* Cantidad de Bultos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad de Bultos
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={pesajeForm.bags}
                      onChange={(e) => handlePesajeFormChange('bags', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0"
                      required 
                    />
                </div>
                
                  {/* Cálculo Automático del Peso Neto */}
                  {pesajeForm.grossWeight && pesajeForm.bags && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-green-900 mb-2">
                        Cálculo Automático
                      </h4>
                      <div className="space-y-1 text-xs text-green-700">
                        <div className="flex justify-between">
                          <span>Peso Bruto:</span>
                          <span>{pesajeForm.grossWeight} qq</span>
                </div>
                        <div className="flex justify-between">
                          <span>Tara por Bulto:</span>
                          <span>{pesajeForm.taraType === 'yute' ? '1.5' : '1.0'} lbs</span>
                      </div>
                        <div className="flex justify-between">
                          <span>Total Tara:</span>
                          <span>
                            {(pesajeForm.taraType === 'yute' ? 1.5 : 1.0) * parseInt(pesajeForm.bags || '0')} lbs
                          </span>
                      </div>
                        <div className="flex justify-between font-semibold border-t border-green-300 pt-1">
                          <span>Peso Neto:</span>
                          <span>
                            {calculateNetWeight(
                              parseFloat(pesajeForm.grossWeight || '0') * 100, // Convertir quintales a libras
                              parseInt(pesajeForm.bags || '0'),
                              pesajeForm.taraType
                            ).toFixed(2)} lbs
                          </span>
                    </div>
                        <div className="flex justify-between text-xs text-green-600">
                          <span>En Quintales:</span>
                          <span>
                            {(calculateNetWeight(
                              parseFloat(pesajeForm.grossWeight || '0') * 100,
                              parseInt(pesajeForm.bags || '0'),
                              pesajeForm.taraType
                            ) / 100).toFixed(2)} qq
                          </span>
                      </div>
                    </div>
                      </div>
                  )}

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (Opcional)
                    </label>
                    <textarea
                      value={pesajeForm.notes}
                      onChange={(e) => handlePesajeFormChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                  <button 
                    type="button"
                    onClick={handleClosePesajeModal}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Registrar Pesaje
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Pesaje Mejorado */}
      {showWeighingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Agregar Pesaje</h3>
                <button
                  onClick={() => {
                    setShowWeighingModal(false)
                    setSelectedPartidaForWeighing(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); addWeighing(); }} className="space-y-4">
                {/* Selector de Partida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Partida
                  </label>
                  <select
                    value={selectedPartidaForWeighing?.id || ''}
                    onChange={(e) => {
                      const partida = partidas.find(p => p.id === e.target.value)
                      setSelectedPartidaForWeighing(partida || null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecciona una partida...</option>
                    {partidas.map((partida) => (
                      <option key={partida.id} value={partida.id}>
                        {partida.numeroIngreso} - {partida.pesoEsperado} qq esperados
                      </option>
                    ))}
                  </select>
                </div>

                {/* Información de la partida seleccionada */}
                {selectedPartidaForWeighing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Partida: {selectedPartidaForWeighing.numeroIngreso}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-blue-800">Peso Esperado:</span>
                        <p className="text-blue-700">{selectedPartidaForWeighing.pesoEsperado} qq</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Registrado:</span>
                        <p className="text-blue-700">
                          {(selectedPartidaForWeighing.pesoTotalRegistrado / 100).toFixed(2)} qq
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Pesajes:</span>
                        <p className="text-blue-700">{selectedPartidaForWeighing.pesajes.length}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Estado:</span>
                        <p className={`font-medium ${selectedPartidaForWeighing.isCompleted ? 'text-green-700' : 'text-yellow-700'}`}>
                          {selectedPartidaForWeighing.isCompleted ? 'Completada' : 'En Progreso'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Bruto (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weighingForm.pesoBruto}
                    onChange={(e) => setWeighingForm({...weighingForm, pesoBruto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Bultos
                  </label>
                  <input
                    type="number"
                    value={weighingForm.bultos}
                    onChange={(e) => setWeighingForm({...weighingForm, bultos: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tara Total (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weighingForm.tara}
                    onChange={(e) => setWeighingForm({...weighingForm, tara: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operador
                  </label>
                  <select
                    value={weighingForm.operador}
                    onChange={(e) => setWeighingForm({...weighingForm, operador: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Operador 1">Operador 1</option>
                    <option value="Operador 2">Operador 2</option>
                    <option value="Operador 3">Operador 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={weighingForm.observaciones}
                    onChange={(e) => setWeighingForm({...weighingForm, observaciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                {/* Cálculo automático del peso neto */}
                {weighingForm.pesoBruto && weighingForm.tara && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Peso Neto Calculado:</span>
                      <span className="text-lg font-bold text-green-900">
                        {(parseFloat(weighingForm.pesoBruto || '0') - parseFloat(weighingForm.tara || '0')).toFixed(2)} lbs
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWeighingModal(false)
                      setSelectedPartidaForWeighing(null)
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Agregar Pesaje
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
