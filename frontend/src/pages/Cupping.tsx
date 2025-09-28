import React, { useState, useEffect } from 'react'
import { 
  BeakerIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  StarIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import logTracker from '../utils/logTracker'

interface CommercialCupping {
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
  observaciones: string
  lot_id?: string
}

export default function Cupping() {
  const [cuppingType, setCuppingType] = useState<'comercial' | 'especial' | null>(null)
  
  // Estados para catación comercial
  const [commercialCuppings, setCommercialCuppings] = useState<CommercialCupping[]>([])
  const [historicalCuppings, setHistoricalCuppings] = useState<any[]>([])
  const [showCommercialForm, setShowCommercialForm] = useState(false)
  const [commercialActiveTab, setCommercialActiveTab] = useState<'current' | 'history'>('current')
  const [commercialForm, setCommercialForm] = useState<Partial<CommercialCupping>>({
    numero_ingreso: '',
    peso_quintales: 0,
    rendimiento: 0,
    humedad: 0,
    apariencia_verde: '',
    tueste: '',
    quakers: 0,
    estado: '',
    tipo: '',
    taza: '',
    fecha_catacion: new Date().toISOString().split('T')[0],
    catador: '',
    observaciones: ''
  })
  const [editingCupping, setEditingCupping] = useState<CommercialCupping | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [selectedCuppingDetails, setSelectedCuppingDetails] = useState<any>(null)

  useEffect(() => {
    fetchCommercialCuppings()
    fetchHistoricalCuppings()
    
    // Track module access
    logTracker.trackSystemEvent('Module Access', 'Cupping', 'info', 'Usuario accedió al módulo de Catación')
  }, [])

  const fetchHistoricalCuppings = async () => {
    try {
      const storedHistorical = localStorage.getItem('historicalCommercialCuppings')
      if (storedHistorical) {
        const parsed = JSON.parse(storedHistorical)
        setHistoricalCuppings(parsed)
      }
    } catch (error) {
      console.error('Error fetching historical cuppings:', error)
    }
  }

  const fetchCommercialCuppings = async () => {
    try {
      const storedCuppings = localStorage.getItem('cattedLots')
      if (storedCuppings) {
        const parsed = JSON.parse(storedCuppings)
        const commercialOnly = parsed.filter((lot: any) => lot.isCommercialCupping)
        setCommercialCuppings(commercialOnly)
      }
    } catch (error) {
      console.error('Error fetching commercial cuppings:', error)
    }
  }

  const handleCommercialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!commercialForm.numero_ingreso || !commercialForm.peso_quintales || !commercialForm.catador || !commercialForm.estado) {
        toast.error('Por favor complete todos los campos requeridos (*)', {
          duration: 4000,
          style: {
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          },
        })
        return
      }

      if (editingCupping) {
        // Actualizar catación existente
        const updatedCuppings = commercialCuppings.map(cupping => 
          cupping.id === editingCupping.id 
            ? { ...cupping, ...commercialForm }
            : cupping
        )
        setCommercialCuppings(updatedCuppings)
        
        // Actualizar en localStorage
        const storedCuppings = localStorage.getItem('cattedLots')
        if (storedCuppings) {
          const allCuppings = JSON.parse(storedCuppings)
          const updatedAllCuppings = allCuppings.map((lot: any) => 
            lot.id === editingCupping.id 
              ? { ...lot, ...commercialForm }
              : lot
          )
          localStorage.setItem('cattedLots', JSON.stringify(updatedAllCuppings))
        }
        
        setEditingCupping(null)
        
        // Track log for update
        logTracker.trackCRUD('update', 'Commercial Cupping', editingCupping.id, 'Cupping', 
          `Catación comercial actualizada: ${commercialForm.numero_ingreso}`)
        
        toast.success('Catación comercial actualizada exitosamente', {
          duration: 3000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          },
          icon: '✅',
        })
      } else {
        // Crear nueva catación
        const newId = commercialCuppings.length > 0 ? Math.max(...commercialCuppings.map(c => c.id)) + 1 : 1
        const lotId = `LOT-${new Date().getFullYear()}-${String(newId).padStart(3, '0')}`
        
        const newCupping: CommercialCupping = {
          id: newId,
          ...commercialForm as CommercialCupping,
          lot_id: lotId
        }

        const updatedCuppings = [...commercialCuppings, newCupping]
        setCommercialCuppings(updatedCuppings)

        // Guardar en localStorage para cattedLots
        const storedCuppings = localStorage.getItem('cattedLots')
        const existingCuppings = storedCuppings ? JSON.parse(storedCuppings) : []
        const newLotEntry = {
          ...newCupping,
          isCommercialCupping: true,
          status: 'available'
        }
        existingCuppings.push(newLotEntry)
        localStorage.setItem('cattedLots', JSON.stringify(existingCuppings))

        // Guardar en historial
        const historicalEntry = {
          ...newCupping,
          registrationDate: new Date().toLocaleString(),
          status: 'completed'
        }
        const updatedHistorical = [...historicalCuppings, historicalEntry]
        setHistoricalCuppings(updatedHistorical)
        localStorage.setItem('historicalCommercialCuppings', JSON.stringify(updatedHistorical))
        
        // Track log for creation
        logTracker.trackCRUD('create', 'Commercial Cupping', newId, 'Cupping', 
          `Nueva catación comercial registrada: ${commercialForm.numero_ingreso} - ${commercialForm.peso_quintales} quintales`)
        
        toast.success('Catación comercial registrada exitosamente', {
          duration: 3000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          },
          icon: '☕',
        })
      }

      // Limpiar formulario y cerrar
      setCommercialForm({
        numero_ingreso: '',
        peso_quintales: 0,
        rendimiento: 0,
        humedad: 0,
        apariencia_verde: '',
        tueste: '',
        quakers: 0,
        estado: '',
        tipo: '',
        taza: '',
        fecha_catacion: new Date().toISOString().split('T')[0],
        catador: '',
        observaciones: ''
      })
      setShowCommercialForm(false)
    } catch (error) {
      console.error('Error saving commercial cupping:', error)
      toast.error('Error al guardar la catación comercial', {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        },
        icon: '❌',
      })
    }
  }

  const handleEditCupping = (cupping: CommercialCupping) => {
    setEditingCupping(cupping)
    setCommercialForm({
      numero_ingreso: cupping.numero_ingreso,
      peso_quintales: cupping.peso_quintales,
      rendimiento: cupping.rendimiento,
      humedad: cupping.humedad,
      apariencia_verde: cupping.apariencia_verde,
      tueste: cupping.tueste,
      quakers: cupping.quakers,
      estado: cupping.estado,
      tipo: cupping.tipo,
      taza: cupping.taza,
      fecha_catacion: cupping.fecha_catacion,
      catador: cupping.catador,
      observaciones: cupping.observaciones
    })
    
    // Track log for starting edit
    logTracker.trackCRUD('read', 'Commercial Cupping', cupping.id, 'Cupping', 
      `Inicio de edición de catación: ${cupping.numero_ingreso}`)
    setShowCommercialForm(true)
  }

  const handleDeleteCupping = (cuppingId: number) => {
    if (showDeleteConfirm === cuppingId) {
      // Eliminar de commercialCuppings
      const updatedCuppings = commercialCuppings.filter(c => c.id !== cuppingId)
      setCommercialCuppings(updatedCuppings)
      
      // Eliminar de localStorage cattedLots
      const storedCuppings = localStorage.getItem('cattedLots')
      if (storedCuppings) {
        const allCuppings = JSON.parse(storedCuppings)
        const filteredCuppings = allCuppings.filter((lot: any) => lot.id !== cuppingId)
        localStorage.setItem('cattedLots', JSON.stringify(filteredCuppings))
      }
      
      // Marcar como eliminado en el historial (soft delete)
      const updatedHistorical = historicalCuppings.map(h => 
        h.id === cuppingId ? { ...h, status: 'deleted' } : h
      )
      setHistoricalCuppings(updatedHistorical)
      localStorage.setItem('historicalCommercialCuppings', JSON.stringify(updatedHistorical))
      
      // Track log for deletion
      logTracker.trackCRUD('delete', 'Commercial Cupping', cuppingId, 'Cupping', 
        `Catación comercial eliminada: ID ${cuppingId}`)
      
      toast.success('Catación comercial eliminada exitosamente', {
        duration: 3000,
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        },
        icon: '🗑️',
      })
    }
    setShowDeleteConfirm(null)
  }

  const handleCancelEdit = () => {
    setEditingCupping(null)
    setCommercialForm({
      numero_ingreso: '',
      peso_quintales: 0,
      rendimiento: 0,
      humedad: 0,
      apariencia_verde: '',
      tueste: '',
      quakers: 0,
      estado: '',
      tipo: '',
      taza: '',
      fecha_catacion: new Date().toISOString().split('T')[0],
      catador: '',
      observaciones: ''
    })
  }

  const handleViewDetails = (cupping: any) => {
    setSelectedCuppingDetails(cupping)
    setShowDetailsModal(true)
    
    // Track log for viewing details
    logTracker.trackCRUD('read', 'Commercial Cupping', cupping.id, 'Cupping', 
      `Visualización de detalles de catación: ${cupping.numero_ingreso}`)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedCuppingDetails(null)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">☕ Catación de Café</h1>
        <p className="text-gray-600">Gestiona las cataciones comerciales y especiales de café.</p>
              </div>

      {/* Selección de Tipo de Catación */}
      {!cuppingType && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Selecciona el Tipo de Catación</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
              onClick={() => {
                setCuppingType('comercial')
                setShowCommercialForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <BeakerIcon className="h-6 w-6" />
              Catación Comercial
              </button>
            
              <button 
              onClick={() => setCuppingType('especial')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
              <StarIcon className="h-6 w-6" />
              Catación Especial
              </button>
            </div>
          </div>
      )}

      {/* Botón para cambiar tipo de catación */}
      {cuppingType && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {cuppingType === 'comercial' ? (
                <BeakerIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <StarIcon className="h-5 w-5 text-green-600" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {cuppingType === 'comercial' ? 'Catación Comercial' : 'Catación Especial'}
                </h3>
                <p className="text-sm text-gray-600">
                  {cuppingType === 'comercial' 
                    ? 'Evaluación estándar para café comercial' 
                    : 'Evaluación detallada para café especial'
                  }
                </p>
        </div>
            </div>
            <button
              onClick={() => setCuppingType(null)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm"
            >
              Cambiar Tipo
            </button>
            </div>
          </div>
      )}

      {/* Formulario de Catación Comercial */}
      {showCommercialForm && cuppingType === 'comercial' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingCupping ? 'Editar Catación Comercial' : 'Formulario de Catación Comercial'}
            </h2>
            <div className="flex items-center gap-3">
              <button
            onClick={() => {
                  setShowCommercialForm(false)
                  setCommercialActiveTab('history')
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                Ver Historial
              </button>
              {editingCupping && (
                <button
                  onClick={handleCancelEdit}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                >
                  Cancelar Edición
                </button>
              )}
              <button
                onClick={() => setShowCommercialForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleCommercialSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Número de Ingreso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Ingreso *
                </label>
                <input
                  type="text"
                  required
                  value={commercialForm.numero_ingreso || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, numero_ingreso: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: ING-2024-001"
                />
        </div>

              {/* Peso en Quintales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso en Quintales *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={commercialForm.peso_quintales || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, peso_quintales: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
              </div>

              {/* Rendimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rendimiento (%) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  value={commercialForm.rendimiento || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, rendimiento: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Humedad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Humedad (%) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="5"
                  max="20"
                  value={commercialForm.humedad || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, humedad: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
                <p className="text-xs text-gray-500 mt-1">Rango permitido: 5% - 20%</p>
            </div>

              {/* Apariencia Verde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apariencia Verde *
                </label>
                <select
                  required
                  value={commercialForm.apariencia_verde || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, apariencia_verde: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Deficiente">Deficiente</option>
                </select>
              </div>

              {/* Tueste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tueste *
                </label>
                <select
                  required
                  value={commercialForm.tueste || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, tueste: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Claro">Claro</option>
                  <option value="Medio">Medio</option>
                  <option value="Oscuro">Oscuro</option>
                </select>
            </div>

              {/* Quakers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quakers *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={commercialForm.quakers || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, quakers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  required
                  value={commercialForm.estado || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, estado: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Condicionado">Condicionado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
            </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  required
                  value={commercialForm.tipo || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, tipo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Prime">Prime</option>
                  <option value="Extra-Prime">Extra-Prime</option>
                  <option value="Semi-Duro">Semi-Duro</option>
                  <option value="Duro">Duro</option>
                  <option value="Estricto">Estricto</option>
                  <option value="Estrictamente Duro">Estrictamente Duro</option>
                </select>
        </div>

              {/* Taza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taza *
                </label>
                <select
                  required
                  value={commercialForm.taza || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, taza: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Deficiente">Deficiente</option>
                </select>
          </div>

              {/* Fecha de Catación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Catación *
                </label>
                <input
                  type="date"
                  required
                  value={commercialForm.fecha_catacion || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, fecha_catacion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
        </div>

              {/* Catador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catador *
                </label>
                <input
                  type="text"
                  required
                  value={commercialForm.catador || ''}
                  onChange={(e) => setCommercialForm({...commercialForm, catador: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del catador"
                />
                </div>
              </div>
              
            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                rows={3}
                value={commercialForm.observaciones || ''}
                onChange={(e) => setCommercialForm({...commercialForm, observaciones: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observaciones adicionales..."
              />
                </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowCommercialForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCupping ? 'Actualizar Catación' : 'Registrar Catación'}
              </button>
                  </div>
          </form>
                </div>
              )}

      {/* Contenido de Catación Comercial */}
      {cuppingType === 'comercial' && !showCommercialForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Catación Comercial</h2>
            <button
              onClick={() => setShowCommercialForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Catación
            </button>
                </div>

          {/* Tabs para Lotes Actuales e Historial */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCommercialActiveTab('current')}
                className={`${
                  commercialActiveTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Lotes Actuales ({commercialCuppings.length})
              </button>
              <button
                onClick={() => setCommercialActiveTab('history')}
                className={`${
                  commercialActiveTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Historial ({historicalCuppings.filter(h => h.status !== 'deleted').length})
              </button>
            </nav>
            </div>

          {/* Contenido de las tabs */}
          {commercialActiveTab === 'current' && (
            <div>
              {commercialCuppings.length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cataciones comerciales</h3>
                  <p className="text-gray-500 mb-6">Comienza registrando tu primera catación comercial.</p>
                  <button
                    onClick={() => setShowCommercialForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Catación
                  </button>
              </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número Ingreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lote ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso (qq)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catador
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                      {commercialCuppings.map((cupping) => (
                        <tr key={cupping.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cupping.numero_ingreso}
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.lot_id}
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.peso_quintales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cupping.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                              cupping.estado === 'Condicionado' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cupping.estado}
                        </span>
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.tipo}
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.catador}
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(cupping.fecha_catacion).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                          <button 
                                onClick={() => handleEditCupping(cupping)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                                onClick={() => setShowDeleteConfirm(cupping.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                          </button>
                              {cupping.estado === 'Aprobado' && (
                          <button 
                                  onClick={() => window.location.href = '/lot-integration'}
                                  className="text-green-600 hover:text-green-900"
                                  title="Ir a Integración"
                                >
                                  <ArrowsRightLeftIcon className="h-4 w-4" />
                          </button>
                              )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              )}
        </div>
      )}

          {commercialActiveTab === 'history' && (
                <div>
              {historicalCuppings.filter(h => h.status !== 'deleted').length === 0 ? (
                <div className="text-center py-12">
                  <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial de cataciones</h3>
                  <p className="text-gray-500">El historial aparecerá cuando registres cataciones comerciales.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número Ingreso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lote ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peso (qq)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Catación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Registro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historicalCuppings.filter(h => h.status !== 'deleted').map((cupping) => (
                        <tr key={cupping.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cupping.numero_ingreso}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.lot_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.peso_quintales}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cupping.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                              cupping.estado === 'Condicionado' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {cupping.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.catador}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(cupping.fecha_catacion).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {cupping.registrationDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                              onClick={() => handleViewDetails(cupping)}
                              className="text-blue-600 hover:text-blue-900"
                  >
                              <EyeIcon className="h-4 w-4" />
                  </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                          TOTAL GENERAL
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {historicalCuppings.filter(h => h.status !== 'deleted').reduce((sum, cupping) => sum + (cupping.peso_quintales || 0), 0)} qq
                        </td>
                        <td colSpan={5} className="px-6 py-4 text-sm text-gray-600">
                          {historicalCuppings.filter(h => h.status !== 'deleted').length} {historicalCuppings.filter(h => h.status !== 'deleted').length === 1 ? 'catación registrada' : 'cataciones registradas'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar esta catación comercial? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCupping(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showDetailsModal && selectedCuppingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles Completos de la Catación
              </h3>
                <button 
                onClick={handleCloseDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Número de Ingreso:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.numero_ingreso}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Lote ID:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.lot_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Peso en Quintales:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.peso_quintales} qq</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Catador:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.catador}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Fecha de Catación:</span>
                    <p className="text-gray-900">{new Date(selectedCuppingDetails.fecha_catacion).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedCuppingDetails.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                      selectedCuppingDetails.estado === 'Condicionado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCuppingDetails.estado}
                    </span>
                  </div>
                  </div>
                </div>

              {/* Características de Calidad */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Características de Calidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Rendimiento:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.rendimiento}%</p>
                </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Humedad:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.humedad}%</p>
            </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Apariencia Verde:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.apariencia_verde}</p>
          </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Tueste:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.tueste}</p>
        </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Quakers:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.quakers}</p>
              </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Taza:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.taza}</p>
                  </div>
                  </div>
                </div>

              {/* Clasificación */}
                <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Clasificación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                    <span className="text-sm font-medium text-gray-500">Tipo:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.tipo}</p>
                            </div>
                            </div>
                          </div>

              {/* Observaciones */}
              {selectedCuppingDetails.observaciones && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedCuppingDetails.observaciones}
                  </p>
                          </div>
              )}

              {/* Información del Sistema */}
                <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Fecha de Registro:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.registrationDate}</p>
                          </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estado del Registro:</span>
                    <p className="text-gray-900">{selectedCuppingDetails.status === 'completed' ? 'Completado' : 'Pendiente'}</p>
                          </div>
                        </div>
                      </div>
                  </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDetailsModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
