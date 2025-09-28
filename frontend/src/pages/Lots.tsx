import React, { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TruckIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TagIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

interface Lot {
  id: number
  lot_number: string
  supplier: string
  variety: string
  weight: number
  status: 'received' | 'processing' | 'fermenting' | 'drying' | 'completed'
  received_date: string
  expected_completion: string
  quality_grade: 'AA' | 'A' | 'B' | 'C'
  notes: string
  current_location: string
}

interface LotFormData {
  lot_number: string
  supplier: string
  variety: string
  weight: number
  status: 'received' | 'processing' | 'fermenting' | 'drying' | 'completed'
  quality_grade: 'AA' | 'A' | 'B' | 'C'
  notes: string
  current_location: string
}

export default function Lots() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLot, setEditingLot] = useState<Lot | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lotToDelete, setLotToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState<LotFormData>({
    lot_number: '',
    supplier: '',
    variety: '',
    weight: 0,
    status: 'received',
    quality_grade: 'A',
    notes: '',
    current_location: ''
  })

  useEffect(() => {
    fetchLots()
  }, [])

  const fetchLots = () => {
    try {
      setLoading(true)
      const storedLots = localStorage.getItem('coffeeLots')
      if (storedLots) {
        setLots(JSON.parse(storedLots))
      } else {
        // Datos iniciales de ejemplo
        const initialLots = [
          { 
            id: 1, 
            lot_number: '2024-001', 
            supplier: 'Finca El Paraíso', 
            variety: 'Bourbon', 
            weight: 500, 
            status: 'received' as const, 
            received_date: new Date().toISOString(), 
            expected_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
            quality_grade: 'AA' as const, 
            notes: 'Excelente calidad', 
            current_location: 'Recepción' 
          },
          { 
            id: 2, 
            lot_number: '2024-002', 
            supplier: 'Finca La Esperanza', 
            variety: 'Caturra', 
            weight: 750, 
            status: 'processing' as const, 
            received_date: new Date().toISOString(), 
            expected_completion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
            quality_grade: 'A' as const, 
            notes: 'Buena calidad', 
            current_location: 'Procesamiento' 
          },
          { 
            id: 3, 
            lot_number: '2024-003', 
            supplier: 'Finca San José', 
            variety: 'Typica', 
            weight: 300, 
            status: 'fermenting' as const, 
            received_date: new Date().toISOString(), 
            expected_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
            quality_grade: 'AA' as const, 
            notes: 'Proceso de fermentación', 
            current_location: 'Fermentación' 
          },
          { 
            id: 4, 
            lot_number: '2024-004', 
            supplier: 'Finca Los Alpes', 
            variety: 'Geisha', 
            weight: 200, 
            status: 'completed' as const, 
            received_date: new Date().toISOString(), 
            expected_completion: new Date().toISOString(), 
            quality_grade: 'AA' as const, 
            notes: 'Proceso completado', 
            current_location: 'Almacén' 
          }
        ]
        setLots(initialLots)
        localStorage.setItem('coffeeLots', JSON.stringify(initialLots))
      }
    } catch (error) {
      console.error('Error fetching lots:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveLots = (updatedLots: Lot[]) => {
    localStorage.setItem('coffeeLots', JSON.stringify(updatedLots))
    setLots(updatedLots)
  }

  const handleCreateLot = () => {
    const newLot: Lot = {
      id: Math.max(...lots.map(l => l.id), 0) + 1,
      lot_number: formData.lot_number,
      supplier: formData.supplier,
      variety: formData.variety,
      weight: formData.weight,
      status: formData.status,
      received_date: new Date().toISOString(),
      expected_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quality_grade: formData.quality_grade,
      notes: formData.notes,
      current_location: formData.current_location
    }
    
    const updatedLots = [...lots, newLot]
    saveLots(updatedLots)
    setShowModal(false)
    resetForm()
  }

  const handleUpdateLot = () => {
    if (!editingLot) return
    
    const updatedLots = lots.map(lot => 
      lot.id === editingLot.id 
        ? {
            ...lot,
            lot_number: formData.lot_number,
            supplier: formData.supplier,
            variety: formData.variety,
            weight: formData.weight,
            status: formData.status,
            quality_grade: formData.quality_grade,
            notes: formData.notes,
            current_location: formData.current_location
          }
        : lot
    )
    
    saveLots(updatedLots)
    setEditingLot(null)
    setShowModal(false)
    resetForm()
  }

  const handleDeleteLot = (id: number) => {
    setLotToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (lotToDelete) {
      const updatedLots = lots.filter(lot => lot.id !== lotToDelete)
      saveLots(updatedLots)
      setShowDeleteConfirm(false)
      setLotToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      lot_number: '',
      supplier: '',
      variety: '',
      weight: 0,
      status: 'received',
      quality_grade: 'A',
      notes: '',
      current_location: ''
    })
  }

  const openEditModal = (lot: Lot) => {
    setEditingLot(lot)
    setFormData({
      lot_number: lot.lot_number,
      supplier: lot.supplier,
      variety: lot.variety,
      weight: lot.weight,
      status: lot.status,
      quality_grade: lot.quality_grade,
      notes: lot.notes,
      current_location: lot.current_location
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingLot(null)
    resetForm()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'fermenting': return 'bg-purple-100 text-purple-800'
      case 'drying': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Recibido'
      case 'processing': return 'Procesando'
      case 'fermenting': return 'Fermentando'
      case 'drying': return 'Secando'
      case 'completed': return 'Completado'
      default: return 'Desconocido'
    }
  }

  const getQualityColor = (grade: string) => {
    switch (grade) {
      case 'AA': return 'text-green-600'
      case 'A': return 'text-blue-600'
      case 'B': return 'text-yellow-600'
      case 'C': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.variety.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalWeight = lots.reduce((sum, lot) => sum + lot.weight, 0)
  const completedLots = lots.filter(lot => lot.status === 'completed').length
  const processingLots = lots.filter(lot => ['processing', 'fermenting', 'drying'].includes(lot.status)).length

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Gestión de Lotes</h1>
        <p className="text-gray-600">Administración completa de lotes de café</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <CubeIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-blue-700">Total Lotes</p>
              <p className="text-3xl font-bold text-blue-900">{lots.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <CheckCircleIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-green-700">Completados</p>
              <p className="text-3xl font-bold text-green-900">{completedLots}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg p-6 border border-yellow-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
              <ClockIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-yellow-700">En Proceso</p>
              <p className="text-3xl font-bold text-yellow-900">{processingLots}</p>
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
              <p className="text-3xl font-bold text-purple-900">{totalWeight}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, proveedor o variedad..."
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
              <option value="received">Recibido</option>
              <option value="processing">Procesando</option>
              <option value="fermenting">Fermentando</option>
              <option value="drying">Secando</option>
              <option value="completed">Completado</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 shadow-lg transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Lote
            </button>
          </div>
        </div>
      </div>

      {/* Lista de lotes mejorada */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredLots.map((lot) => (
          <div key={lot.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            {/* Header del lote */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                  <CubeIcon className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Lote #{lot.lot_number}</h3>
                  <p className="text-sm text-gray-500">ID: {lot.id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(lot.status)}`}>
                {getStatusText(lot.status)}
              </span>
            </div>

            {/* Información del lote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Proveedor</p>
                  <p className="font-semibold text-gray-900">{lot.supplier}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TagIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Variedad</p>
                  <p className="font-semibold text-gray-900">{lot.variety}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ScaleIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Peso</p>
                  <p className="font-semibold text-gray-900">{lot.weight}kg</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Calidad</p>
                  <p className={`font-semibold ${getQualityColor(lot.quality_grade)}`}>
                    {lot.quality_grade}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="font-semibold text-gray-900">{lot.current_location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Recibido</p>
                  <p className="font-semibold text-gray-900">{new Date(lot.received_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
                  
            {/* Notas */}
            {lot.notes && (
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Notas:</span> {lot.notes}
                </p>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <button 
                onClick={() => openEditModal(lot)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </button>
              <button 
                onClick={() => handleDeleteLot(lot.id)}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
              >
                <TrashIcon className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLots.length === 0 && (
        <div className="text-center py-16">
          <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <CubeIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay lotes registrados</h3>
          <p className="text-gray-500 mb-6">Comienza creando un nuevo lote de café para comenzar el seguimiento.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 mx-auto shadow-lg transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            Crear Primer Lote
          </button>
        </div>
      )}

      {/* Modal para crear/editar lote */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingLot ? 'Editar Lote' : 'Nuevo Lote'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              if (editingLot) {
                handleUpdateLot()
              } else {
                handleCreateLot()
              }
            }} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Lote *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lot_number}
                    onChange={(e) => setFormData({...formData, lot_number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: 2024-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Variedad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.variety}
                    onChange={(e) => setFormData({...formData, variety: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Bourbon, Caturra"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Peso en kilogramos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="received">Recibido</option>
                    <option value="processing">Procesando</option>
                    <option value="fermenting">Fermentando</option>
                    <option value="drying">Secando</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calidad *
                  </label>
                  <select
                    value={formData.quality_grade}
                    onChange={(e) => setFormData({...formData, quality_grade: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="AA">AA</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ubicación Actual
                </label>
                <input
                  type="text"
                  value={formData.current_location}
                  onChange={(e) => setFormData({...formData, current_location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Recepción, Procesamiento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Notas adicionales sobre el lote"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                >
                  {editingLot ? 'Actualizar Lote' : 'Crear Lote'}
                </button>
              </div>
            </form>
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
                ¿Estás seguro de que quieres eliminar este lote? Todos los datos asociados se perderán permanentemente.
              </p>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setLotToDelete(null)
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
