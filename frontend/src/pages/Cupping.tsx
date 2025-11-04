import React, { useState, useEffect } from 'react'
import { 
  BeakerIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ScaleIcon,
  EyeIcon,
  FireIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserIcon,
  CameraIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import CuppingScoreForm from '../components/CuppingScoreForm'
import CuppingSampleManager from '../components/CuppingSampleManager'
import CuppingAnalysis from '../components/CuppingAnalysis'

interface CommercialCupping {
  id?: number
  numero_ingreso: string
  humedad: number | string
  rendimiento: number | string
  qq: number | string
  apariencia_verde: string
  tueste: string
  quakers: string
  tipo: string
  taza: string
  estado: string
  fecha_catacion: string
  observaciones?: string
  cupping_type: 'comercial'
  created_at?: string
  updated_at?: string
}

interface Cupping {
  id?: number
  name: string
  protocol: 'sca' | 'cva' | 'coe' | 'custom'
  blinding: 'none' | 'blind' | 'double'
  label_type: 'alpha' | 'numeric' | 'trilet'
  language: 'es' | 'en'
  status: 'draft' | 'open' | 'closed'
  description: string
  is_calibration: boolean
  is_realtime: boolean
  date: string
  opened_at?: string
  closed_at?: string
  creator?: number
  created_at?: string
  updated_at?: string
}

export default function Cupping() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'comercial' | 'especial'>('comercial')
  
  // Estados para Catación Comercial
  const [commercialCuppings, setCommercialCuppings] = useState<CommercialCupping[]>([])
  const [showCommercialModal, setShowCommercialModal] = useState(false)
  const [editingCommercial, setEditingCommercial] = useState<CommercialCupping | null>(null)
  const [commercialForm, setCommercialForm] = useState<Partial<CommercialCupping>>({
    numero_ingreso: '',
    humedad: '',
    rendimiento: '',
    qq: '',
    apariencia_verde: '',
    tueste: '',
    quakers: '',
    tipo: '',
    taza: '',
    estado: 'pendiente',
    fecha_catacion: new Date().toISOString().split('T')[0],
    observaciones: '',
    cupping_type: 'comercial'
  })
  
  // Estado para fotos
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  
  // Estados para Catación Especial
  const [specialCuppings, setSpecialCuppings] = useState<Cupping[]>([])
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [editingSpecial, setEditingSpecial] = useState<Cupping | null>(null)
  const [specialForm, setSpecialForm] = useState<Partial<Cupping>>({
    name: '',
    protocol: 'sca',
    blinding: 'blind',
    label_type: 'alpha',
    language: 'es',
    status: 'draft',
    description: '',
    is_calibration: false,
    is_realtime: true,
    date: new Date().toISOString().split('T')[0],
  })
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchCuppings()
  }, [])

  const fetchCuppings = async () => {
    try {
      setLoading(true)
      
      // Fetch commercial cuppings from API
      const commercialResponse = await api.get('/cupping/commercial/')
      const commercialData = commercialResponse.data.results || commercialResponse.data || []
      setCommercialCuppings(Array.isArray(commercialData) ? commercialData : [])
      
      // Fetch special cuppings from API
      const specialResponse = await api.get('/cupping/cuppings/')
      const specialData = specialResponse.data.results || specialResponse.data || []
      setSpecialCuppings(Array.isArray(specialData) ? specialData : [])
    } catch (error) {
      console.error('Error fetching cuppings:', error)
      toast.error('Error al cargar sesiones de catación')
      setCommercialCuppings([])
      setSpecialCuppings([])
    } finally {
      setLoading(false)
    }
  }

  // === FUNCIONES PARA CATACIÓN COMERCIAL ===
  
  const handleCreateCommercial = () => {
    setEditingCommercial(null)
    setCommercialForm({
      numero_ingreso: '',
      humedad: '',
      rendimiento: '',
      qq: '',
      apariencia_verde: '',
      tueste: '',
      quakers: '',
      tipo: '',
      taza: '',
      estado: 'pendiente',
      fecha_catacion: new Date().toISOString().split('T')[0],
      observaciones: '',
      cupping_type: 'comercial'
    })
    setPhotos([])
    setPhotoPreviews([])
    setShowCommercialModal(true)
  }

  const handleEditCommercial = (cupping: CommercialCupping) => {
    setEditingCommercial(cupping)
    setCommercialForm(cupping)
    setShowCommercialModal(true)
  }

  const handleSaveCommercial = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Convertir valores string a number para humedad, rendimiento y qq
      const formData = {
        ...commercialForm,
        humedad: commercialForm.humedad ? parseFloat(commercialForm.humedad.toString()) : 0,
        rendimiento: commercialForm.rendimiento ? parseFloat(commercialForm.rendimiento.toString()) : 0,
        qq: commercialForm.qq ? parseFloat(commercialForm.qq.toString()) : 0
      }
      
      if (editingCommercial) {
        await api.put(`/cupping/commercial/${editingCommercial.id}/`, formData)
        toast.success('Catación comercial actualizada')
      } else {
        await api.post('/cupping/commercial/', formData)
        toast.success('Catación comercial registrada')
      }
      
      fetchCuppings()
      setShowCommercialModal(false)
      setEditingCommercial(null)
    } catch (error: any) {
      console.error('Error saving commercial cupping:', error)
      const errorMessage = error.response?.data?.numero_ingreso?.[0] || 'Error al guardar catación comercial'
      toast.error(errorMessage)
    }
  }

  const handleDeleteCommercial = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta catación comercial?')) return
    
    try {
      await api.delete(`/cupping/commercial/${id}/`)
      toast.success('Catación comercial eliminada')
      fetchCuppings()
    } catch (error) {
      console.error('Error deleting commercial cupping:', error)
      toast.error('Error al eliminar catación comercial')
    }
  }

  // === FUNCIONES PARA FOTOS ===
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos = [...photos, ...files].slice(0, 5) // Máximo 5 fotos
    setPhotos(newPhotos)
    
    // Crear previews
    const newPreviews = newPhotos.map(file => URL.createObjectURL(file))
    setPhotoPreviews(newPreviews)
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviews = photoPreviews.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
  }

  // === FUNCIÓN PARA GENERAR PDF ===
  
  const generatePDF = async () => {
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify(commercialForm))
      
      // Agregar fotos al FormData
      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo)
      })
      
      const response = await api.post('/cupping/commercial/generate-pdf/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      })
      
      // Crear URL para descargar el PDF
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `catacion_comercial_${commercialForm.numero_ingreso}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF generado y descargado exitosamente')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar PDF')
    }
  }

  // === FUNCIONES PARA CATACIÓN ESPECIAL ===
  
  const handleCreateSpecial = () => {
    setEditingSpecial(null)
    setSpecialForm({
      name: '',
      protocol: 'sca',
        blinding: 'blind',
      label_type: 'alpha',
        language: 'es',
      status: 'draft',
      description: '',
      is_calibration: false,
      is_realtime: true,
      date: new Date().toISOString().split('T')[0],
    })
    setShowSpecialModal(true)
  }

  const handleEditSpecial = (cupping: Cupping) => {
    setEditingSpecial(cupping)
    setSpecialForm(cupping)
    setShowSpecialModal(true)
  }

  const handleSaveSpecial = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Debe iniciar sesión para crear sesiones de catación')
      return
    }
    
    try {
      const formData: any = { ...specialForm }
      
      // Convertir fecha a DateTime ISO con hora actual
      if (formData.date && !formData.date.includes('T')) {
        const dateObj = new Date(formData.date + 'T12:00:00')
        formData.date = dateObj.toISOString()
      }
      
      // Agregar creator solo si no existe (al crear)
      if (!editingSpecial) {
        formData.creator = user.id
      }
      
      if (editingSpecial) {
        await api.put(`/cupping/cuppings/${editingSpecial.id}/`, formData)
        toast.success('Sesión especial actualizada')
      } else {
        await api.post('/cupping/cuppings/', formData)
        toast.success('Sesión especial creada')
      }
      fetchCuppings()
      setShowSpecialModal(false)
      setEditingSpecial(null)
    } catch (error: any) {
      console.error('Error saving special cupping:', error)
      const errorMessage = error.response?.data?.name?.[0] || error.response?.data?.detail || 'Error al guardar sesión especial'
      toast.error(errorMessage)
    }
  }

  const handleDeleteSpecial = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta sesión especial?')) return
    
    try {
      await api.delete(`/cupping/cuppings/${id}/`)
      toast.success('Sesión especial eliminada')
      fetchCuppings()
    } catch (error) {
      console.error('Error deleting special cupping:', error)
      toast.error('Error al eliminar sesión especial')
    }
  }

  const handleOpenSession = async (id: number) => {
    try {
      await api.post(`/cupping/cuppings/${id}/open_session/`)
      toast.success('Sesión abierta - ¡Listo para catar!')
      fetchCuppings()
    } catch (error: any) {
      console.error('Error opening session:', error)
      const errorMessage = error.response?.data?.error || 'Error al abrir sesión'
      toast.error(errorMessage)
    }
  }

  const handleCloseSession = async (id: number) => {
    if (!confirm('¿Estás seguro de cerrar esta sesión? No podrás agregar más evaluaciones.')) return
    
    try {
      await api.post(`/cupping/cuppings/${id}/close_session/`)
      toast.success('Sesión cerrada exitosamente')
      fetchCuppings()
    } catch (error: any) {
      console.error('Error closing session:', error)
      const errorMessage = error.response?.data?.error || 'Error al cerrar sesión'
      toast.error(errorMessage)
    }
  }

  const [viewingSession, setViewingSession] = useState<Cupping | null>(null)
  const [sessionSamples, setSessionSamples] = useState<any[]>([])
  const [sessionScores, setSessionScores] = useState<any[]>([])
  const [sessionParticipants, setSessionParticipants] = useState<string[]>([])
  const [showScoreForm, setShowScoreForm] = useState(false)
  const [selectedSample, setSelectedSample] = useState<any | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')

  const handleViewSession = async (cupping: Cupping) => {
    setViewingSession(cupping)
    setSessionParticipants([user?.username || 'Invitado'])
    
    try {
      // Fetch samples from API
      const samplesResponse = await api.get(`/cupping/samples/?cupping_id=${cupping.id}`)
      const samplesData = samplesResponse.data.results || samplesResponse.data || []
      setSessionSamples(Array.isArray(samplesData) ? samplesData : [])
      
      // Fetch scores from API
      const scoresResponse = await api.get(`/cupping/scores/?sample__cupping=${cupping.id}`)
      const scoresData = scoresResponse.data.results || scoresResponse.data || []
      setSessionScores(Array.isArray(scoresData) ? scoresData : [])
    } catch (error) {
      console.error('Error fetching session data:', error)
      setSessionSamples([])
      setSessionScores([])
    }
    
    toast.success(`Sesión abierta: ${cupping.name}`)
  }

  const handleAddParticipant = () => {
    if (newParticipantName.trim() && !sessionParticipants.includes(newParticipantName.trim())) {
      setSessionParticipants([...sessionParticipants, newParticipantName.trim()])
      toast.success(`${newParticipantName} agregado a la sesión`)
      setNewParticipantName('')
      setShowAddParticipant(false)
    }
  }

  const handleRemoveParticipant = (name: string) => {
    if (name === user?.username) {
      toast.error('No puedes eliminarte a ti mismo de la sesión')
      return
    }
    setSessionParticipants(sessionParticipants.filter(p => p !== name))
    toast.success(`${name} removido de la sesión`)
  }

  const handleEvaluateSample = (sample: any) => {
    setSelectedSample(sample)
    setShowScoreForm(true)
  }

  const handleSubmitScore = async (scoreData: any) => {
    try {
      // Calcular puntaje total
      const total = scoreData.fragrance + scoreData.flavor + scoreData.aftertaste +
                   scoreData.acidity + scoreData.body + scoreData.uniformity +
                   scoreData.balance + scoreData.clean_cup + scoreData.sweetness +
                   scoreData.overall - scoreData.defects
      
      // Necesitamos crear o obtener un cupper primero
      const cupperResponse = await api.get('/cupping/cuppers/')
      const cuppersData = cupperResponse.data.results || cupperResponse.data || []
      const cuppersList = Array.isArray(cuppersData) ? cuppersData : []
      
      let cupper = cuppersList.find((c: any) => c.name === user?.username)
      
      if (!cupper) {
        // Crear cupper si no existe
        const newCupper = await api.post('/cupping/cuppers/', {
          name: user?.username || 'Invitado',
          role: 'taster',
          user: user?.id || null
        })
        cupper = newCupper.data
      }
      
      // Guardar score en API
      const scorePayload = {
        sample: selectedSample?.id,
        cupper: cupper.id,
        fragrance: parseFloat(scoreData.fragrance) || 0,
        aroma: parseFloat(scoreData.fragrance) || 0, // Usando el mismo valor
        flavor: parseFloat(scoreData.flavor) || 0,
        aftertaste: parseFloat(scoreData.aftertaste) || 0,
        acidity: parseFloat(scoreData.acidity) || 0,
        body: parseFloat(scoreData.body) || 0,
        uniformity: parseFloat(scoreData.uniformity) || 0,
        clean_cup: parseFloat(scoreData.clean_cup) || 0,
        sweetness: parseFloat(scoreData.sweetness) || 0,
        balance: parseFloat(scoreData.balance) || 0,
        overall: parseFloat(scoreData.overall) || 0,
        defects: scoreData.defects.toString(), // CharField
        descriptive_scores: { descriptors: scoreData.descriptive_scores || '' }, // JSONField
        affective_scores: {}, // JSONField
        notes: scoreData.notes || ''
      }
      
      console.log('Sending score payload:', scorePayload)
      const savedScore = await api.post('/cupping/scores/', scorePayload)
      
      // Agregar a la lista local con información completa
      const newScore = {
        ...savedScore.data,
        sample_name: selectedSample?.blind_code || '',
        cupper_name: user?.username || 'Invitado',
        total_score: total
      }
      
      setSessionScores([...sessionScores, newScore])
      toast.success('Evaluación guardada exitosamente')
      setShowScoreForm(false)
      setSelectedSample(null)
    } catch (error: any) {
      console.error('Error saving score:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error response (stringified):', JSON.stringify(error.response?.data, null, 2))
      
      // Log específico para el objeto details
      if (error.response?.data?.details) {
        console.error('Error details:', error.response.data.details)
        console.error('Error details (stringified):', JSON.stringify(error.response.data.details, null, 2))
      }
      
      // Manejar error de duplicación (puede estar en non_field_errors o details.non_field_errors)
      const nonFieldErrors = error.response?.data?.non_field_errors || 
                            error.response?.data?.details?.non_field_errors
      
      if (nonFieldErrors && nonFieldErrors.length > 0) {
        const errorMsg = nonFieldErrors[0]
        if (errorMsg.includes('único') || errorMsg.includes('unique') || errorMsg.includes('conjunto único')) {
          toast.error('Ya has evaluado esta muestra. Solo puedes evaluar cada muestra una vez.')
          setShowScoreForm(false)
          setSelectedSample(null)
          return
        }
      }
      
      // Mostrar todos los errores del backend
      let errorMessage = 'Error al guardar evaluación'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Manejar respuesta de error del middleware personalizado
        if (errorData.error && errorData.details) {
          // Extraer errores del objeto details
          const details = errorData.details
          const fieldErrors = Object.keys(details)
            .map(key => `${key}: ${Array.isArray(details[key]) ? details[key].join(', ') : details[key]}`)
            .join(' | ')
          
          errorMessage = fieldErrors || errorData.message || 'Error al guardar evaluación'
        } 
        // Manejar respuesta estándar de DRF
        else {
          const fieldErrors = Object.keys(errorData)
            .filter(key => key !== 'detail' && key !== 'error' && key !== 'message' && key !== 'timestamp' && key !== 'request_id')
            .map(key => `${key}: ${Array.isArray(errorData[key]) ? errorData[key].join(', ') : errorData[key]}`)
            .join(' | ')
          
          if (fieldErrors) {
            errorMessage = fieldErrors
          } else if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        }
      }
      
      toast.error(errorMessage)
    }
  }

  // === HELPERS ===
  
  const getStatusBadge = (status: string) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-green-100 text-green-800',
      closed: 'bg-blue-100 text-blue-800',
    }
    const labels = {
      pendiente: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      draft: 'Borrador',
      open: 'Abierta',
      closed: 'Cerrada',
    }
    return { 
      class: badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800', 
      label: labels[status as keyof typeof labels] || status 
    }
  }

  const getProtocolBadge = (protocol: string) => {
    const labels = {
      sca: 'SCA Clásico',
      cva: 'CVA 2024',
      coe: 'Cup of Excellence',
      custom: 'Personalizado',
    }
    return labels[protocol as keyof typeof labels] || protocol
  }

  const filteredCommercialCuppings = commercialCuppings.filter(cupping => {
    const matchesSearch = cupping.numero_ingreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cupping.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || cupping.estado === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredSpecialCuppings = specialCuppings.filter(cupping => {
    const matchesSearch = cupping.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || cupping.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
  return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Catación de Café</h1>
              <p className="text-amber-100">Gestión de sesiones de catación comercial y especial</p>
              </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <BeakerIcon className="h-8 w-8 text-white" />
              </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
              <button 
            onClick={() => setActiveTab('comercial')}
            className={`
              ${activeTab === 'comercial'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
            `}
          >
            ☕ Catación Comercial
              </button>
              <button 
            onClick={() => setActiveTab('especial')}
            className={`
              ${activeTab === 'especial'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
            `}
          >
            ⭐ Catación Especial
              </button>
        </nav>
            </div>

      {/* Stats */}
      {activeTab === 'comercial' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <BeakerIcon className="h-6 w-6 text-amber-600" />
          </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cataciones</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommercialCuppings.length}</p>
        </div>
      </div>
        </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommercialCuppings.filter(c => c.estado === 'pendiente').length}</p>
          </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommercialCuppings.filter(c => c.estado === 'aprobado').length}</p>
          </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XMarkIcon className="h-6 w-6 text-red-600" />
        </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rechazadas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommercialCuppings.filter(c => c.estado === 'rechazado').length}</p>
              </div>
              </div>
            </div>
              </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <BeakerIcon className="h-6 w-6 text-amber-600" />
            </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sesiones</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSpecialCuppings.length}</p>
              </div>
            </div>
              </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Abiertas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSpecialCuppings.filter(c => c.status === 'open').length}</p>
          </div>
        </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-blue-600" />
        </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cerradas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSpecialCuppings.filter(c => c.status === 'closed').length}</p>
                </div>
              </div>
                </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                  </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Borradores</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSpecialCuppings.filter(c => c.status === 'draft').length}</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
              placeholder={activeTab === 'comercial' ? 'Buscar por número de ingreso o tipo...' : 'Buscar sesiones por nombre...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
          <div className="flex gap-2">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              {activeTab === 'comercial' ? (
                <>
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </>
              ) : (
                <>
                    <option value="">Todos los estados</option>
                    <option value="draft">Borrador</option>
                    <option value="open">Abierta</option>
                    <option value="closed">Cerrada</option>
                </>
              )}
                  </select>
            <button
              onClick={activeTab === 'comercial' ? handleCreateCommercial : handleCreateSpecial}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-amber-700 hover:to-orange-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <PlusIcon className="h-5 w-5" />
              {activeTab === 'comercial' ? 'Nueva Catación' : 'Nueva Sesión'}
            </button>
                </div>
              </div>
            </div>

      {/* Content Grid */}
      {activeTab === 'comercial' ? (
        // Catación Comercial Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommercialCuppings.map((cupping) => {
            const statusBadge = getStatusBadge(cupping.estado)
            return (
              <div key={cupping.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Ingreso: {cupping.numero_ingreso}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ☕ {cupping.tipo}
                      </span>
              </div>
                          </div>
                          </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="h-4 w-4" />
                    <span>Humedad: {cupping.humedad}% | Rend: {cupping.rendimiento}%</span>
                          </div>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    <span>Verde: {cupping.apariencia_verde}</span>
                        </div>
                  <div className="flex items-center gap-2">
                    <FireIcon className="h-4 w-4" />
                    <span>Tueste: {cupping.tueste} | Quakers: {cupping.quakers}</span>
                        </div>
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="h-4 w-4" />
                    <span>Taza: {cupping.taza}</span>
                        </div>
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{new Date(cupping.fecha_catacion).toLocaleDateString('es-GT')}</span>
            </div>
          </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEditCommercial(cupping)}
                    className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCommercial(cupping.id!)}
                    className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Catación Especial Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecialCuppings.map((cupping) => {
            const statusBadge = getStatusBadge(cupping.status)
            return (
              <div key={cupping.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{cupping.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                        </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getProtocolBadge(cupping.protocol)}
                          </span>
                        </div>
                      </div>
                          </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{new Date(cupping.date).toLocaleDateString('es-GT')}</span>
                        </div>
                  {cupping.description && (
                    <p className="line-clamp-2">{cupping.description}</p>
                      )}
                    </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                  {cupping.status === 'draft' && (
                    <>
                          <button 
                        onClick={() => handleOpenSession(cupping.id!)}
                        className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Abrir Sesión
                          </button>
                          <button 
                        onClick={() => handleEditSpecial(cupping)}
                        className="py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                        onClick={() => handleDeleteSpecial(cupping.id!)}
                        className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                          </button>
                    </>
                  )}
                  
                  {cupping.status === 'open' && (
                    <>
                          <button 
                        onClick={() => handleViewSession(cupping)}
                        className="flex-1 py-2 px-3 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver Sesión
                          </button>
                      <button
                        onClick={() => handleCloseSession(cupping.id!)}
                        className="py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Cerrar Sesión"
                      >
                        <StopIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {cupping.status === 'closed' && (
                    <>
                  <button
                        onClick={() => handleViewSession(cupping)}
                        className="flex-1 py-2 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                        <EyeIcon className="h-4 w-4" />
                        Ver Resultados
                  </button>
                      <button
                        onClick={() => handleDeleteSpecial(cupping.id!)}
                        className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                      </div>
                      </div>
            )
          })}
                        </div>
                      )}

      {/* Empty States */}
      {activeTab === 'comercial' && filteredCommercialCuppings.length === 0 && (
            <div className="text-center py-12">
          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cataciones comerciales</h3>
              <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus ? 'No se encontraron resultados' : 'Comienza registrando una nueva catación'}
              </p>
                </div>
              )}

      {activeTab === 'especial' && filteredSpecialCuppings.length === 0 && (
            <div className="text-center py-12">
              <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay sesiones especiales</h3>
              <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus ? 'No se encontraron resultados' : 'Comienza creando una nueva sesión'}
              </p>
        </div>
      )}

      {/* Modal Catación Comercial */}
      {showCommercialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingCommercial ? 'Editar' : 'Nueva'} Catación Comercial
              </h2>
              <button onClick={() => setShowCommercialModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveCommercial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Número de Ingreso *
                  </label>
                  <input
                    type="text"
                    required
                    value={commercialForm.numero_ingreso}
                    onChange={(e) => setCommercialForm({ ...commercialForm, numero_ingreso: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ej: ING-2025-001"
                  />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ScaleIcon className="h-4 w-4" />
                    Humedad (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={commercialForm.humedad}
                    onChange={(e) => setCommercialForm({ ...commercialForm, humedad: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
              </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ScaleIcon className="h-4 w-4" />
                    Rendimiento (%) *
                  </label>
                    <input 
                    type="number"
                    step="0.01"
                      required
                    value={commercialForm.rendimiento}
                    onChange={(e) => setCommercialForm({ ...commercialForm, rendimiento: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
            </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ScaleIcon className="h-4 w-4" />
                    QQ (Peso en quintales) *
                  </label>
                    <input 
                    type="number"
                    step="0.01"
                      required
                      value={commercialForm.qq}
                      onChange={(e) => setCommercialForm({ ...commercialForm, qq: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
            </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    Apariencia Verde *
                  </label>
                  <select
                    required
                    value={commercialForm.apariencia_verde}
                    onChange={(e) => setCommercialForm({ ...commercialForm, apariencia_verde: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Muy Buena">Muy Buena</option>
                    <option value="Buena">Buena</option>
                    <option value="Regular">Regular</option>
                    <option value="Mala">Mala</option>
                    </select>
          </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FireIcon className="h-4 w-4" />
                    Tueste *
                  </label>
                  <select
                    required
                    value={commercialForm.tueste}
                    onChange={(e) => setCommercialForm({ ...commercialForm, tueste: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Claro">Claro</option>
                    <option value="Medio">Medio</option>
                    <option value="Oscuro">Oscuro</option>
                    <option value="Muy Oscuro">Muy Oscuro</option>
                    </select>
        </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quakers *</label>
                  <select
                    required
                    value={commercialForm.quakers}
                    onChange={(e) => setCommercialForm({ ...commercialForm, quakers: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="No">No</option>
                    <option value="Pocos">Pocos</option>
                    <option value="Varios">Varios</option>
                    <option value="Bastantes">Bastantes</option>
                  </select>
            </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <BeakerIcon className="h-4 w-4" />
                    Tipo *
                  </label>
                  <select
                    required
                    value={commercialForm.tipo}
                    onChange={(e) => setCommercialForm({ ...commercialForm, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Estrictamente Duro (SHB)">Estrictamente Duro (SHB)</option>
                    <option value="Duro (HB)">Duro (HB)</option>
                    <option value="Semi Duro">Semi Duro</option>
                    <option value="Extra Prime">Extra Prime</option>
                    <option value="Prime">Prime</option>
                    <option value="Supremo">Supremo</option>
                    <option value="Excelso">Excelso</option>
                    <option value="Otro">Otro</option>
                    </select>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <BeakerIcon className="h-4 w-4" />
                    Taza *
                  </label>
                    <input 
                    type="text"
                    required
                    value={commercialForm.taza}
                    onChange={(e) => setCommercialForm({ ...commercialForm, taza: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ej: Limpia, Dulce, Balanceada"
                  />
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    required
                    value={commercialForm.estado}
                    onChange={(e) => setCommercialForm({ ...commercialForm, estado: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Fecha de Catación *
                    </label>
                  <input
                    type="date"
                    required
                    value={commercialForm.fecha_catacion}
                    onChange={(e) => setCommercialForm({ ...commercialForm, fecha_catacion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    value={commercialForm.observaciones}
                    onChange={(e) => setCommercialForm({ ...commercialForm, observaciones: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                  </div>

                  {/* Sección de Fotos */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <CameraIcon className="h-4 w-4" />
                      Fotos del Café (Máximo 5)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    
                    {/* Preview de fotos */}
                    {photoPreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
        </div>
      )}
                  </div>
                </div>

              <div className="flex gap-3 pt-4">
                <button 
                    type="button"
                  onClick={() => setShowCommercialModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Generar PDF
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium"
                >
                  {editingCommercial ? 'Actualizar' : 'Registrar'} Catación
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Catación Especial */}
      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingSpecial ? 'Editar' : 'Nueva'} Sesión Especial
              </h2>
              <button onClick={() => setShowSpecialModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            <form onSubmit={handleSaveSpecial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Nombre de la Sesión *
                  </label>
                    <input 
                      type="text" 
                      required
                    value={specialForm.name}
                    onChange={(e) => setSpecialForm({ ...specialForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ej: Catación Especial - Geisha 2025"
                    />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <BeakerIcon className="h-4 w-4" />
                    Protocolo *
                  </label>
                  <select
                    required
                    value={specialForm.protocol}
                    onChange={(e) => setSpecialForm({ ...specialForm, protocol: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="sca">SCA Clásico</option>
                    <option value="cva">CVA 2024</option>
                    <option value="coe">Cup of Excellence</option>
                    <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    Tipo de Cegado *
                  </label>
                  <select
                    required
                    value={specialForm.blinding}
                    onChange={(e) => setSpecialForm({ ...specialForm, blinding: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                      <option value="none">No ciego</option>
                      <option value="blind">Ciego</option>
                      <option value="double">Doble ciego</option>
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Fecha de Catación *
                  </label>
                  <input
                    type="date"
                    required
                    value={specialForm.date}
                    onChange={(e) => setSpecialForm({ ...specialForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    required
                    value={specialForm.status}
                    onChange={(e) => setSpecialForm({ ...specialForm, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="draft">Borrador</option>
                    <option value="open">Abierta</option>
                    <option value="closed">Cerrada</option>
                    </select>
                  </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Descripción
                  </label>
                  <textarea
                    value={specialForm.description}
                    onChange={(e) => setSpecialForm({ ...specialForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={3}
                    placeholder="Descripción de la sesión de catación especial..."
                  />
                          </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                        checked={specialForm.is_calibration}
                        onChange={(e) => setSpecialForm({ ...specialForm, is_calibration: e.target.checked })}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Es calibración</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={specialForm.is_realtime}
                        onChange={(e) => setSpecialForm({ ...specialForm, is_realtime: e.target.checked })}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">Tiempo real</span>
                    </label>
                        </div>
                  </div>
                </div>

              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                  onClick={() => setShowSpecialModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium"
                >
                  {editingSpecial ? 'Actualizar' : 'Crear'} Sesión
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal de Sesión de Catación Activa */}
      {viewingSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center rounded-t-xl flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold">{viewingSession.name}</h2>
                <div className="flex gap-4 text-sm text-amber-100 mt-2">
                  <span>Protocolo: {getProtocolBadge(viewingSession.protocol)}</span>
                  <span>Estado: {getStatusBadge(viewingSession.status).label}</span>
                  <span>Catador: {user?.username || 'Invitado'}</span>
                </div>
              </div>
                <button 
                onClick={() => setViewingSession(null)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Panel de Participantes */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Catadores ({sessionParticipants.length})
                    </h3>
                  </div>
                  {viewingSession.status === 'open' && (
                    <button
                      onClick={() => setShowAddParticipant(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Agregar
                    </button>
                  )}
                  </div>

                <div className="flex flex-wrap gap-2">
                  {sessionParticipants.map((participant) => (
                    <div 
                      key={participant}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg"
                    >
                      <UserIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{participant}</span>
                      {participant !== user?.username && viewingSession.status === 'open' && (
                        <button
                          onClick={() => handleRemoveParticipant(participant)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                      {participant === user?.username && (
                        <span className="text-xs text-blue-600 font-medium">(Tú)</span>
                      )}
                  </div>
                  ))}
                </div>

                {/* Mini modal para agregar participante */}
                {showAddParticipant && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Catador
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Juan Pérez"
                        autoFocus
                      />
                      <button
                        onClick={handleAddParticipant}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setShowAddParticipant(false)
                          setNewParticipantName('')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                            </div>
                            </div>
                )}
                          </div>

              <CuppingSampleManager
                sessionId={viewingSession.id!}
                samples={sessionSamples}
                onSamplesChange={setSessionSamples}
                isBlind={viewingSession.blinding !== 'none'}
              />

              {/* Lista de Muestras para Evaluar */}
              {sessionSamples.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluar Muestras</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sessionSamples.map((sample) => (
                      <button
                        key={sample.blind_code}
                        onClick={() => handleEvaluateSample(sample)}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all"
                      >
                        <div className="text-3xl font-bold text-amber-600 mb-2">
                          {sample.blind_code}
                          </div>
                        <div className="text-sm text-gray-600">
                          Click para evaluar
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder para cuando no hay muestras */}
              {sessionSamples.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BeakerIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium">No hay muestras agregadas</p>
                  <p className="text-sm">Usa el botón "+ Agregar Muestra" para comenzar</p>
                          </div>
              )}
                          </div>

            {/* Footer con botones */}
            <div className="border-t p-4 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                {sessionSamples.length} muestras • {sessionScores.length} evaluaciones
                        </div>
              <div className="flex gap-2">
                {sessionScores.length > 0 && (
                  <button
                    onClick={() => setShowAnalysis(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    Ver Análisis
                  </button>
                )}
                {viewingSession.status === 'open' && (
                  <button
                    onClick={() => handleCloseSession(viewingSession.id!)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Cerrar Sesión
                  </button>
                )}
                <button
                  onClick={() => setViewingSession(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario de Evaluación */}
      {showScoreForm && selectedSample && (
        <CuppingScoreForm
          sampleId={selectedSample.id}
          sampleName={selectedSample.blind_code}
          cupper={user?.username || 'Invitado'}
          onSubmit={handleSubmitScore}
          onCancel={() => {
            setShowScoreForm(false)
            setSelectedSample(null)
          }}
        />
      )}

      {/* Modal de Análisis y Resultados */}
      {showAnalysis && viewingSession && (
        <CuppingAnalysis
          session={{
            id: viewingSession.id!,
            name: viewingSession.name,
            protocol: viewingSession.protocol,
            blinding: viewingSession.blinding,
            status: viewingSession.status,
            date: viewingSession.date,
            description: viewingSession.description
          }}
          scores={sessionScores}
          samples={sessionSamples}
          participants={sessionParticipants}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  )
}
