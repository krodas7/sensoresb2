import React, { useState } from 'react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface CuppingScoreFormProps {
  sampleId: number
  sampleName: string
  cupper: string
  onSubmit: (score: CuppingScoreData) => void
  onCancel: () => void
}

export interface CuppingScoreData {
  sample: number
  // SCA Attributes (scale 6.00 - 10.00, increments of 0.25)
  fragrance: number
  flavor: number
  aftertaste: number
  acidity: number
  body: number
  uniformity: number
  balance: number
  clean_cup: number
  sweetness: number
  overall: number
  // Defects
  defects: number
  // Notes
  notes: string
  descriptive_scores: string
}

export default function CuppingScoreForm({ sampleId, sampleName, cupper, onSubmit, onCancel }: CuppingScoreFormProps) {
  const [scores, setScores] = useState<CuppingScoreData>({
    sample: sampleId,
    fragrance: 6.0,
    flavor: 6.0,
    aftertaste: 6.0,
    acidity: 6.0,
    body: 6.0,
    uniformity: 10.0,
    balance: 6.0,
    clean_cup: 10.0,
    sweetness: 10.0,
    overall: 6.0,
    defects: 0,
    notes: '',
    descriptive_scores: ''
  })

  const [showFlavorWheel, setShowFlavorWheel] = useState(false)
  const [selectedDescriptors, setSelectedDescriptors] = useState<string[]>([])

  // Descriptores comunes organizados por categoría
  const descriptorCategories = {
    'Frutal': ['Cítrico', 'Frutas Rojas', 'Frutas Negras', 'Tropical', 'Manzana', 'Pera', 'Uva'],
    'Dulce': ['Chocolate', 'Caramelo', 'Miel', 'Vainilla', 'Azúcar Morena', 'Melaza'],
    'Nuez/Cacao': ['Almendra', 'Avellana', 'Nuez', 'Maní', 'Cacao'],
    'Floral': ['Jazmín', 'Rosa', 'Lavanda', 'Té Negro', 'Manzanilla'],
    'Especias': ['Canela', 'Clavo', 'Nuez Moscada', 'Pimienta', 'Anís'],
    'Herbal': ['Hierba', 'Menta', 'Eucalipto', 'Té Verde']
  }

  const toggleDescriptor = (descriptor: string) => {
    if (selectedDescriptors.includes(descriptor)) {
      setSelectedDescriptors(selectedDescriptors.filter(d => d !== descriptor))
    } else {
      setSelectedDescriptors([...selectedDescriptors, descriptor])
    }
  }

  // Actualizar descriptive_scores cuando cambian los descriptores
  React.useEffect(() => {
    setScores({ ...scores, descriptive_scores: selectedDescriptors.join(', ') })
  }, [selectedDescriptors])

  const handleSliderChange = (attribute: keyof CuppingScoreData, value: number) => {
    setScores({ ...scores, [attribute]: value })
  }

  const calculateTotal = () => {
    const total = scores.fragrance + scores.flavor + scores.aftertaste + 
                  scores.acidity + scores.body + scores.uniformity + 
                  scores.balance + scores.clean_cup + scores.sweetness + 
                  scores.overall - scores.defects
    return total.toFixed(2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(scores)
  }

  const ScoreSlider = ({ 
    label, 
    value, 
    onChange, 
    min = 6.0, 
    max = 10.0 
  }: { 
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-lg font-bold text-amber-600">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.25}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex justify-between items-center rounded-t-xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">Formulario de Catación SCA</h2>
            <p className="text-amber-100 text-sm mt-1">Muestra: {sampleName} | Catador: {cupper}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Puntaje Total */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Puntaje Total</p>
            <p className="text-4xl font-bold text-amber-600">{calculateTotal()}</p>
            <p className="text-xs text-gray-500 mt-1">puntos SCA</p>
          </div>

          {/* Atributos Sensoriales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Atributos Aromáticos</h3>
              
              <ScoreSlider
                label="Fragancia / Aroma"
                value={scores.fragrance}
                onChange={(val) => handleSliderChange('fragrance', val)}
              />

              <ScoreSlider
                label="Sabor (Flavor)"
                value={scores.flavor}
                onChange={(val) => handleSliderChange('flavor', val)}
              />

              <ScoreSlider
                label="Postgusto (Aftertaste)"
                value={scores.aftertaste}
                onChange={(val) => handleSliderChange('aftertaste', val)}
              />

              <ScoreSlider
                label="Acidez (Acidity)"
                value={scores.acidity}
                onChange={(val) => handleSliderChange('acidity', val)}
              />

              <ScoreSlider
                label="Cuerpo (Body)"
                value={scores.body}
                onChange={(val) => handleSliderChange('body', val)}
              />
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Atributos de Calidad</h3>
              
              <ScoreSlider
                label="Uniformidad (Uniformity)"
                value={scores.uniformity}
                onChange={(val) => handleSliderChange('uniformity', val)}
              />

              <ScoreSlider
                label="Balance"
                value={scores.balance}
                onChange={(val) => handleSliderChange('balance', val)}
              />

              <ScoreSlider
                label="Taza Limpia (Clean Cup)"
                value={scores.clean_cup}
                onChange={(val) => handleSliderChange('clean_cup', val)}
              />

              <ScoreSlider
                label="Dulzor (Sweetness)"
                value={scores.sweetness}
                onChange={(val) => handleSliderChange('sweetness', val)}
              />

              <ScoreSlider
                label="Puntaje General (Overall)"
                value={scores.overall}
                onChange={(val) => handleSliderChange('overall', val)}
              />
            </div>
          </div>

          {/* Defectos */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Defectos</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Puntos de Defecto</label>
                <span className="text-lg font-bold text-red-600">{scores.defects.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.25}
                value={scores.defects}
                onChange={(e) => handleSliderChange('defects', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-xs text-gray-500">Los defectos se restan del puntaje total</p>
            </div>
          </div>

          {/* Descriptores */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
                Descriptores de Sabor
              </h3>
              <button
                type="button"
                onClick={() => setShowFlavorWheel(!showFlavorWheel)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {showFlavorWheel ? 'Ocultar' : 'Mostrar'} Selector
              </button>
            </div>

            {/* Descriptores Seleccionados */}
            {selectedDescriptors.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedDescriptors.map(desc => (
                  <span 
                    key={desc}
                    onClick={() => toggleDescriptor(desc)}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium cursor-pointer hover:bg-purple-200 transition-colors flex items-center gap-1"
                  >
                    {desc}
                    <XMarkIcon className="h-3 w-3" />
                  </span>
                ))}
              </div>
            )}

            {/* Selector de Descriptores */}
            {showFlavorWheel && (
              <div className="space-y-3">
                {Object.entries(descriptorCategories).map(([category, descriptors]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {descriptors.map(desc => {
                        const isSelected = selectedDescriptors.includes(desc)
                        return (
                          <button
                            key={desc}
                            type="button"
                            onClick={() => toggleDescriptor(desc)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                            }`}
                          >
                            {desc}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Manual */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                O escribe descriptores manualmente
              </label>
              <input
                type="text"
                value={scores.descriptive_scores}
                onChange={(e) => {
                  setScores({ ...scores, descriptive_scores: e.target.value })
                  setSelectedDescriptors(e.target.value.split(',').map(s => s.trim()).filter(Boolean))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="Ej: Chocolate, Caramelo, Cítricos..."
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={scores.notes}
              onChange={(e) => setScores({ ...scores, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={3}
              placeholder="Observaciones, comentarios, impresiones generales..."
            />
          </div>

        </form>

        {/* Footer con Botones */}
        <div className="border-t p-4 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            Guardar Evaluación
          </button>
        </div>
      </div>
    </div>
  )
}
