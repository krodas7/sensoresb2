import React, { useState, useEffect } from 'react'
import { 
  TruckIcon,
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
  DocumentTextIcon,
  ScaleIcon,
  BeakerIcon,
  TagIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Supplier {
  id: number
  name: string
  type: 'cc1' | 'parchment' | 'both'
  contactPerson: string
  phone: string
  address: string
  city: string
  region: string
  country: string
  registrationDate: string
  status: 'active' | 'inactive' | 'suspended'
  rating: number
  totalDeliveries: number
  totalWeight: number // en quintales
  lastDelivery?: string
  certifications: string[]
  paymentTerms: string
  notes?: string
  isVerified: boolean
}

interface Delivery {
  id: number
  supplierId: number
  supplier: Supplier
  deliveryDate: string
  weight: number // en quintales
  quality: number
  price: number
  lotNumber: string
  variety: string
  process: string
  moisture: number
  defects: number
  status: 'pending' | 'received' | 'rejected' | 'processed'
  notes?: string
}

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Finca El Paraíso',
    type: 'cc1',
    contactPerson: 'María González',
    phone: '+57 300 123 4567',
    address: 'Vereda La Esperanza Km 15',
    city: 'Manizales',
    region: 'Caldas',
    country: 'Colombia',
    registrationDate: '2025-01-15',
    status: 'active',
    rating: 4.8,
    totalDeliveries: 45,
    totalWeight: 1200,
    lastDelivery: '2025-09-10',
    certifications: ['Fair Trade', 'Organic', 'Rainforest Alliance'],
    paymentTerms: '15 días',
    notes: 'Proveedor confiable con café de alta calidad',
    isVerified: true
  },
  {
    id: 2,
    name: 'Cooperativa de Caficultores del Huila',
    type: 'parchment',
    contactPerson: 'Carlos Mendoza',
    phone: '+57 310 987 6543',
    address: 'Carrera 5 #12-34',
    city: 'Neiva',
    region: 'Huila',
    country: 'Colombia',
    registrationDate: '2025-02-20',
    status: 'active',
    rating: 4.6,
    totalDeliveries: 78,
    totalWeight: 2100,
    lastDelivery: '2025-09-12',
    certifications: ['Fair Trade', 'UTZ'],
    paymentTerms: '30 días',
    notes: 'Cooperativa con excelente trazabilidad',
    isVerified: true
  },
  {
    id: 3,
    name: 'Café Especial de Antioquia',
    type: 'both',
    contactPerson: 'Ana Restrepo',
    phone: '+57 320 555 1234',
    address: 'Finca La Montaña',
    city: 'Medellín',
    region: 'Antioquia',
    country: 'Colombia',
    registrationDate: '2025-03-10',
    status: 'active',
    rating: 4.9,
    totalDeliveries: 32,
    totalWeight: 850,
    lastDelivery: '2025-09-14',
    certifications: ['Organic', 'Direct Trade'],
    paymentTerms: '20 días',
    notes: 'Especialistas en café de altura',
    isVerified: true
  },
  {
    id: 4,
    name: 'Proveedor Regional Norte',
    type: 'cc1',
    contactPerson: 'Luis Torres',
    phone: '+57 315 777 8888',
    address: 'Vereda El Roble',
    city: 'Bucaramanga',
    region: 'Santander',
    country: 'Colombia',
    registrationDate: '2025-04-05',
    status: 'inactive',
    rating: 3.2,
    totalDeliveries: 12,
    totalWeight: 300,
    lastDelivery: '2025-08-20',
    certifications: [],
    paymentTerms: '45 días',
    notes: 'Proveedor suspendido por calidad inconsistente',
    isVerified: false
  }
]

