import React, { useState } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../services/api'

export interface CuppingSample {
  id?: number
  blind_code: string
  order: number
  origin?: string
  variety?: string
  process?: string
  harvest?: string
  roast_date?: string
  roast_profile?: string
  water?: string
  grind?: string
  ratio?: string
  temperature?: string
  lot?: number
}

interface CuppingSampleManagerProps {
  sessionId: number
  samples: CuppingSample[]
  onSamplesChange: (samples: CuppingSample[]) => void
  isBlind: boolean
}

export default function CuppingSampleManager({ sessionId, samples, onSamplesChange, isBlind }: CuppingSampleManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSample, setEditingSample] = useState<CuppingSample | null>(null)
  const [revealedSamples, setRevealedSamples] = useState<Set<string>>(new Set())
  const [sampleForm, setSampleForm] = useState<Partial<CuppingSample>>({
    blind_code: '',
    order: samples.length + 1,
    origin: '',
    variety: '',
    process: '',
    harvest: '',
    roast_date: '',
    roast_profile: '',
    water: 'Filtrada',
    grind: 'Medio',
    ratio: '1:16',
    temperature: '93°C'
  })

  const generateBlindCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return code
  }

  const handleAddSample = () => {
    setEditingSample(null)
    setSampleForm({
      blind_code: generateBlindCode(),
      order: samples.length + 1,
      origin: '',
      variety: '',
      process: '',
      harvest: '',
      roast_date: '',
      roast_profile: '',
      water: 'Filtrada',
      grind: 'Medio',
      ratio: '1:16',
      temperature: '93°C'
    })
    setShowForm(true)
  }

  const handleEditSample = (sample: CuppingSample) => {
    setEditingSample(sample)
    setSampleForm(sample)
    setShowForm(true)
  }

  const handleSaveSample = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sampleForm.blind_code) {
      toast.error('El código ciego es requerido')
      return
    }

    try {
      const sampleData = {
        ...sampleForm,
        cupping: sessionId
      }

      if (editingSample && editingSample.id) {
        // Actualizar muestra existente
        const response = await api.put(`/cupping/samples/${editingSample.id}/`, sampleData)
        const updated = samples.map(s => 
          s.id === editingSample.id ? response.data : s
        )
        onSamplesChange(updated)
        toast.success('Muestra actualizada')
      } else {
        // Crear nueva muestra
        const response = await api.post('/cupping/samples/', sampleData)
        onSamplesChange([...samples, response.data])
        toast.success('Muestra agregada')
      }
      
      setShowForm(false)
      setEditingSample(null)
    } catch (error: any) {
      console.error('Error saving sample:', error)
      const errorMessage = error.response?.data?.blind_code?.[0] || 'Error al guardar muestra'
      toast.error(errorMessage)
    }
  }

  const handleDeleteSample = async (blindCode: string) => {
    if (!confirm('¿Eliminar esta muestra?')) return
    
    try {
      const sample = samples.find(s => s.blind_code === blindCode)
      if (sample?.id) {
        await api.delete(`/cupping/samples/${sample.id}/`)
      }
      onSamplesChange(samples.filter(s => s.blind_code !== blindCode))
      toast.success('Muestra eliminada')
    } catch (error) {
      console.error('Error deleting sample:', error)
      toast.error('Error al eliminar muestra')
    }
  }

  const toggleRevealSample = (blindCode: string) => {
    const newRevealed = new Set(revealedSamples)
    if (newRevealed.has(blindCode)) {
      newRevealed.delete(blindCode)
    } else {
      newRevealed.add(blindCode)
    }
    setRevealedSamples(newRevealed)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Muestras de Catación</h3>
          <p className="text-sm text-gray-500">Total: {samples.length} muestras</p>
        </div>
        <button
          onClick={handleAddSample}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Agregar Muestra
        </button>
      </div>

      {/* Lista de Muestras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {samples.map((sample) => {
          const isRevealed = revealedSamples.has(sample.blind_code)
          
          return (
            <div key={sample.blind_code} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
              {/* Código Ciego */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-lg font-bold">
                    {sample.blind_code}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Orden: #{sample.order}</p>
                </div>
                <div className="flex gap-1">
                  {isBlind && (
                    <button
                      onClick={() => toggleRevealSample(sample.blind_code)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title={isRevealed ? 'Ocultar' : 'Revelar'}
                    >
                      {isRevealed ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditSample(sample)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSample(sample.blind_code)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Información */}
              <div className="space-y-1.5 text-sm">
                {(isRevealed || !isBlind) && sample.origin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Origen:</span>
                    <span className="font-medium text-gray-700">{sample.origin}</span>
                  </div>
                )}
                {(isRevealed || !isBlind) && sample.variety && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Variedad:</span>
                    <span className="font-medium text-gray-700">{sample.variety}</span>
                  </div>
                )}
                {(isRevealed || !isBlind) && sample.process && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Proceso:</span>
                    <span className="font-medium text-gray-700">{sample.process}</span>
                  </div>
                )}
                
                {isBlind && !isRevealed && (
                  <div className="text-center py-2 text-gray-400 italic text-xs">
                    Información oculta (catación ciega)
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {samples.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No hay muestras agregadas</p>
          <button
            onClick={handleAddSample}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
          >
            + Agregar primera muestra
          </button>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {editingSample ? 'Editar' : 'Nueva'} Muestra
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSample} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Ciego *</label>
                  <input
                    type="text"
                    required
                    value={sampleForm.blind_code}
                    onChange={(e) => setSampleForm({ ...sampleForm, blind_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="ABC"
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={sampleForm.order}
                    onChange={(e) => setSampleForm({ ...sampleForm, order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origen / Finca</label>
                  <input
                    type="text"
                    value={sampleForm.origin}
                    onChange={(e) => setSampleForm({ ...sampleForm, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: Huehuetenango, Guatemala"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variedad</label>
                  <input
                    type="text"
                    value={sampleForm.variety}
                    onChange={(e) => setSampleForm({ ...sampleForm, variety: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: Bourbon, Geisha, Caturra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proceso</label>
                  <select
                    value={sampleForm.process}
                    onChange={(e) => setSampleForm({ ...sampleForm, process: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Lavado">Lavado</option>
                    <option value="Natural">Natural</option>
                    <option value="Honey">Honey</option>
                    <option value="Semi-lavado">Semi-lavado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cosecha</label>
                  <input
                    type="text"
                    value={sampleForm.harvest}
                    onChange={(e) => setSampleForm({ ...sampleForm, harvest: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: 2024/2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Tueste</label>
                  <input
                    type="date"
                    value={sampleForm.roast_date}
                    onChange={(e) => setSampleForm({ ...sampleForm, roast_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Agua</label>
                  <input
                    type="text"
                    value={sampleForm.water}
                    onChange={(e) => setSampleForm({ ...sampleForm, water: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Molido</label>
                  <input
                    type="text"
                    value={sampleForm.grind}
                    onChange={(e) => setSampleForm({ ...sampleForm, grind: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ratio</label>
                  <input
                    type="text"
                    value={sampleForm.ratio}
                    onChange={(e) => setSampleForm({ ...sampleForm, ratio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura</label>
                  <input
                    type="text"
                    value={sampleForm.temperature}
                    onChange={(e) => setSampleForm({ ...sampleForm, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  {editingSample ? 'Actualizar' : 'Agregar'} Muestra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

