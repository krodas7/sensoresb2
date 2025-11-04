import React, { useState, useEffect } from 'react'
import { 
  ClipboardDocumentListIcon,
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  BoltIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  CubeIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

// Interfaces adaptadas al backend
interface MaterialRequest {
  id?: number
  type: 'herreria' | 'electricidad'
  title: string
  description: string
  materials?: Material[]
  requested_by: string
  requested_date: string
  priority: 'baja' | 'media' | 'alta' | 'urgente'
  status: 'pendiente' | 'aprobado' | 'en_proceso' | 'completado' | 'rechazado'
  approved_by?: string
  approved_date?: string
  completed_date?: string
  estimated_cost: number
  actual_cost?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

interface Material {
  id?: number
  name: string
  description: string
  quantity: number
  unit: string
  estimated_price: number
  actual_price?: number
  supplier?: string
}

interface FoodTicket {
  id?: number
  shift: 'dia' | 'noche'
  date: string
  employees?: FoodTicketEmployee[]
  meal_type: 'desayuno' | 'almuerzo' | 'cena'
  unit_cost: number
  total_amount: number
  employee_count: number
  description: string
  status: 'pendiente' | 'aprobado' | 'pagado'
  approved_by?: string
  approved_date?: string
  paid_date?: string
  payment_reference?: string
  payment_method?: 'efectivo' | 'transferencia' | 'cheque'
  created_at?: string
  updated_at?: string
}

interface FoodTicketEmployee {
  id?: number
  employee_name: string
  employee_id?: string
}

interface PaymentTicket {
  id?: number
  type: 'hora' | 'dia'
  worker_name: string
  worker_id?: string
  work_description: string
  hours?: number
  days?: number
  rate_per_hour?: number
  rate_per_day?: number
  total_amount: number
  work_date: string
  status: 'pendiente' | 'aprobado' | 'pagado'
  approved_by?: string
  approved_date?: string
  paid_date?: string
  payment_reference?: string
  payment_method?: 'efectivo' | 'transferencia' | 'cheque'
  notes?: string
  created_at?: string
  updated_at?: string
}

export default function Gestions() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'materials' | 'food' | 'payments'>('materials')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Verificar si el usuario puede aprobar/pagar
  const canApprove = user?.role === 'admin' || user?.role === 'rrhh'
  
  // Estados para cada módulo
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [foodTickets, setFoodTickets] = useState<FoodTicket[]>([])
  const [paymentTickets, setPaymentTickets] = useState<PaymentTicket[]>([])
  
  // Estados de modales
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // Estados para formularios
  const [materialForm, setMaterialForm] = useState<MaterialRequest>({
    type: 'herreria',
    title: '',
    description: '',
    requested_by: '',
    requested_date: new Date().toISOString().split('T')[0],
      priority: 'media',
    status: 'pendiente',
    estimated_cost: 0,
  })
  
  const [tempMaterials, setTempMaterials] = useState<Material[]>([])
  const [currentMaterial, setCurrentMaterial] = useState<Material>({
    name: '',
    description: '',
    quantity: 0,
    unit: 'unidades',
    estimated_price: 0,
  })
  
  const [foodForm, setFoodForm] = useState<FoodTicket>({
    shift: 'dia',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'almuerzo',
    unit_cost: 0,
    total_amount: 0,
    employee_count: 0,
    description: '',
    status: 'pendiente',
  })
  
  const [tempEmployees, setTempEmployees] = useState<FoodTicketEmployee[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<FoodTicketEmployee>({
    employee_name: '',
    employee_id: '',
  })
  
  const [paymentForm, setPaymentForm] = useState<PaymentTicket>({
    type: 'hora',
    worker_name: '',
    worker_id: '',
    work_description: '',
    hours: 0,
    rate_per_hour: 0,
    total_amount: 0,
    work_date: new Date().toISOString().split('T')[0],
    status: 'pendiente',
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'materials') {
        const response = await api.get('/gestions/material-requests/')
        const data = response.data.results || response.data || []
        setMaterialRequests(Array.isArray(data) ? data : [])
      } else if (activeTab === 'food') {
        const response = await api.get('/gestions/food-tickets/')
        const data = response.data.results || response.data || []
        setFoodTickets(Array.isArray(data) ? data : [])
      } else if (activeTab === 'payments') {
        const response = await api.get('/gestions/payment-tickets/')
        const data = response.data.results || response.data || []
        setPaymentTickets(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Material Request handlers
  const handleSaveMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Calcular costo estimado total
      const totalCost = tempMaterials.reduce((sum, m) => sum + (m.quantity * m.estimated_price), 0)
      const requestData = { ...materialForm, estimated_cost: totalCost }
      
      let savedRequest
      if (editingItem) {
        const response = await api.put(`/gestions/material-requests/${editingItem.id}/`, requestData)
        savedRequest = response.data
        toast.success('Solicitud actualizada')
    } else {
        const response = await api.post('/gestions/material-requests/', requestData)
        savedRequest = response.data
        toast.success('Solicitud creada')
      }
      
      // Guardar materiales
      for (const material of tempMaterials) {
        await api.post('/gestions/materials/', {
          ...material,
          request: savedRequest.id
        })
      }
      
      fetchData()
      setShowAddModal(false)
      resetForms()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar')
    }
  }

  const handleSaveFoodTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const ticketData = {
        ...foodForm,
        employee_count: tempEmployees.length,
        total_amount: tempEmployees.length * foodForm.unit_cost,
      }
      
      let savedTicket
      if (editingItem) {
        const response = await api.put(`/gestions/food-tickets/${editingItem.id}/`, ticketData)
        savedTicket = response.data
        toast.success('Vale actualizado')
      } else {
        const response = await api.post('/gestions/food-tickets/', ticketData)
        savedTicket = response.data
        toast.success('Vale creado')
      }
      
      // Guardar empleados (nota: el backend actual no tiene endpoint para esto, se puede mejorar)
      
      fetchData()
      setShowAddModal(false)
      resetForms()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar')
    }
  }

  const handleSavePaymentTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Calcular total
      const total = paymentForm.type === 'hora' 
        ? (paymentForm.hours || 0) * (paymentForm.rate_per_hour || 0)
        : (paymentForm.days || 0) * (paymentForm.rate_per_day || 0)
      
      const ticketData = { ...paymentForm, total_amount: total }
      
      if (editingItem) {
        await api.put(`/gestions/payment-tickets/${editingItem.id}/`, ticketData)
        toast.success('Vale actualizado')
      } else {
        await api.post('/gestions/payment-tickets/', ticketData)
        toast.success('Vale creado')
      }
      
      fetchData()
      setShowAddModal(false)
      resetForms()
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar')
    }
  }

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return
    
    try {
      await api.delete(`/gestions/material-requests/${id}/`)
      toast.success('Solicitud eliminada')
      fetchData()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error al eliminar')
    }
  }

  const handleDeleteFood = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este vale?')) return
    
    try {
      await api.delete(`/gestions/food-tickets/${id}/`)
      toast.success('Vale eliminado')
      fetchData()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error al eliminar')
    }
  }

  const handleDeletePayment = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este vale?')) return
    
    try {
      await api.delete(`/gestions/payment-tickets/${id}/`)
      toast.success('Vale eliminado')
      fetchData()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error al eliminar')
    }
  }

  const handleApprove = async (type: 'material' | 'food' | 'payment', id: number) => {
    // Validar permisos
    if (!canApprove) {
      toast.error('No tienes permisos para aprobar. Solo Admin y RRHH pueden aprobar.')
      return
    }

    if (!confirm('¿Estás seguro de aprobar esta gestión?')) return
    
    try {
      const endpoint = type === 'material' ? 'material-requests' : type === 'food' ? 'food-tickets' : 'payment-tickets'
      const approverName = user?.username || `${user?.first_name} ${user?.last_name}`.trim() || 'Usuario'
      
      await api.patch(`/gestions/${endpoint}/${id}/`, {
        status: 'aprobado',
        approved_by: approverName,
        approved_date: new Date().toISOString().split('T')[0],
      })
      
      toast.success(`✅ Aprobado por ${approverName}`)
      fetchData()
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Error al aprobar')
    }
  }

  const handlePay = async (type: 'food' | 'payment', id: number) => {
    // Validar permisos
    if (!canApprove) {
      toast.error('No tienes permisos para registrar pagos. Solo Admin y RRHH pueden hacerlo.')
      return
    }

    const reference = prompt('Ingresa la referencia de pago (número de transferencia, cheque, etc.):')
    if (!reference) return
    
    const method = prompt('Método de pago (efectivo/transferencia/cheque):') || 'transferencia'
    
    try {
      const endpoint = type === 'food' ? 'food-tickets' : 'payment-tickets'
      await api.patch(`/gestions/${endpoint}/${id}/`, {
        status: 'pagado',
        paid_date: new Date().toISOString().split('T')[0],
        payment_reference: reference,
        payment_method: method,
      })
      
      toast.success(`💰 Pago registrado - Ref: ${reference}`)
      fetchData()
    } catch (error) {
      console.error('Error paying:', error)
      toast.error('Error al registrar pago')
    }
  }

  const addMaterial = () => {
    if (!currentMaterial.name || currentMaterial.quantity <= 0) {
      toast.error('Complete los datos del material')
      return
    }
    setTempMaterials([...tempMaterials, { ...currentMaterial }])
    setCurrentMaterial({
      name: '',
      description: '',
      quantity: 0,
      unit: 'unidades',
      estimated_price: 0,
    })
  }

  const removeMaterial = (index: number) => {
    setTempMaterials(tempMaterials.filter((_, i) => i !== index))
  }

  const addEmployee = () => {
    if (!currentEmployee.employee_name) {
      toast.error('Ingrese el nombre del empleado')
      return
    }
    setTempEmployees([...tempEmployees, { ...currentEmployee }])
    setCurrentEmployee({ employee_name: '', employee_id: '' })
  }

  const removeEmployee = (index: number) => {
    setTempEmployees(tempEmployees.filter((_, i) => i !== index))
  }

  const resetForms = () => {
    setMaterialForm({
      type: 'herreria',
      title: '',
      description: '',
      requested_by: '',
      requested_date: new Date().toISOString().split('T')[0],
      priority: 'media',
      status: 'pendiente',
      estimated_cost: 0,
    })
    setTempMaterials([])
    setCurrentMaterial({
      name: '',
      description: '',
      quantity: 0,
      unit: 'unidades',
      estimated_price: 0,
    })
    
    setFoodForm({
      shift: 'dia',
      date: new Date().toISOString().split('T')[0],
      meal_type: 'almuerzo',
      unit_cost: 0,
      total_amount: 0,
      employee_count: 0,
      description: '',
      status: 'pendiente',
    })
    setTempEmployees([])
    setCurrentEmployee({ employee_name: '', employee_id: '' })
    
    setPaymentForm({
      type: 'hora',
      worker_name: '',
      worker_id: '',
      work_description: '',
      hours: 0,
      rate_per_hour: 0,
      total_amount: 0,
      work_date: new Date().toISOString().split('T')[0],
      status: 'pendiente',
    })
    
    setEditingItem(null)
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    if (activeTab === 'materials') {
      setMaterialForm(item)
      setTempMaterials(item.materials || [])
    } else if (activeTab === 'food') {
      setFoodForm(item)
      setTempEmployees(item.employees || [])
    } else {
      setPaymentForm(item)
    }
    setShowAddModal(true)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-blue-100 text-blue-800',
      en_proceso: 'bg-purple-100 text-purple-800',
      completado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      pagado: 'bg-green-100 text-green-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      baja: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800',
    }
    return badges[priority as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredMaterials = materialRequests.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedStatus === '' || req.status === selectedStatus)
  )

  const filteredFood = foodTickets.filter(ticket =>
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedStatus === '' || ticket.status === selectedStatus)
  )

  const filteredPayments = paymentTickets.filter(ticket =>
    ticket.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedStatus === '' || ticket.status === selectedStatus)
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Gestiones</h1>
              <p className="text-indigo-100">Administración de solicitudes, vales de comida y pagos</p>
              {canApprove ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-200">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Tienes permisos de aprobación y pago ({user?.role})</span>
            </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-sm text-yellow-200">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Solo visualización - No puedes aprobar ni pagar ({user?.role})</span>
            </div>
              )}
          </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
        </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'materials', label: 'Solicitudes de Material', icon: WrenchScrewdriverIcon },
            { key: 'food', label: 'Vales de Comida', icon: ShoppingCartIcon },
            { key: 'payments', label: 'Vales de Pago', icon: CreditCardIcon },
          ].map((tab) => {
            const Icon = tab.icon
            return (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  ${activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                `}
              >
                <Icon className={`
                  ${activeTab === tab.key ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                  -ml-0.5 mr-2 h-5 w-5
                `} />
                {tab.label}
            </button>
            )
          })}
        </nav>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              {activeTab === 'materials' && <option value="en_proceso">En Proceso</option>}
              {activeTab === 'materials' && <option value="completado">Completado</option>}
              {activeTab === 'materials' && <option value="rechazado">Rechazado</option>}
              {(activeTab === 'food' || activeTab === 'payments') && <option value="pagado">Pagado</option>}
            </select>
                        <button 
              onClick={() => {
                resetForms()
                setShowAddModal(true)
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo
                        </button>
          </div>
        </div>
      </div>

      {/* Material Requests Tab */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredMaterials.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.type === 'herreria' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {request.type === 'herreria' ? '🔧 Herrería' : '⚡ Electricidad'}
                      </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(request.priority)}`}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {request.status.replace('_', ' ').charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                    </span>
                      </div>
                  <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👤 {request.requested_by}</span>
                    <span>📅 {new Date(request.requested_date).toLocaleDateString('es-GT')}</span>
                    <span>💰 Q{request.estimated_cost.toFixed(2)}</span>
                  </div>
                  {request.approved_by && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-flex">
                      <ShieldCheckIcon className="h-3 w-3" />
                      <span>Aprobado por: {request.approved_by}</span>
                      {request.approved_date && <span>({new Date(request.approved_date).toLocaleDateString('es-GT')})</span>}
                    </div>
                      )}
                      </div>
                <div className="flex gap-2">
                  {request.status === 'pendiente' && canApprove && (
                        <button 
                      onClick={() => handleApprove('material', request.id!)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={`Aprobar (como ${user?.username})`}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                        </button>
                  )}
                        <button 
                    onClick={() => openEditModal(request)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                    <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                    onClick={() => handleDeleteMaterial(request.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                    <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
              </div>
                          </div>
                ))}
          {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva solicitud</p>
              </div>
            )}
        </div>
      )}

      {/* Food Tickets Tab */}
      {activeTab === 'food' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFood.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                  <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.shift === 'dia' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {ticket.shift === 'dia' ? '☀️ Día' : '🌙 Noche'}
                      </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                      </div>
                  <h4 className="font-semibold text-gray-900 capitalize">{ticket.meal_type}</h4>
                  <p className="text-sm text-gray-600">📅 {new Date(ticket.date).toLocaleDateString('es-GT')}</p>
                      </div>
                      </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Empleados:</span>
                  <span className="font-semibold">{ticket.employee_count}</span>
                      </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Costo unitario:</span>
                  <span className="font-semibold">Q{ticket.unit_cost.toFixed(2)}</span>
              </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg">Q{ticket.total_amount.toFixed(2)}</span>
          </div>
              </div>
              {ticket.approved_by && (
                <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ Aprobado por: {ticket.approved_by}
                  {ticket.approved_date && ` (${new Date(ticket.approved_date).toLocaleDateString('es-GT')})`}
        </div>
      )}
              {ticket.status === 'pagado' && ticket.payment_reference && (
                <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  💰 Ref. pago: {ticket.payment_reference}
                  {ticket.paid_date && ` (${new Date(ticket.paid_date).toLocaleDateString('es-GT')})`}
                      </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                {ticket.status === 'pendiente' && canApprove && (
                        <button 
                    onClick={() => handleApprove('food', ticket.id!)}
                    className="py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    title={`Aprobar (como ${user?.username})`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                        </button>
                )}
                {ticket.status === 'aprobado' && canApprove && (
                        <button 
                    onClick={() => handlePay('food', ticket.id!)}
                    className="py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    title="Registrar Pago"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                        </button>
                )}
                        <button 
                  onClick={() => openEditModal(ticket)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                  Editar
                        </button>
                <button 
                  onClick={() => handleDeleteFood(ticket.id!)}
                  className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
                          </div>
                        ))}
          {filteredFood.length === 0 && (
            <div className="col-span-full text-center py-12">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay vales de comida</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo vale</p>
                        </div>
                      )}
                  </div>
                )}

      {/* Payment Tickets Tab */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                  <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.type === 'hora' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {ticket.type === 'hora' ? '⏱️ Por Hora' : '📅 Por Día'}
                        </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </div>
                  <h4 className="font-semibold text-gray-900">{ticket.worker_name}</h4>
                  <p className="text-sm text-gray-600">📅 {new Date(ticket.work_date).toLocaleDateString('es-GT')}</p>
                    </div>
                    </div>
              <div className="space-y-2 mb-3">
                <p className="text-sm text-gray-600 line-clamp-2">{ticket.work_description}</p>
                {ticket.type === 'hora' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Horas:</span>
                    <span className="font-semibold">{ticket.hours} h × Q{ticket.rate_per_hour?.toFixed(2)}</span>
                      </div>
                )}
                {ticket.type === 'dia' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Días:</span>
                    <span className="font-semibold">{ticket.days} d × Q{ticket.rate_per_day?.toFixed(2)}</span>
                            </div>
                          )}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-lg">Q{ticket.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
              {ticket.approved_by && (
                <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ Aprobado por: {ticket.approved_by}
                  {ticket.approved_date && ` (${new Date(ticket.approved_date).toLocaleDateString('es-GT')})`}
                          </div>
                        )}
              {ticket.status === 'pagado' && ticket.payment_reference && (
                <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  💰 Ref. pago: {ticket.payment_reference}
                  {ticket.paid_date && ` (${new Date(ticket.paid_date).toLocaleDateString('es-GT')})`}
                      </div>
                    )}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                {ticket.status === 'pendiente' && canApprove && (
                  <button 
                    onClick={() => handleApprove('payment', ticket.id!)}
                    className="py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    title={`Aprobar (como ${user?.username})`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                )}
                {ticket.status === 'aprobado' && canApprove && (
                  <button
                    onClick={() => handlePay('payment', ticket.id!)}
                    className="py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    title="Registrar Pago"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(ticket)}
                  className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeletePayment(ticket.id!)}
                  className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                      </div>
                      </div>
          ))}
          {filteredPayments.length === 0 && (
            <div className="col-span-full text-center py-12">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay vales de pago</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo vale</p>
                  </div>
                )}
        </div>
      )}

      {/* Modal Solicitud de Material */}
      {showAddModal && activeTab === 'materials' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Editar' : 'Nueva'} Solicitud de Material
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveMaterialRequest} className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-4 w-4" />
                    Tipo *
                  </label>
                  <select
                    required
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="herreria">🔧 Herrería</option>
                    <option value="electricidad">⚡ Electricidad</option>
                          </select>
                        </div>
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FireIcon className="h-4 w-4" />
                    Prioridad *
                  </label>
                  <select
                    required
                    value={materialForm.priority}
                    onChange={(e) => setMaterialForm({ ...materialForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                          </select>
                        </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Título *
                  </label>
                        <input 
                          type="text" 
                          required 
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ej: Reparación de portón principal"
                        />
                      </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    Descripción *
                  </label>
                        <textarea 
                          required 
                    value={materialForm.description}
                    onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                        />
                      </div>
                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Solicitado por *
                  </label>
                        <input 
                          type="text" 
                          required 
                    value={materialForm.requested_by}
                    onChange={(e) => setMaterialForm({ ...materialForm, requested_by: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Fecha de Solicitud *
                  </label>
                        <input 
                    type="date"
                          required 
                    value={materialForm.requested_date}
                    onChange={(e) => setMaterialForm({ ...materialForm, requested_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
              </div>

              {/* Materiales */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5" />
                  Materiales Requeridos
                </h3>
                
                <div className="grid grid-cols-6 gap-3 mb-3 bg-gray-50 p-3 rounded-lg">
                  <div className="col-span-2">
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <CubeIcon className="h-3 w-3" />
                      Material
                          </div>
                                <input
                      type="text"
                      placeholder="Nombre del material"
                      value={currentMaterial.name}
                      onChange={(e) => setCurrentMaterial({ ...currentMaterial, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                                </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <ScaleIcon className="h-3 w-3" />
                      Cantidad
                        </div>
                          <input 
                            type="number" 
                      placeholder="0"
                      min="0"
                            step="0.01"
                      value={currentMaterial.quantity}
                      onChange={(e) => setCurrentMaterial({ ...currentMaterial, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1">Unidad</div>
                          <input 
                            type="text" 
                      placeholder="ej: kg"
                      value={currentMaterial.unit}
                      onChange={(e) => setCurrentMaterial({ ...currentMaterial, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <CurrencyDollarIcon className="h-3 w-3" />
                      Precio
                        </div>
                          <input 
                            type="number" 
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={currentMaterial.estimated_price}
                      onChange={(e) => setCurrentMaterial({ ...currentMaterial, estimated_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1">Agregar</div>
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                        </div>
                      </div>
                      
                {tempMaterials.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Material</th>
                          <th className="text-left pb-2">Cantidad</th>
                          <th className="text-left pb-2">Precio Unit.</th>
                          <th className="text-left pb-2">Total</th>
                          <th className="text-left pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tempMaterials.map((material, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{material.name}</td>
                            <td className="py-2">{material.quantity} {material.unit}</td>
                            <td className="py-2">Q{material.estimated_price.toFixed(2)}</td>
                            <td className="py-2 font-semibold">Q{(material.quantity * material.estimated_price).toFixed(2)}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeMaterial(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td colSpan={3} className="pt-2 text-right">Total Estimado:</td>
                          <td className="pt-2">Q{tempMaterials.reduce((sum, m) => sum + (m.quantity * m.estimated_price), 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                        </div>
                  )}
                </div>
                
              <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-medium"
                  >
                  {editingItem ? 'Actualizar' : 'Crear'} Solicitud
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Vale de Comida */}
      {showAddModal && activeTab === 'food' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Editar' : 'Nuevo'} Vale de Comida
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveFoodTicket} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    Turno *
                          </label>
                  <select
                    required
                    value={foodForm.shift}
                    onChange={(e) => setFoodForm({ ...foodForm, shift: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="dia">☀️ Día</option>
                    <option value="noche">🌙 Noche</option>
                  </select>
                          </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Fecha *
                  </label>
                                <input
                    type="date"
                    required
                    value={foodForm.date}
                    onChange={(e) => setFoodForm({ ...foodForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                                </div>
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ShoppingCartIcon className="h-4 w-4" />
                    Tipo de Comida *
                  </label>
                  <select
                    required
                    value={foodForm.meal_type}
                    onChange={(e) => setFoodForm({ ...foodForm, meal_type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="desayuno">🌅 Desayuno</option>
                    <option value="almuerzo">🍽️ Almuerzo</option>
                    <option value="cena">🌙 Cena</option>
                          </select>
                        </div>
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Costo Unitario *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={foodForm.unit_cost}
                    onChange={(e) => setFoodForm({ ...foodForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ej: 25.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Descripción
                  </label>
                  <textarea
                    value={foodForm.description}
                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={2}
                  />
                        </div>
                      </div>
                      
              {/* Empleados */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Empleados
                </h3>
                
                <div className="grid grid-cols-3 gap-3 mb-3 bg-gray-50 p-3 rounded-lg">
                      <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      Nombre
                    </div>
                    <input
                      type="text"
                      placeholder="Nombre del empleado"
                      value={currentEmployee.employee_name}
                      onChange={(e) => setCurrentEmployee({ ...currentEmployee, employee_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1">ID (opcional)</div>
                          <input 
                      type="text"
                      placeholder="ID (opcional)"
                      value={currentEmployee.employee_id}
                      onChange={(e) => setCurrentEmployee({ ...currentEmployee, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                    <div className="text-xs text-gray-600 mb-1">Agregar</div>
                    <button
                      type="button"
                      onClick={addEmployee}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                            </div>
                            </div>

                {tempEmployees.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Empleados agregados: {tempEmployees.length}</p>
                    <div className="space-y-2">
                      {tempEmployees.map((emp, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm">{emp.employee_name} {emp.employee_id && `(${emp.employee_id})`}</span>
                          <button
                            type="button"
                            onClick={() => removeEmployee(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          </div>
                      ))}
                        </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        {tempEmployees.length} empleados × Q{foodForm.unit_cost.toFixed(2)} = Q{(tempEmployees.length * foodForm.unit_cost).toFixed(2)}
                      </span>
                      </div>
                      </div>
                  )}
                </div>
                
              <div className="flex gap-3">
                  <button
                    type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium"
                  >
                  {editingItem ? 'Actualizar' : 'Crear'} Vale
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Vale de Pago */}
      {showAddModal && activeTab === 'payments' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Editar' : 'Nuevo'} Vale de Pago
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

            <form onSubmit={handleSavePaymentTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Tipo de Pago *
                  </label>
                  <select
                    required
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hora">⏱️ Por Hora</option>
                    <option value="dia">📅 Por Día</option>
                  </select>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Fecha de Trabajo *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.work_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, work_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Nombre del Trabajador *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.worker_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, worker_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    ID Trabajador (opcional)
                  </label>
                      <input
                    type="text"
                    value={paymentForm.worker_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, worker_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                      </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Descripción del Trabajo *
                    </label>
                  <textarea
                    required
                    value={paymentForm.work_description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, work_description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
              </div>

                {paymentForm.type === 'hora' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        Horas Trabajadas *
                  </label>
                  <input
                        type="number"
                        required
                        min="0"
                        step="0.5"
                        value={paymentForm.hours || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, hours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        Tarifa por Hora *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={paymentForm.rate_per_hour || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, rate_per_hour: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {paymentForm.type === 'dia' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Días Trabajados *
                </label>
                  <input
                        type="number"
                        required
                        min="0"
                        value={paymentForm.days || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, days: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        Tarifa por Día *
                  </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={paymentForm.rate_per_day || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, rate_per_day: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Notas (opcional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                            </div>
                          </div>

              {/* Cálculo del total */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Q{paymentForm.type === 'hora' 
                      ? ((paymentForm.hours || 0) * (paymentForm.rate_per_hour || 0)).toFixed(2)
                      : ((paymentForm.days || 0) * (paymentForm.rate_per_day || 0)).toFixed(2)
                    }
                  </span>
                        </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium"
                >
                  {editingItem ? 'Actualizar' : 'Crear'} Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