const mockDeliveries: Delivery[] = [
  {
    id: 1,
    supplierId: 1,
    supplier: mockSuppliers[0],
    deliveryDate: '2025-09-10',
    weight: 25,
    quality: 87.5,
    price: 850000,
    lotNumber: 'LOT-2025-001',
    variety: 'Castillo',
    process: 'Lavado',
    moisture: 11.2,
    defects: 2,
    status: 'received',
    notes: 'Excelente calidad, sin defectos'
  },
  {
    id: 2,
    supplierId: 2,
    supplier: mockSuppliers[1],
    deliveryDate: '2025-09-12',
    weight: 40,
    quality: 85.8,
    price: 1200000,
    lotNumber: 'LOT-2025-002',
    variety: 'Caturra',
    process: 'Natural',
    moisture: 10.8,
    defects: 3,
    status: 'received',
    notes: 'Buena calidad, proceso natural'
  },
  {
    id: 3,
    supplierId: 3,
    supplier: mockSuppliers[2],
    deliveryDate: '2025-09-14',
    weight: 18,
    quality: 92.1,
    price: 720000,
    lotNumber: 'LOT-2025-003',
    variety: 'Geisha',
    process: 'Honey',
    moisture: 11.5,
    defects: 1,
    status: 'received',
    notes: 'Café premium de alta calidad'
  }
]

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [loading, setLoading] = useState(true)

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    type: 'cc1' as Supplier['type'],
    contactPerson: '',
    notes: ''
  })

  // Fetch suppliers from API
  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/suppliers/')
      const data = response.data.results || response.data || []
      
      // Mapear los datos del backend al formato del frontend
      const mappedSuppliers = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        contactPerson: s.contact_person,
        phone: '',
        address: '',
        city: '',
        region: '',
        country: '',
        registrationDate: s.registration_date,
        status: s.status,
        rating: parseFloat(s.rating) || 0,
        totalDeliveries: s.total_deliveries || 0,
        totalWeight: parseFloat(s.total_weight) || 0,
        certifications: [],
        paymentTerms: '',
        notes: s.notes || '',
        isVerified: s.is_verified
      }))
      
      setSuppliers(mappedSuppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Error al cargar proveedores')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: Supplier['type']) => {
    switch (type) {
      case 'cc1': return 'bg-red-100 text-red-800'
      case 'parchment': return 'bg-yellow-100 text-yellow-800'
      case 'both': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeText = (type: Supplier['type']) => {
    switch (type) {
      case 'cc1': return 'Café Cereza CC1'
      case 'parchment': return 'Café Pergamino'
      case 'both': return 'Ambos Tipos'
      default: return type
    }
  }

  const getStatusColor = (status: Supplier['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Supplier['status']) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'inactive': return 'Inactivo'
      case 'suspended': return 'Suspendido'
      default: return status
    }
  }

  const getDeliveryStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'received': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'processed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeliveryStatusText = (status: Delivery['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'received': return 'Recibido'
      case 'rejected': return 'Rechazado'
      case 'processed': return 'Procesado'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleNewSupplierChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setNewSupplier(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supplierData = {
        name: newSupplier.name,
        type: newSupplier.type,
        contact_person: newSupplier.contactPerson,
        notes: newSupplier.notes
      }
      
      await api.post('/suppliers/', supplierData)
      toast.success('Proveedor creado exitosamente')
      fetchSuppliers()
      setIsNewSupplierModalOpen(false)
      setNewSupplier({
        name: '',
        type: 'cc1',
        contactPerson: '',
        notes: ''
      })
    } catch (error: any) {
      console.error('Error creating supplier:', error)
      const errorMessage = error.response?.data?.name?.[0] || 'Error al crear proveedor'
      toast.error(errorMessage)
    }
  }

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
    
    try {
      await api.delete(`/suppliers/${supplierId}/`)
      toast.success('Proveedor eliminado exitosamente')
      fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Error al eliminar proveedor')
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsEditSupplierModalOpen(true)
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === '' || supplier.type === filterType
    const matchesStatus = filterStatus === '' || supplier.status === filterStatus
    const matchesRegion = filterRegion === '' || supplier.region === filterRegion
    return matchesSearch && matchesType && matchesStatus && matchesRegion
  })

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.variety.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra proveedores de café cereza CC1 y café pergamino.
          </p>
        </div>
        <button
          onClick={() => setIsNewSupplierModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {suppliers.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Peso Total (qq)</p>
              <p className="text-2xl font-bold text-gray-900">
                {suppliers.reduce((total, s) => total + s.totalWeight, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <StarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Calificación Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {suppliers.length > 0 ? (suppliers.reduce((total, s) => total + s.rating, 0) / suppliers.length).toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['suppliers', 'deliveries', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                ${activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              `}
            >
              {tab === 'suppliers' && 'Proveedores'}
              {tab === 'deliveries' && 'Entregas'}
              {tab === 'analytics' && 'Análisis'}
            </button>
          ))}
        </nav>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proveedores por nombre, contacto o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input w-48"
                >
                  <option value="">Todos los tipos</option>
                  <option value="cc1">Café Cereza CC1</option>
                  <option value="parchment">Café Pergamino</option>
                  <option value="both">Ambos Tipos</option>
                </select>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input w-48"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
                <select 
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="input w-48"
                >
                  <option value="">Todas las regiones</option>
                  <option value="Caldas">Caldas</option>
                  <option value="Huila">Huila</option>
                  <option value="Antioquia">Antioquia</option>
                  <option value="Santander">Santander</option>
                </select>
              </div>
            </div>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {supplier.isVerified && (
                      <CheckIcon className="w-5 h-5 text-green-600" title="Verificado" />
                    )}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(supplier.type)}`}>
                      {getTypeText(supplier.type)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="w-4 h-4 mr-2" />
                    {supplier.contactPerson}
                  </div>
                  {supplier.notes && (
                    <div className="flex items-start text-sm text-gray-600">
                      <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.notes}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Calificación</p>
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold">{supplier.rating}/5</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Entregas</p>
                    <p className="text-sm font-semibold">{supplier.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Peso Total</p>
                    <p className="text-sm font-semibold">{supplier.totalWeight} qq</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                      {getStatusText(supplier.status)}
                    </span>
                  </div>
                </div>


                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50 transition-colors"
                      title="Ver Detalles"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Registrado: {new Date(supplier.registrationDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar entregas por proveedor, lote o variedad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lote
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peso (qq)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{delivery.supplier.name}</div>
                        <div className="text-sm text-gray-500">{delivery.supplier.contactPerson}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(delivery.deliveryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{delivery.lotNumber}</div>
                        <div className="text-sm text-gray-500">{delivery.variety} - {delivery.process}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.weight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BeakerIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{delivery.quality}/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(delivery.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDeliveryStatusColor(delivery.status)}`}>
                          {getDeliveryStatusText(delivery.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Ver Detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis de Proveedores</h2>
          <p className="text-gray-600">Aquí se mostrarán gráficos y estadísticas sobre el rendimiento de los proveedores.</p>
          {/* <SupplierAnalytics /> */}
        </div>
      )}

      {/* New Supplier Modal */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Nuevo Proveedor</h3>
                <button
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-4">
                {/* Nombre del Proveedor */}
                <div>
                  <label className="label">Nombre del Proveedor *</label>
                  <input
                    type="text"
                    name="name"
                    value={newSupplier.name}
                    onChange={handleNewSupplierChange}
                    className="input"
                    placeholder="Ej: Finca El Paraíso"
                    required
                  />
                </div>

                {/* Tipo de Café */}
                <div>
                  <label className="label">Tipo de Café *</label>
                  <select
                    name="type"
                    value={newSupplier.type}
                    onChange={handleNewSupplierChange}
                    className="input"
                  >
                    <option value="cc1">Café Cereza CC1</option>
                    <option value="parchment">Café Pergamino</option>
                    <option value="both">Ambos Tipos</option>
                  </select>
                </div>

                {/* Persona de Contacto */}
                <div>
                  <label className="label">Persona de Contacto *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={handleNewSupplierChange}
                    className="input"
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                {/* Notas Adicionales */}
                <div>
                  <label className="label">Notas Adicionales</label>
                  <textarea
                    name="notes"
                    value={newSupplier.notes}
                    onChange={handleNewSupplierChange}
                    className="input"
                    rows={3}
                    placeholder="Información adicional sobre el proveedor..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNewSupplierModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    Crear Proveedor
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
