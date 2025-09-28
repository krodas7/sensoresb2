import React, { useState } from 'react'
import { 
  ClipboardDocumentListIcon,
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

// Interfaces
interface MaterialRequest {
  id: number
  type: 'herrería' | 'electricidad'
  title: string
  description: string
  materials: Material[]
  requestedBy: string
  requestedDate: string
  priority: 'baja' | 'media' | 'alta' | 'urgente'
  status: 'pendiente' | 'aprobado' | 'en_proceso' | 'completado' | 'rechazado'
  approvedBy?: string
  approvedDate?: string
  completedDate?: string
  estimatedCost: number
  actualCost?: number
  notes?: string
  createdAt: string
}

interface Material {
  id: number
  name: string
  description: string
  quantity: number
  unit: string
  estimatedPrice: number
  actualPrice?: number
  supplier?: string
}

interface FoodTicket {
  id: number
  shift: 'día' | 'noche'
  date: string
  employees: Array<{
    id: string
    name: string
    employeeId?: string
  }>
  mealType: 'desayuno' | 'almuerzo' | 'cena' | 'refrigerio'
  unitCost: number
  totalAmount: number
  employeeCount: number
  description: string
  status: 'pendiente' | 'aprobado' | 'pagado'
  approvedBy?: string
  approvedDate?: string
  paidDate?: string
  paymentDocuments?: Array<{
    id: string
    name: string
    type: 'image' | 'pdf'
    url: string
    uploadedAt: string
  }>
  paymentReference?: string
  paymentMethod?: 'efectivo' | 'transferencia' | 'cheque'
  createdAt: string
}

interface PaymentTicket {
  id: number
  type: 'hora' | 'día'
  workerName: string
  workerId?: string
  workDescription: string
  hours?: number
  days?: number
  ratePerHour?: number
  ratePerDay?: number
  totalAmount: number
  workDate: string
  status: 'pendiente' | 'aprobado' | 'pagado'
  approvedBy?: string
  approvedDate?: string
  paidDate?: string
  notes?: string
  createdAt: string
}

export default function Gestions() {
  const [activeTab, setActiveTab] = useState<'materials' | 'food' | 'payments'>('materials')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<'material' | 'food' | 'payment'>('material')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false)
  const [selectedTicketsForPayment, setSelectedTicketsForPayment] = useState<number[]>([])
  const [paymentFiles, setPaymentFiles] = useState<File[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'cheque'>('efectivo')
  const [paymentReference, setPaymentReference] = useState('')

  // Lista de empleados disponibles
  const availableEmployees = [
    { id: '1', name: 'Juan Pérez', employeeId: 'EMP001' },
    { id: '2', name: 'María García', employeeId: 'EMP002' },
    { id: '3', name: 'Carlos López', employeeId: 'EMP003' },
    { id: '4', name: 'Ana Rodríguez', employeeId: 'EMP004' },
    { id: '5', name: 'Luis Martínez', employeeId: 'EMP005' },
    { id: '6', name: 'Carmen Silva', employeeId: 'EMP006' },
    { id: '7', name: 'Roberto Díaz', employeeId: 'EMP007' },
    { id: '8', name: 'Elena Vargas', employeeId: 'EMP008' },
    { id: '9', name: 'Miguel Torres', employeeId: 'EMP009' },
    { id: '10', name: 'Isabel Morales', employeeId: 'EMP010' },
  ]

  // Sample data
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([
    {
      id: 1,
      type: 'herrería',
      title: 'Reparación de Portón Principal',
      description: 'Soldadura y refuerzo del portón principal del almacén',
      materials: [
        { id: 1, name: 'Varilla de acero 1/2"', description: 'Varilla de 6 metros', quantity: 4, unit: 'unidades', estimatedPrice: 25.00, supplier: 'Ferretería Central' },
        { id: 2, name: 'Electrodo 6013', description: 'Electrodo para soldadura', quantity: 2, unit: 'kg', estimatedPrice: 15.00, supplier: 'Ferretería Central' },
        { id: 3, name: 'Pintura anticorrosiva', description: 'Pintura roja anticorrosiva', quantity: 1, unit: 'galón', estimatedPrice: 35.00, supplier: 'Ferretería Central' }
      ],
      requestedBy: 'Juan Pérez',
      requestedDate: '2024-01-15',
      priority: 'alta',
      status: 'aprobado',
      approvedBy: 'María García',
      approvedDate: '2024-01-16',
      estimatedCost: 75.00,
      actualCost: 78.50,
      notes: 'Trabajo completado satisfactoriamente',
      createdAt: '2024-01-15T08:30:00Z'
    },
    {
      id: 2,
      type: 'electricidad',
      title: 'Instalación de Luminarias LED',
      description: 'Instalación de 8 luminarias LED en el área de procesamiento',
      materials: [
        { id: 4, name: 'Luminaria LED 50W', description: 'Luminaria industrial LED', quantity: 8, unit: 'unidades', estimatedPrice: 45.00, supplier: 'Electrocom' },
        { id: 5, name: 'Cable THW 12 AWG', description: 'Cable eléctrico', quantity: 50, unit: 'metros', estimatedPrice: 2.50, supplier: 'Electrocom' },
        { id: 6, name: 'Tubería EMT 1/2"', description: 'Tubería metálica', quantity: 30, unit: 'metros', estimatedPrice: 8.00, supplier: 'Electrocom' }
      ],
      requestedBy: 'Carlos López',
      requestedDate: '2024-01-20',
      priority: 'media',
      status: 'en_proceso',
      approvedBy: 'María García',
      approvedDate: '2024-01-21',
      estimatedCost: 450.00,
      notes: 'En proceso de instalación',
      createdAt: '2024-01-20T10:15:00Z'
    }
  ])

  const [foodTickets, setFoodTickets] = useState<FoodTicket[]>([
    {
      id: 1,
      shift: 'día',
      date: '2024-01-15',
      employees: [
        { id: '4', name: 'Ana Rodríguez', employeeId: 'EMP004' },
        { id: '5', name: 'Luis Martínez', employeeId: 'EMP005' }
      ],
      mealType: 'almuerzo',
      unitCost: 12.50,
      totalAmount: 25.00,
      employeeCount: 2,
      description: 'Almuerzo en comedor local',
      status: 'pagado',
      approvedBy: 'María García',
      approvedDate: '2024-01-15T12:00:00Z',
      paidDate: '2024-01-15T14:30:00Z',
      createdAt: '2024-01-15T11:45:00Z'
    },
    {
      id: 2,
      shift: 'noche',
      date: '2024-01-15',
      employees: [
        { id: '7', name: 'Roberto Díaz', employeeId: 'EMP007' }
      ],
      mealType: 'cena',
      unitCost: 15.00,
      totalAmount: 15.00,
      employeeCount: 1,
      description: 'Cena en restaurante 24h',
      status: 'aprobado',
      approvedBy: 'María García',
      approvedDate: '2024-01-15T18:00:00Z',
      createdAt: '2024-01-15T17:30:00Z'
    }
  ])

  const [paymentTickets, setPaymentTickets] = useState<PaymentTicket[]>([
    {
      id: 1,
      type: 'hora',
      workerName: 'Roberto Silva',
      workerId: 'EXT001',
      workDescription: 'Carga de trailer con café procesado',
      hours: 6,
      ratePerHour: 8.50,
      totalAmount: 51.00,
      workDate: '2024-01-15',
      status: 'pagado',
      approvedBy: 'María García',
      approvedDate: '2024-01-15T16:00:00Z',
      paidDate: '2024-01-15T17:00:00Z',
      notes: 'Trabajo de carga nocturna',
      createdAt: '2024-01-15T15:30:00Z'
    },
    {
      id: 2,
      type: 'día',
      workerName: 'Miguel Torres',
      workDescription: 'Limpieza general de instalaciones',
      days: 2,
      ratePerDay: 60.00,
      totalAmount: 120.00,
      workDate: '2024-01-16',
      status: 'aprobado',
      approvedBy: 'María García',
      approvedDate: '2024-01-16T09:00:00Z',
      notes: 'Limpieza post-procesamiento',
      createdAt: '2024-01-16T08:00:00Z'
    }
  ])

  // CRUD Functions
  const handleAddItem = (itemData: any) => {
    if (modalType === 'material') {
      const newItem: MaterialRequest = {
        ...itemData,
        id: Math.max(...materialRequests.map(r => r.id), 0) + 1,
        createdAt: new Date().toISOString()
      }
      setMaterialRequests(prev => [...prev, newItem])
    } else if (modalType === 'food') {
      const selectedEmployeesData = getSelectedEmployeesData()
      const unitCost = parseFloat(itemData.unitCost) || 0
      const employeeCount = selectedEmployeesData.length
      const totalAmount = unitCost * employeeCount
      
      const newItem: FoodTicket = {
        ...itemData,
        employees: selectedEmployeesData,
        unitCost,
        totalAmount,
        employeeCount,
        id: Math.max(...foodTickets.map(t => t.id), 0) + 1,
        createdAt: new Date().toISOString()
      }
      setFoodTickets(prev => [...prev, newItem])
    } else if (modalType === 'payment') {
      const newItem: PaymentTicket = {
        ...itemData,
        id: Math.max(...paymentTickets.map(t => t.id), 0) + 1,
        createdAt: new Date().toISOString()
      }
      setPaymentTickets(prev => [...prev, newItem])
    }
    setShowAddModal(false)
    setSelectedEmployees([]) // Limpiar selección después de crear
  }

  const handleEditItem = (itemData: any) => {
    if (modalType === 'material') {
      setMaterialRequests(prev => prev.map(r => 
        r.id === editingItem.id ? { ...r, ...itemData } : r
      ))
    } else if (modalType === 'food') {
      const selectedEmployeesData = getSelectedEmployeesData()
      const unitCost = parseFloat(itemData.unitCost) || 0
      const employeeCount = selectedEmployeesData.length
      const totalAmount = unitCost * employeeCount
      
      setFoodTickets(prev => prev.map(t => 
        t.id === editingItem.id ? { 
          ...t, 
          ...itemData,
          employees: selectedEmployeesData,
          unitCost,
          totalAmount,
          employeeCount
        } : t
      ))
    } else if (modalType === 'payment') {
      setPaymentTickets(prev => prev.map(t => 
        t.id === editingItem.id ? { ...t, ...itemData } : t
      ))
    }
    setShowEditModal(false)
    setEditingItem(null)
    setSelectedEmployees([]) // Limpiar selección después de editar
  }

  const handleDeleteItem = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      if (activeTab === 'materials') {
        setMaterialRequests(prev => prev.filter(r => r.id !== id))
      } else if (activeTab === 'food') {
        setFoodTickets(prev => prev.filter(t => t.id !== id))
      } else if (activeTab === 'payments') {
        setPaymentTickets(prev => prev.filter(t => t.id !== id))
      }
    }
  }

  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: any) => {
    setEditingItem(item)
    setModalType(activeTab === 'materials' ? 'material' : activeTab === 'food' ? 'food' : 'payment')
    
    // Si es un food ticket, cargar empleados seleccionados
    if (activeTab === 'food' && item.employees) {
      setSelectedEmployees(item.employees.map((emp: any) => emp.id))
    } else {
      setSelectedEmployees([])
    }
    
    setShowEditModal(true)
  }

  const handleAddClick = () => {
    setModalType(activeTab === 'materials' ? 'material' : activeTab === 'food' ? 'food' : 'payment')
    setSelectedEmployees([]) // Limpiar selección al abrir modal
    setShowAddModal(true)
  }

  // Funciones para manejo de empleados
  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSelectAllEmployees = () => {
    setSelectedEmployees(availableEmployees.map(emp => emp.id))
  }

  const handleDeselectAllEmployees = () => {
    setSelectedEmployees([])
  }

  const getSelectedEmployeesData = () => {
    return availableEmployees.filter(emp => selectedEmployees.includes(emp.id))
  }

  // Funciones para pagos masivos
  const handleTicketSelection = (ticketId: number) => {
    setSelectedTicketsForPayment(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleSelectAllTickets = () => {
    const pendingTickets = foodTickets.filter(t => t.status === 'aprobado').map(t => t.id)
    setSelectedTicketsForPayment(pendingTickets)
  }

  const handleDeselectAllTickets = () => {
    setSelectedTicketsForPayment([])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'application/pdf'
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB max
      return isValidType && isValidSize
    })
    setPaymentFiles(prev => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number) => {
    setPaymentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleBulkPayment = () => {
    if (selectedTicketsForPayment.length === 0) {
      alert('Selecciona al menos un ticket para pagar')
      return
    }

    if (paymentMethod !== 'efectivo' && !paymentReference.trim()) {
      alert('Ingresa la referencia de pago')
      return
    }

    // Procesar pagos
    const updatedTickets = foodTickets.map(ticket => {
      if (selectedTicketsForPayment.includes(ticket.id)) {
        const paymentDocuments = paymentFiles.map((file, index) => ({
          id: `doc_${Date.now()}_${index}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' as const : 'pdf' as const,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
        }))

        return {
          ...ticket,
          status: 'pagado' as const,
          paidDate: new Date().toISOString(),
          paymentDocuments,
          paymentReference: paymentReference.trim() || undefined,
          paymentMethod
        }
      }
      return ticket
    })

    setFoodTickets(updatedTickets)
    setShowBulkPaymentModal(false)
    setSelectedTicketsForPayment([])
    setPaymentFiles([])
    setPaymentReference('')
    setPaymentMethod('efectivo')
    
    alert(`Se procesaron ${selectedTicketsForPayment.length} pagos exitosamente`)
  }

  // Stats
  const stats = {
    totalMaterialRequests: materialRequests.length,
    pendingMaterialRequests: materialRequests.filter(r => r.status === 'pendiente').length,
    totalFoodTickets: foodTickets.length,
    pendingFoodTickets: foodTickets.filter(t => t.status === 'pendiente').length,
    totalPaymentTickets: paymentTickets.length,
    pendingPaymentTickets: paymentTickets.filter(t => t.status === 'pendiente').length,
    totalPendingAmount: [
      ...foodTickets.filter(t => t.status === 'pendiente'),
      ...paymentTickets.filter(t => t.status === 'pendiente')
    ].reduce((sum, item) => sum + (item.totalAmount || item.amount || 0), 0)
  }

  // Filter functions
  const filteredMaterialRequests = materialRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || request.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const filteredFoodTickets = foodTickets.filter(ticket => {
    const matchesSearch = ticket.employees.some(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || ticket.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const filteredPaymentTickets = paymentTickets.filter(ticket => {
    const matchesSearch = ticket.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.workDescription.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === '' || ticket.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'aprobado': return 'bg-blue-100 text-blue-800'
      case 'en_proceso': return 'bg-orange-100 text-orange-800'
      case 'completado': return 'bg-green-100 text-green-800'
      case 'rechazado': return 'bg-red-100 text-red-800'
      case 'pagado': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente'
      case 'aprobado': return 'Aprobado'
      case 'en_proceso': return 'En Proceso'
      case 'completado': return 'Completado'
      case 'rechazado': return 'Rechazado'
      case 'pagado': return 'Pagado'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baja': return 'bg-green-100 text-green-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'urgente': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'baja': return 'Baja'
      case 'media': return 'Media'
      case 'alta': return 'Alta'
      case 'urgente': return 'Urgente'
      default: return priority
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Solicitudes</h1>
          <p className="text-gray-600 mt-2">Solicitudes de materiales, tickets de comida y pagos de personal</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleAddClick}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Solicitud
          </button>
          {activeTab === 'food' && (
            <button 
              onClick={() => setShowBulkPaymentModal(true)}
              className="btn btn-success"
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Pagos Masivos
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solicitudes Materiales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMaterialRequests}</p>
              <p className="text-xs text-yellow-600">{stats.pendingMaterialRequests} pendientes</p>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tickets de Comida</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFoodTickets}</p>
              <p className="text-xs text-yellow-600">{stats.pendingFoodTickets} pendientes</p>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pagos de Personal</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPaymentTickets}</p>
              <p className="text-xs text-yellow-600">{stats.pendingPaymentTickets} pendientes</p>
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">Q{stats.totalPendingAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Por aprobar/pagar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'materials', name: 'Solicitudes de Materiales', icon: WrenchScrewdriverIcon },
            { id: 'food', name: 'Tickets de Comida', icon: ShoppingCartIcon },
            { id: 'payments', name: 'Pagos de Personal', icon: CreditCardIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descripción, empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-48"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="rechazado">Rechazado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'materials' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitado por
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterialRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                        <div className="text-sm text-gray-500">{request.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {request.type === 'herrería' ? (
                          <WrenchScrewdriverIcon className="h-4 w-4 text-orange-600 mr-2" />
                        ) : (
                          <BoltIcon className="h-4 w-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">{request.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                        {getPriorityText(request.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                      <div className="font-medium">Q{request.estimatedCost.toFixed(2)}</div>
                      {request.actualCost && (
                        <div className="text-xs text-gray-500">Real: Q{request.actualCost.toFixed(2)}</div>
                      )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewItem(request)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(request)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(request.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMaterialRequests.length === 0 && (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron solicitudes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros de búsqueda o crea una nueva solicitud.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'food' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedTicketsForPayment.length === foodTickets.filter(t => t.status === 'aprobado').length && foodTickets.filter(t => t.status === 'aprobado').length > 0}
                      onChange={() => {
                        if (selectedTicketsForPayment.length === foodTickets.filter(t => t.status === 'aprobado').length) {
                          handleDeselectAllTickets()
                        } else {
                          handleSelectAllTickets()
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFoodTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTicketsForPayment.includes(ticket.id)}
                        onChange={() => handleTicketSelection(ticket.id)}
                        disabled={ticket.status !== 'aprobado'}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.employees.length} empleado{ticket.employees.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.employees.map(emp => emp.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.shift === 'día' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {ticket.shift === 'día' ? 'Día' : 'Noche'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{ticket.mealType}</div>
                      <div className="text-sm text-gray-500">{ticket.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">Q{ticket.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Q{ticket.unitCost.toFixed(2)} × {ticket.employeeCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(ticket.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewItem(ticket)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(ticket)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(ticket.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredFoodTickets.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron tickets de comida</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros de búsqueda o crea un nuevo ticket.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trabajador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trabajo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPaymentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.workerName}</div>
                      {ticket.workerId && (
                        <div className="text-sm text-gray-500">ID: {ticket.workerId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.type === 'hora' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {ticket.type === 'hora' ? 'Por Hora' : 'Por Día'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.workDescription}</div>
                      <div className="text-sm text-gray-500">
                        {ticket.type === 'hora' 
                          ? `${ticket.hours} horas @ Q${ticket.ratePerHour}/h`
                          : `${ticket.days} días @ Q${ticket.ratePerDay}/día`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">Q{ticket.totalAmount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(ticket.workDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewItem(ticket)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(ticket)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(ticket.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPaymentTickets.length === 0 && (
              <div className="text-center py-12">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron pagos de personal</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta ajustar los filtros de búsqueda o crea un nuevo pago.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalles</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {modalType === 'material' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedItem.title}</h4>
                    <p className="text-gray-600 mb-4">{selectedItem.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedItem.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Prioridad</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedItem.priority)}`}>
                          {getPriorityText(selectedItem.priority)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                          {getStatusText(selectedItem.status)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Solicitado por</label>
                        <p className="text-sm text-gray-900">{selectedItem.requestedBy}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-500">Materiales</label>
                      <div className="mt-2 space-y-2">
                        {selectedItem.materials.map((material: Material) => (
                          <div key={material.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{material.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({material.quantity} {material.unit})</span>
                            </div>
                            <span className="font-medium">Q{material.estimatedPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Costo Estimado</label>
                        <p className="text-lg font-semibold text-gray-900">Q{selectedItem.estimatedCost.toFixed(2)}</p>
                      </div>
                      {selectedItem.actualCost && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Costo Real</label>
                          <p className="text-lg font-semibold text-gray-900">Q{selectedItem.actualCost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalType === 'food' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Ticket de Comida</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Empleados</label>
                        <p className="text-sm text-gray-900">
                          {selectedItem.employees.length} empleado{selectedItem.employees.length !== 1 ? 's' : ''}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedItem.employees.map(emp => emp.name).join(', ')}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Turno</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedItem.shift === 'día' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {selectedItem.shift === 'día' ? 'Día' : 'Noche'}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Comida</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedItem.mealType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                          {getStatusText(selectedItem.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-sm text-gray-900">{selectedItem.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Costo Unitario</label>
                        <p className="text-sm font-semibold text-gray-900">Q{selectedItem.unitCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cantidad</label>
                        <p className="text-sm font-semibold text-gray-900">{selectedItem.employeeCount} empleado{selectedItem.employeeCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total</label>
                        <p className="text-lg font-semibold text-gray-900">Q{selectedItem.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Fecha</label>
                      <p className="text-sm text-gray-900">{new Date(selectedItem.date).toLocaleDateString()}</p>
                    </div>

                    {/* Información de pago */}
                    {selectedItem.status === 'pagado' && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <h5 className="text-sm font-medium text-green-900 mb-2">Información de Pago</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">Método:</span>
                            <span className="ml-2 text-green-900 capitalize">{selectedItem.paymentMethod}</span>
                          </div>
                          {selectedItem.paymentReference && (
                            <div>
                              <span className="text-green-700">Referencia:</span>
                              <span className="ml-2 text-green-900">{selectedItem.paymentReference}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-green-700">Fecha de Pago:</span>
                            <span className="ml-2 text-green-900">
                              {selectedItem.paidDate ? new Date(selectedItem.paidDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Documentos de pago */}
                        {selectedItem.paymentDocuments && selectedItem.paymentDocuments.length > 0 && (
                          <div className="mt-3">
                            <span className="text-green-700 text-sm font-medium">Documentos:</span>
                            <div className="mt-2 space-y-1">
                              {selectedItem.paymentDocuments.map((doc, index) => (
                                <div key={index} className="flex items-center text-sm">
                                  <span className="text-green-900">{doc.name}</span>
                                  <span className="ml-2 text-green-600 text-xs">
                                    ({doc.type === 'image' ? 'Imagen' : 'PDF'})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {modalType === 'payment' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Pago de Personal</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trabajador</label>
                        <p className="text-sm text-gray-900">{selectedItem.workerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedItem.type === 'hora' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedItem.type === 'hora' ? 'Por Hora' : 'Por Día'}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                          {getStatusText(selectedItem.status)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fecha de Trabajo</label>
                        <p className="text-sm text-gray-900">{new Date(selectedItem.workDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-500">Descripción del Trabajo</label>
                      <p className="text-sm text-gray-900">{selectedItem.workDescription}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Detalles</label>
                        <p className="text-sm text-gray-900">
                          {selectedItem.type === 'hora' 
                            ? `${selectedItem.hours} horas @ Q${selectedItem.ratePerHour}/h`
                            : `${selectedItem.days} días @ Q${selectedItem.ratePerDay}/día`
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total</label>
                        <p className="text-lg font-semibold text-gray-900">Q{selectedItem.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'material' ? 'Nueva Solicitud de Materiales' : 
                   modalType === 'food' ? 'Nuevo Ticket de Comida' : 
                   'Nuevo Pago de Personal'}
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const data = Object.fromEntries(formData.entries())
                handleAddItem(data)
              }}>
                <div className="space-y-4">
                  {modalType === 'material' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo</label>
                          <select name="type" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="herrería">Herrería</option>
                            <option value="electricidad">Electricidad</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                          <select name="priority" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input 
                          type="text" 
                          name="title" 
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea 
                          name="description" 
                          rows={3}
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Solicitado por</label>
                        <input 
                          type="text" 
                          name="requestedBy" 
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Costo Estimado (Q)</label>
                        <input 
                          type="number" 
                          name="estimatedCost" 
                          step="0.01"
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {modalType === 'food' && (
                    <>
                      {/* Selección de Empleados */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Seleccionar Empleados ({selectedEmployees.length} seleccionados)
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={handleSelectAllEmployees}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Seleccionar Todos
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllEmployees}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                          <div className="grid grid-cols-1 gap-2">
                            {availableEmployees.map((employee) => (
                              <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(employee.id)}
                                  onChange={() => handleEmployeeToggle(employee.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-xs text-gray-500">ID: {employee.employeeId}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Turno</label>
                          <select name="shift" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="día">Día</option>
                            <option value="noche">Noche</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo de Comida</label>
                          <select name="mealType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="desayuno">Desayuno</option>
                            <option value="almuerzo">Almuerzo</option>
                            <option value="cena">Cena</option>
                            <option value="refrigerio">Refrigerio</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea 
                          name="description" 
                          rows={3}
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Costo Unitario (Q)</label>
                          <input 
                            type="number" 
                            name="unitCost" 
                            step="0.01"
                            required 
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total Calculado</label>
                          <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
                            <div className="font-medium text-gray-900">
                              Q{((parseFloat(document.querySelector('input[name="unitCost"]')?.value || '0') || 0) * selectedEmployees.length).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''} seleccionado{selectedEmployees.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha</label>
                        <input 
                          type="date" 
                          name="date" 
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {modalType === 'payment' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Trabajador</label>
                          <input 
                            type="text" 
                            name="workerName" 
                            required 
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo</label>
                          <select name="type" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="hora">Por Hora</option>
                            <option value="día">Por Día</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción del Trabajo</label>
                        <textarea 
                          name="workDescription" 
                          rows={3}
                          required 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Fecha de Trabajo</label>
                          <input 
                            type="date" 
                            name="workDate" 
                            required 
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estado</label>
                          <select name="status" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="rechazado">Rechazado</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Horas</label>
                          <input 
                            type="number" 
                            name="hours" 
                            step="0.5"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tarifa por Hora (Q)</label>
                          <input 
                            type="number" 
                            name="ratePerHour" 
                            step="0.01"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Días</label>
                          <input 
                            type="number" 
                            name="days" 
                            step="0.5"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tarifa por Día (Q)</label>
                          <input 
                            type="number" 
                            name="ratePerDay" 
                            step="0.01"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'material' ? 'Editar Solicitud de Materiales' : 
                   modalType === 'food' ? 'Editar Ticket de Comida' : 
                   'Editar Pago de Personal'}
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const data = Object.fromEntries(formData.entries())
                handleEditItem(data)
              }}>
                <div className="space-y-4">
                  {modalType === 'food' && (
                    <>
                      {/* Selección de Empleados */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Seleccionar Empleados ({selectedEmployees.length} seleccionados)
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={handleSelectAllEmployees}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Seleccionar Todos
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllEmployees}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                          <div className="grid grid-cols-1 gap-2">
                            {availableEmployees.map((employee) => (
                              <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(employee.id)}
                                  onChange={() => handleEmployeeToggle(employee.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-xs text-gray-500">ID: {employee.employeeId}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Turno</label>
                          <select name="shift" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="día" selected={editingItem.shift === 'día'}>Día</option>
                            <option value="noche" selected={editingItem.shift === 'noche'}>Noche</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo de Comida</label>
                          <select name="mealType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="desayuno" selected={editingItem.mealType === 'desayuno'}>Desayuno</option>
                            <option value="almuerzo" selected={editingItem.mealType === 'almuerzo'}>Almuerzo</option>
                            <option value="cena" selected={editingItem.mealType === 'cena'}>Cena</option>
                            <option value="refrigerio" selected={editingItem.mealType === 'refrigerio'}>Refrigerio</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea 
                          name="description" 
                          rows={3}
                          required 
                          defaultValue={editingItem.description}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Costo Unitario (Q)</label>
                          <input 
                            type="number" 
                            name="unitCost" 
                            step="0.01"
                            required 
                            defaultValue={editingItem.unitCost}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total Calculado</label>
                          <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
                            <div className="font-medium text-gray-900">
                              Q{((parseFloat(document.querySelector('input[name="unitCost"]')?.value || '0') || 0) * selectedEmployees.length).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''} seleccionado{selectedEmployees.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha</label>
                        <input 
                          type="date" 
                          name="date" 
                          required 
                          defaultValue={editingItem.date}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <CreditCardIcon className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Pagos Masivos - Tickets de Comida</h3>
                </div>
                <button 
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Resumen de selección */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedTicketsForPayment.length} ticket{selectedTicketsForPayment.length !== 1 ? 's' : ''} seleccionado{selectedTicketsForPayment.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-blue-700">
                      Total: Q{selectedTicketsForPayment.reduce((sum, id) => {
                        const ticket = foodTickets.find(t => t.id === id)
                        return sum + (ticket?.totalAmount || 0)
                      }, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllTickets}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={handleDeselectAllTickets}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de tickets seleccionados */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tickets Seleccionados</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                  {selectedTicketsForPayment.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No hay tickets seleccionados
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {selectedTicketsForPayment.map(ticketId => {
                        const ticket = foodTickets.find(t => t.id === ticketId)
                        if (!ticket) return null
                        return (
                          <div key={ticketId} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ticket.employees.length} empleado{ticket.employees.length !== 1 ? 's' : ''} - {ticket.mealType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ticket.employees.map(emp => emp.name).join(', ')}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              Q{ticket.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Método de pago */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Método de Pago</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
                    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
                    { value: 'cheque', label: 'Cheque', icon: '📄' }
                  ].map((method) => (
                    <label key={method.value} className="relative">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                        paymentMethod === method.value 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="text-sm font-medium">{method.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Referencia de pago */}
              {paymentMethod !== 'efectivo' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia de Pago
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Número de transacción, cheque, etc."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              {/* Carga de documentos */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Documentos de Pago (JPG, PDF - Máx. 5MB cada uno)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-files"
                  />
                  <label htmlFor="payment-files" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-green-600 hover:text-green-500">
                        Haz clic para subir
                      </span>
                      {' '}o arrastra archivos aquí
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PDF hasta 5MB cada uno
                    </p>
                  </label>
                </div>

                {/* Lista de archivos subidos */}
                {paymentFiles.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Archivos subidos:</h5>
                    <div className="space-y-2">
                      {paymentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900">{file.name}</div>
                            <div className="text-xs text-gray-500 ml-2">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkPayment}
                  disabled={selectedTicketsForPayment.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Procesar Pagos ({selectedTicketsForPayment.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
