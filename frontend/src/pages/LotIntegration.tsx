import React, { useState, useEffect } from 'react'
import { 
  ArrowsRightLeftIcon,
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  TagIcon,
  ScaleIcon,
  BeakerIcon,
  TruckIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Lot {
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

interface Pesaje {
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

interface Integration {
  id: number
  name: string
  destination: string
  client: string
  date: string
  status: 'draft' | 'completed' | 'weighing' | 'shipped'
  totalWeight: number // en quintales
  lots: Lot[]
  createdAt: string
  pesajes: Pesaje[]
  currentIngresoId?: string
  pesoRegistrado: number // en lbs
}

export default function LotIntegration() {
  const [activeTab, setActiveTab] = useState('integrations')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [commercialLots, setCommercialLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedLots, setSelectedLots] = useState<Lot[]>([])
  const [integrationName, setIntegrationName] = useState('')
  const [integrationDestination, setIntegrationDestination] = useState('')
  const [integrationClient, setIntegrationClient] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [integrationToDelete, setIntegrationToDelete] = useState<number | null>(null)
  
  // Estados para el sistema de pesaje
  const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null)
  const [showPesajeModal, setShowPesajeModal] = useState(false)
  const [pesajeForm, setPesajeForm] = useState({
    pesoBruto: '',
    tara: '',
    observaciones: '',
    operador: 'Operador 1'
  })

  useEffect(() => {
    loadIntegrations()
    loadCommercialLots()
  }, [])

  const loadIntegrations = () => {
    try {
      const storedIntegrations = localStorage.getItem('lotIntegrations')
      if (storedIntegrations) {
        setIntegrations(JSON.parse(storedIntegrations))
      } else {
        setIntegrations([])
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
      setIntegrations([])
    }
    setLoading(false)
  }

  const loadCommercialLots = () => {
    try {
      const storedLots = localStorage.getItem('cattedLots')
      const integratedLotsIds = localStorage.getItem('integratedLots')
      
      if (storedLots) {
        const lots: any[] = JSON.parse(storedLots)
        const integratedIds = integratedLotsIds ? JSON.parse(integratedLotsIds) : []
        
        // Normalizar la estructura de los lotes para asegurar que tengan lot_id
        const normalizedLots = lots.map(lot => ({
          ...lot,
          lot_id: lot.lot_id || lot.id, // Usar lot_id si existe, sino usar id
          id: lot.id || lot.lot_id // Asegurar que id también esté disponible
        }))
        
        // Filtrar solo lotes aprobados que no estén ya integrados
        const availableLots = normalizedLots.filter(lot => {
          const isApproved = lot.estado === 'Aprobado'
          const isNotIntegrated = !integratedIds.includes(lot.lot_id)
          return isApproved && isNotIntegrated
        })
        
        setCommercialLots(availableLots)
      } else {
        setCommercialLots([])
      }
    } catch (error) {
      console.error('Error loading commercial lots:', error)
      setCommercialLots([])
    }
  }

  const saveIntegrations = (updatedIntegrations: Integration[]) => {
    localStorage.setItem('lotIntegrations', JSON.stringify(updatedIntegrations))
    setIntegrations(updatedIntegrations)
  }

  const markLotsAsIntegrated = (lotIds: string[]) => {
    const existingIntegrated = localStorage.getItem('integratedLots')
    const integratedIds = existingIntegrated ? JSON.parse(existingIntegrated) : []
    const newIntegrated = [...integratedIds, ...lotIds]
    localStorage.setItem('integratedLots', JSON.stringify(newIntegrated))
  }

  const handleCreateIntegration = () => {
    if (!integrationName.trim() || !integrationDestination.trim() || !integrationClient.trim()) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    if (selectedLots.length === 0) {
      alert('Por favor seleccione al menos un lote para la integración')
      return
    }

    const newIntegration: Integration = {
      id: Math.max(...integrations.map(i => i.id), 0) + 1,
      name: integrationName,
      destination: integrationDestination,
      client: integrationClient,
      date: new Date().toISOString(),
    status: 'draft',
      totalWeight: selectedLots.reduce((total, lot) => total + lot.peso_quintales, 0),
      lots: selectedLots,
      createdAt: new Date().toISOString()
    }

    const updatedIntegrations = [...integrations, newIntegration]
    saveIntegrations(updatedIntegrations)

    // Marcar lotes como integrados
    markLotsAsIntegrated(selectedLots.map(lot => lot.lot_id))

    // Limpiar formulario
    setIntegrationName('')
    setIntegrationDestination('')
    setIntegrationClient('')
    setSelectedLots([])
    setShowModal(false)
    
    // Recargar lotes disponibles
    loadCommercialLots()
  }

  const handleViewDetails = (integration: Integration) => {
    // Mostrar detalles de la integración
    toast.success(`Ver detalles de: ${integration.name}`, {
      duration: 3000,
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0',
      },
      icon: '👁️',
    })
  }

  const handleRegisterWeights = (integration: Integration) => {
    // Iniciar pesaje directamente en esta página
    startWeighing(integration)
  }

  const handleDeleteIntegration = (id: number) => {
    setIntegrationToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (integrationToDelete) {
      const integration = integrations.find(i => i.id === integrationToDelete)
      if (integration) {
        // Restaurar lotes como disponibles
        const existingIntegrated = localStorage.getItem('integratedLots')
        const integratedIds = existingIntegrated ? JSON.parse(existingIntegrated) : []
        const lotIds = integration.lots.map(lot => lot.lot_id)
        const newIntegrated = integratedIds.filter((id: string) => !lotIds.includes(id))
        localStorage.setItem('integratedLots', JSON.stringify(newIntegrated))
        
        // Eliminar integración
        const updatedIntegrations = integrations.filter(i => i.id !== integrationToDelete)
        saveIntegrations(updatedIntegrations)
        
        // Recargar lotes disponibles
        loadCommercialLots()
      }
      setShowDeleteConfirm(false)
      setIntegrationToDelete(null)
    }
  }

  // Funciones para el sistema de pesaje
  const startWeighing = (integration: Integration) => {
    // Inicializar la integración con datos de pesaje si no los tiene
    const integrationWithPesaje = {
      ...integration,
      status: 'weighing' as const,
      pesajes: integration.pesajes || [],
      pesoRegistrado: integration.pesoRegistrado || 0,
      currentIngresoId: integration.currentIngresoId || integration.lots[0]?.lot_id
    }
    setActiveIntegration(integrationWithPesaje)
    
    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === integration.id ? integrationWithPesaje : i
    )
    saveIntegrations(updatedIntegrations)
    setIntegrations(updatedIntegrations)
  }

  const addPesaje = () => {
    if (!activeIntegration) return

    const pesoBruto = parseFloat(pesajeForm.pesoBruto)
    const tara = parseFloat(pesajeForm.tara)
    
    if (isNaN(pesoBruto) || isNaN(tara) || pesoBruto <= 0 || tara < 0) {
      toast.error('Por favor ingresa valores válidos para peso bruto y tara')
      return
    }

    const pesoNeto = pesoBruto - tara
    const newPesaje: Pesaje = {
      id: Date.now().toString(),
      ingresoId: activeIntegration.currentIngresoId || '',
      pesoBruto,
      tara,
      pesoNeto,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      operador: pesajeForm.operador,
      observaciones: pesajeForm.observaciones
    }

    const updatedPesajes = [...activeIntegration.pesajes, newPesaje]
    const totalPesoRegistrado = updatedPesajes.reduce((sum, p) => sum + p.pesoNeto, 0)

    const updatedIntegration = {
      ...activeIntegration,
      pesajes: updatedPesajes,
      pesoRegistrado: totalPesoRegistrado
    }

    setActiveIntegration(updatedIntegration)
    setPesajeForm({ pesoBruto: '', tara: '', observaciones: '', operador: 'Operador 1' })
    setShowPesajeModal(false)

    // Actualizar en el localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === activeIntegration.id ? updatedIntegration : i
    )
    saveIntegrations(updatedIntegrations)
    setIntegrations(updatedIntegrations)

    toast.success('Pesaje agregado exitosamente')
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
    saveIntegrations(updatedIntegrations)
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
    saveIntegrations(updatedIntegrations)
    setIntegrations(updatedIntegrations)

    toast.success('Pesaje finalizado exitosamente')
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
    saveIntegrations(updatedIntegrations)
    setIntegrations(updatedIntegrations)
    setActiveIntegration(null)

    toast.success('Pesaje cancelado')
  }

  const getProgressPercentage = () => {
    if (!activeIntegration) return 0
    const totalWeightLbs = activeIntegration.totalWeight * 100 // Convertir quintales a lbs
    return Math.min((activeIntegration.pesoRegistrado / totalWeightLbs) * 100, 100)
  }

  const toggleLotSelection = (lot: Lot) => {
    setSelectedLots(prev => {
      // Usar el id único del lote para la comparación
      const lotUniqueId = lot.id || lot.lot_id
      const isSelected = prev.some(l => (l.id || l.lot_id) === lotUniqueId)
      if (isSelected) {
        return prev.filter(l => (l.id || l.lot_id) !== lotUniqueId)
      } else {
        return [...prev, lot]
      }
    })
  }

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.destination.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalWeight = selectedLots.reduce((sum, lot) => sum + lot.peso_quintales, 0)

  const tabs = [
    { id: 'integrations', name: 'Integraciones', icon: ArrowsRightLeftIcon, count: integrations.length },
    { id: 'commercial', name: 'Lotes Catados', icon: BeakerIcon, count: commercialLots.length },
    { id: 'analytics', name: 'Analíticas', icon: ChartBarIcon, count: 0 }
  ]

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Integración de Lotes</h1>
        <p className="text-gray-600">Gestión de integraciones para envío de lotes catados</p>
        </div>

      {/* Pesaje en Progreso */}
      {activeIntegration && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <ScaleIcon className="h-6 w-6 text-white" />
                </div>
        <div>
                  <h2 className="text-xl font-bold text-gray-900">⚖️ Pesaje en Progreso</h2>
                  <p className="text-sm text-gray-600">Integración: {activeIntegration.name}</p>
        </div>
              </div>
              <div className="flex gap-3">
        <button
                  onClick={finishWeighing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
        >
                  <CheckIcon className="h-4 w-4" />
                  Finalizar Pesaje
        </button>
                <button
                  onClick={cancelWeighing}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancelar Pesaje
                </button>
              </div>
            </div>

            {/* Información de la integración */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-semibold text-gray-900">{activeIntegration.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-900">{activeIntegration.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso Total</p>
                  <p className="font-semibold text-gray-900">{activeIntegration.totalWeight} qq</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pesajes</p>
                  <p className="font-semibold text-gray-900">{activeIntegration.pesajes.length}</p>
                </div>
              </div>
              
              {/* Selector de Ingreso */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingreso a Pesar
                </label>
                <select
                  value={activeIntegration.currentIngresoId || ''}
                  onChange={(e) => changeIngreso(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {activeIntegration.lots.map((lot) => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      {lot.numero_ingreso} - {lot.peso_quintales} qq
                    </option>
                  ))}
                </select>
              </div>

              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso del Pesaje</span>
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
                  <span>Peso registrado: {activeIntegration.pesoRegistrado.toFixed(2)} lbs</span>
                  <span>Total: {(activeIntegration.totalWeight * 100).toFixed(0)} lbs</span>
                </div>
              </div>

              {/* Botón Agregar Pesaje */}
              <div className="text-center">
                <button
                  onClick={() => setShowPesajeModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Agregar Pesaje
                </button>
              </div>
            </div>

            {/* Tabla de Pesajes */}
            {activeIntegration.pesajes.length > 0 && (
              <div className="bg-white rounded-lg overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                  Historial de Pesajes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingreso
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso Bruto
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
                      {activeIntegration.pesajes.map((pesaje) => {
                        const ingreso = activeIntegration.lots.find(l => l.lot_id === pesaje.ingresoId)
                        return (
                          <tr key={pesaje.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ingreso?.numero_ingreso || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {pesaje.fecha} {pesaje.hora}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pesaje.pesoBruto.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pesaje.tara.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                              {pesaje.pesoNeto.toFixed(2)} lbs
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {pesaje.operador}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <ArrowsRightLeftIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-blue-700">Integraciones</p>
              <p className="text-3xl font-bold text-blue-900">{integrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <BeakerIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-green-700">Lotes Disponibles</p>
              <p className="text-3xl font-bold text-green-900">{commercialLots.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <ScaleIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-purple-700">Peso Total</p>
              <p className="text-3xl font-bold text-purple-900">
                {integrations.reduce((sum, i) => sum + i.totalWeight, 0)} qq
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <CheckIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-orange-700">Completadas</p>
              <p className="text-3xl font-bold text-orange-900">
                {integrations.filter(i => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
            <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
            </button>
              )
            })}
        </nav>
      </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
      {activeTab === 'integrations' && (
            <div>
              {/* Filtros y búsqueda */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar integraciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700"
                />
              </div>
                </div>
                <div className="flex gap-3">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 min-w-[180px]"
                  >
                    <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="completed">Completada</option>
                </select>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 shadow-lg transition-all duration-200"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Integración
                  </button>
            </div>
          </div>

              {/* Lista de integraciones */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredIntegrations.map((integration) => (
                  <div key={integration.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                          <ArrowsRightLeftIcon className="h-6 w-6 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                          <p className="text-sm text-gray-500">ID: {integration.id}</p>
            </div>
          </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          integration.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.status === 'completed' ? 'Completada' : 'Borrador'}
                      </span>
                        <button
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                    </div>
                    
                    {/* Información de la integración */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <div>
                          <p className="text-sm text-gray-500">Destino</p>
                          <p className="font-semibold text-gray-900">{integration.destination}</p>
                      </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-semibold text-gray-900">{integration.client}</p>
                      </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                          <p className="text-sm text-gray-500">Fecha</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(integration.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                      <div className="flex items-center gap-3">
                        <ScaleIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Peso Total</p>
                          <p className="font-semibold text-gray-900">{integration.totalWeight} qq</p>
                      </div>
                      </div>
                    </div>

                    {/* Lotes incluidos */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Lotes Incluidos ({integration.lots.length})</h4>
                        <div className="space-y-2">
                        {integration.lots.map((lot, index) => (
                          <div key={lot.lot_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                              <TagIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                <p className="font-medium text-gray-900">{lot.numero_ingreso}</p>
                                <p className="text-sm text-gray-500">{lot.catador} - {lot.tipo}</p>
                                </div>
                              </div>
                                <div className="text-right">
                              <p className="font-semibold text-gray-900">{lot.peso_quintales} qq</p>
                              <p className="text-sm text-gray-500">{lot.estado}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                  </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                    <button
                        onClick={() => handleViewDetails(integration)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver Detalles
                    </button>
                    <button
                        onClick={() => handleRegisterWeights(integration)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
                    >
                        <ScaleIcon className="h-4 w-4" />
                        Registrar Pesos
                    </button>
                    </div>
                            </div>
                          ))}
                        </div>

              {filteredIntegrations.length === 0 && (
                <div className="text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <ArrowsRightLeftIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay integraciones registradas</h3>
                  <p className="text-gray-500 mb-6">Comienza creando una nueva integración con lotes catados aprobados.</p>
                    <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 mx-auto shadow-lg transition-all duration-200"
                    >
                    <PlusIcon className="h-5 w-5" />
                    Crear Primera Integración
                    </button>
                  </div>
              )}
                </div>
          )}

          {activeTab === 'commercial' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lotes Catados Disponibles</h3>
                <p className="text-gray-600">Lotes aprobados en catación comercial que pueden ser integrados</p>
              </div>

              {commercialLots.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {commercialLots.map((lot) => (
                    <div key={lot.lot_id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{lot.numero_ingreso}</h4>
                          <p className="text-sm text-gray-500">ID: {lot.lot_id}</p>
          </div>
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          {lot.estado}
                        </span>
          </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Peso</p>
                          <p className="font-semibold text-gray-900">{lot.peso_quintales} qq</p>
              </div>
                        <div>
                          <p className="text-sm text-gray-500">Tipo</p>
                          <p className="font-semibold text-gray-900">{lot.tipo}</p>
              </div>
                        <div>
                          <p className="text-sm text-gray-500">Catador</p>
                          <p className="font-semibold text-gray-900">{lot.catador}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(lot.fecha_catacion).toLocaleDateString()}
                          </p>
            </div>
          </div>

                      {lot.observaciones && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">Observaciones:</span> {lot.observaciones}
                          </p>
                        </div>
                      )}
              </div>
            ))}
          </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <BeakerIcon className="h-12 w-12 text-gray-400" />
          </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay lotes disponibles</h3>
                  <p className="text-gray-500 mb-6">No hay lotes catados aprobados disponibles para integración.</p>
                </div>
              )}
            </div>
      )}

      {activeTab === 'analytics' && (
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analíticas de Integración</h3>
              <p className="text-gray-500">Próximamente: Gráficos y estadísticas de integraciones</p>
        </div>
      )}
        </div>
      </div>

      {/* Modal para crear nueva integración */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Integración</h3>
                <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedLots([])
                  setIntegrationName('')
                  setIntegrationDestination('')
                  setIntegrationClient('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

            <div className="p-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de la Integración *
                  </label>
                <input
                  type="text"
                    required
                    value={integrationName}
                    onChange={(e) => setIntegrationName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Integración Premium 2025-01"
                />
              </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destino *
                  </label>
                  <input
                    type="text"
                    required
                    value={integrationDestination}
                    onChange={(e) => setIntegrationDestination(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Estados Unidos, Miami"
                  />
              </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={integrationClient}
                    onChange={(e) => setIntegrationClient(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Coffee Importers Inc."
                  />
            </div>
          </div>

              {/* Resumen de selección */}
              {selectedLots.length > 0 && (
                <div className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-4">
                    Resumen de la Integración
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                      <p className="text-sm text-green-700">Lotes Seleccionados</p>
                      <p className="text-2xl font-bold text-green-900">{selectedLots.length}</p>
                        </div>
                    <div>
                      <p className="text-sm text-green-700">Peso Total</p>
                      <p className="text-2xl font-bold text-green-900">{totalWeight} qq</p>
                        </div>
                <div>
                      <p className="text-sm text-green-700">Fecha de Creación</p>
                      <p className="text-2xl font-bold text-green-900">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de lotes */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Seleccionar Lotes Catados ({commercialLots.length} disponibles)
                </h4>
                
                {commercialLots.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {commercialLots.map((lot) => {
                      const lotUniqueId = lot.id || lot.lot_id
                      const isSelected = selectedLots.some(l => (l.id || l.lot_id) === lotUniqueId)
                      return (
                        <div
                          key={lotUniqueId}
                          onClick={() => toggleLotSelection(lot)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{lot.numero_ingreso}</h5>
                                <p className="text-sm text-gray-500">{lot.catador} - {lot.tipo}</p>
            </div>
          </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{lot.peso_quintales} qq</p>
                              <p className="text-sm text-gray-500">{lot.estado}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay lotes disponibles</h3>
                    <p className="text-gray-500">No hay lotes catados aprobados para seleccionar.</p>
        </div>
      )}
              </div>
                </div>

            <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
                          <button
                  onClick={() => {
                  setShowModal(false)
                  setSelectedLots([])
                  setIntegrationName('')
                  setIntegrationDestination('')
                  setIntegrationClient('')
                }}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                          </button>
                          <button
                onClick={handleCreateIntegration}
                disabled={selectedLots.length === 0 || !integrationName.trim() || !integrationDestination.trim() || !integrationClient.trim()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                    Crear Integración
                          </button>
                        </div>
            </div>
          </div>
      )}

      {/* Modal de Agregar Pesaje */}
      {showPesajeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Agregar Pesaje</h3>
                <button
                  onClick={() => setShowPesajeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); addPesaje(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Bruto (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pesajeForm.pesoBruto}
                    onChange={(e) => setPesajeForm({...pesajeForm, pesoBruto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tara (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pesajeForm.tara}
                    onChange={(e) => setPesajeForm({...pesajeForm, tara: e.target.value})}
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
                    value={pesajeForm.operador}
                    onChange={(e) => setPesajeForm({...pesajeForm, operador: e.target.value})}
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
                    value={pesajeForm.observaciones}
                    onChange={(e) => setPesajeForm({...pesajeForm, observaciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPesajeModal(false)}
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
                        <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
                  <p className="text-gray-600">Esta acción no se puede deshacer</p>
                        </div>
                      </div>
                      
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar esta integración? Los lotes volverán a estar disponibles para nuevas integraciones.
              </p>
              
              <div className="flex justify-end gap-4">
                        <button
                          onClick={() => {
                    setShowDeleteConfirm(false)
                    setIntegrationToDelete(null)
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                        <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Eliminar
                        </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}