import React, { useState, useEffect, useRef } from 'react'
import { CameraIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Lot {
  id: number
  code: string
  status: string
}

interface Transformation {
  id: number
  transformation_code: string
  lot: number | null
  lot_details: Lot | null
  weight_qq: number
  weight_lbs: number
  yield_percentage: number
  status: string
  ocr_processed: boolean
  ocr_weight_confidence: number
  ocr_yield_confidence: number
  transformation_date: string
}

export default function Transformation() {
  const [lots, setLots] = useState<Lot[]>([])
  const [transformations, setTransformations] = useState<Transformation[]>([])
  const [loading, setLoading] = useState(false)
  const [processingOCR, setProcessingOCR] = useState(false)
  
  // Form state
  const [selectedLot, setSelectedLot] = useState('')
  const [observations, setObservations] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    fetchLots()
    fetchTransformations()
  }, [])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const fetchLots = async () => {
    try {
      const response = await api.get('/lots/')
      setLots(response.data)
    } catch (error) {
      console.error('Error fetching lots:', error)
      toast.error('Error al cargar lotes')
    }
  }

  const fetchTransformations = async () => {
    try {
      const response = await api.get('/transformation/')
      setTransformations(response.data)
    } catch (error) {
      console.error('Error fetching transformations:', error)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('No se pudo acceder a la cámara')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'voucher-photo.jpg', { type: 'image/jpeg' })
          setImageFile(file)
          setImagePreview(canvas.toDataURL())
          stopCamera()
        }
      }, 'image/jpeg', 0.95)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile) {
      toast.error('Debe tomar o seleccionar una foto del vale')
      return
    }

    setLoading(true)
    setProcessingOCR(true)

    try {
      const formData = new FormData()
      if (selectedLot) formData.append('lot', selectedLot)
      formData.append('voucher_image', imageFile)
      if (observations) formData.append('observations', observations)

      const response = await api.post('/transformation/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('✅ Transformación registrada. Procesando OCR del vale...')
      
      // Reset form
      setSelectedLot('')
      setObservations('')
      setImageFile(null)
      setImagePreview(null)
      
      // Refrescar lista
      fetchTransformations()
      
      setTimeout(() => {
        setProcessingOCR(false)
        const weight = response.data.weight_qq || 'N/A'
        const yieldVal = response.data.yield_percentage || 'N/A'
        toast.success(`🎯 Datos extraídos - Peso: ${weight} qq | Rendimiento: ${yieldVal}%`)
      }, 2000)

    } catch (error: any) {
      console.error('Error creating transformation:', error)
      toast.error('Error al crear transformación: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Transformación de Café</h1>
        <p className="text-gray-600 mt-2">
          Registra el proceso de transformación con detección automática de peso y rendimiento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de registro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Nueva Transformación</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de lote (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote (Opcional)
              </label>
              <select
                value={selectedLot}
                onChange={(e) => setSelectedLot(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin lote asignado</option>
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.code} - {lot.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Captura de foto del vale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto del Vale *
              </label>
              
              <div className="space-y-3">
                {!showCamera && !imagePreview && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <CameraIcon className="h-5 w-5" />
                      Tomar Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center gap-2"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                      Seleccionar
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {showCamera && (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Capturar
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                    {processingOCR && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Extrayendo datos del vale...</p>
                          <p className="text-sm mt-1">Peso y Rendimiento</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                📝 El OCR extraerá automáticamente: Peso (qq) y Rendimiento (%)
              </p>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales sobre la transformación..."
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading || !imageFile}
              className={`w-full px-6 py-3 rounded-md text-white font-semibold ${
                loading || !imageFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Procesando OCR...' : 'Registrar Transformación'}
            </button>
          </form>
        </div>

        {/* Lista de transformaciones recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transformaciones Recientes</h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {transformations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay transformaciones registradas
              </p>
            ) : (
              transformations.slice(0, 10).map((transformation) => (
                <div
                  key={transformation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transformation.transformation_code}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transformation.lot_details?.code || 'Sin lote asignado'}
                      </p>
                    </div>
                    {transformation.ocr_processed ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2 bg-blue-50 p-2 rounded">
                      <span className="text-gray-600 font-medium">Rendimiento:</span>
                      <span className="ml-2 text-lg font-bold text-blue-700">
                        {transformation.yield_percentage}%
                      </span>
                      {transformation.ocr_yield_confidence > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          (confianza: {transformation.ocr_yield_confidence}%)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Peso:</span>
                      <span className="ml-1 font-semibold">
                        {transformation.weight_qq} qq
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Libras:</span>
                      <span className="ml-1 font-semibold">
                        {transformation.weight_lbs} lbs
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Estado:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                        transformation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transformation.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        transformation.status === 'verified' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transformation.status}
                      </span>
                    </div>
                  </div>
                  
                  {transformation.ocr_processed && transformation.ocr_weight_confidence > 0 && (
                    <div className="mt-2 flex gap-2 text-xs text-gray-500">
                      <span>OCR Peso: {transformation.ocr_weight_confidence}%</span>
                      <span>|</span>
                      <span>OCR Rendimiento: {transformation.ocr_yield_confidence}%</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Consejos para mejor OCR:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Asegúrate de que el vale esté bien iluminado</li>
          <li>• Toma la foto de frente (perpendicular)</li>
          <li>• Los números deben estar nítidos y legibles</li>
          <li>• El rendimiento típico está entre 15-25%</li>
          <li>• Si OCR falla, podrás corregir manualmente después</li>
        </ul>
      </div>
    </div>
  )
}

