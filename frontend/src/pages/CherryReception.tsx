import React, { useState, useEffect, useRef } from 'react'
import { CameraIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Supplier {
  id: number
  name: string
  type: string
  status: string
}

interface CherryReception {
  id: number
  reception_code: string
  supplier: number
  supplier_details: Supplier
  weight_qq: number
  weight_lbs: number
  quality: string
  status: string
  ocr_processed: boolean
  ocr_confidence: number
  reception_date: string
}

export default function CherryReception() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [receptions, setReceptions] = useState<CherryReception[]>([])
  const [loading, setLoading] = useState(false)
  const [processingOCR, setProcessingOCR] = useState(false)
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [quality, setQuality] = useState('good')
  const [observations, setObservations] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    fetchSuppliers()
    fetchReceptions()
  }, [])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/?status=active')
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Error al cargar proveedores')
    }
  }

  const fetchReceptions = async () => {
    try {
      const response = await api.get('/cherry-reception/')
      setReceptions(response.data)
    } catch (error) {
      console.error('Error fetching receptions:', error)
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
          const file = new File([blob], 'scale-photo.jpg', { type: 'image/jpeg' })
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
    
    if (!selectedSupplier) {
      toast.error('Debe seleccionar un proveedor')
      return
    }
    
    if (!imageFile) {
      toast.error('Debe tomar o seleccionar una foto de la báscula')
      return
    }

    setLoading(true)
    setProcessingOCR(true)

    try {
      const formData = new FormData()
      formData.append('supplier', selectedSupplier)
      formData.append('scale_image', imageFile)
      formData.append('quality', quality)
      if (observations) formData.append('observations', observations)

      const response = await api.post('/cherry-reception/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('✅ Recepción registrada. Procesando OCR...')
      
      // Reset form
      setSelectedSupplier('')
      setQuality('good')
      setObservations('')
      setImageFile(null)
      setImagePreview(null)
      
      // Refrescar lista
      fetchReceptions()
      
      setTimeout(() => {
        setProcessingOCR(false)
        toast.success(`🎯 Peso extraído: ${response.data.weight_qq} qq`)
      }, 2000)

    } catch (error: any) {
      console.error('Error creating reception:', error)
      toast.error('Error al crear recepción: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🍒 Recepción de Cereza</h1>
        <p className="text-gray-600 mt-2">
          Registra la entrada de café cereza con detección automática de peso por OCR
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de registro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Nueva Recepción</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Captura de foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Báscula/Reloj *
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
                      className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Seleccionar Archivo
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
                          <p>Procesando OCR...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Calidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="excellent">Excelente</option>
                <option value="good">Bueno</option>
                <option value="regular">Regular</option>
                <option value="poor">Deficiente</option>
              </select>
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
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading || !selectedSupplier || !imageFile}
              className={`w-full px-6 py-3 rounded-md text-white font-semibold ${
                loading || !selectedSupplier || !imageFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Procesando...' : 'Registrar Recepción'}
            </button>
          </form>
        </div>

        {/* Lista de recepciones recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recepciones Recientes</h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {receptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay recepciones registradas
              </p>
            ) : (
              receptions.slice(0, 10).map((reception) => (
                <div
                  key={reception.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reception.reception_code}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reception.supplier_details?.name || 'N/A'}
                      </p>
                    </div>
                    {reception.ocr_processed ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Peso:</span>
                      <span className="ml-1 font-semibold">
                        {reception.weight_qq} qq
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Libras:</span>
                      <span className="ml-1 font-semibold">
                        {reception.weight_lbs} lbs
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Calidad:</span>
                      <span className="ml-1">{reception.quality}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                        reception.status === 'completed' ? 'bg-green-100 text-green-800' :
                        reception.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        reception.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reception.status}
                      </span>
                    </div>
                  </div>
                  
                  {reception.ocr_processed && (
                    <div className="mt-2 text-xs text-gray-500">
                      OCR Confianza: {reception.ocr_confidence}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

