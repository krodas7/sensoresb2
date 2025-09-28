import React, { useState, useEffect } from 'react'
import { 
  BeakerIcon, 
  StarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface CuppingScoreFormProps {
  sample: {
    id: number
    blindCode: string
    origin: string
    variety: string
    process: string
  }
  cupper: {
    id: number
    name: string
    role: string
  }
  protocol: 'sca' | 'cva' | 'coe' | 'custom'
  onSave: (score: CuppingScore) => void
  initialScore?: CuppingScore
}

interface CuppingScore {
  id?: number
  sample: number
  cupper: number
  // SCA attributes
  fragrance?: number
  aroma?: number
  flavor?: number
  aftertaste?: number
  acidity?: number
  body?: number
  uniformity?: number
  cleanCup?: number
  sweetness?: number
  balance?: number
  overall?: number
  // CVA fields
  descriptiveScores?: { [key: string]: number }
  affectiveScores?: { [key: string]: number }
  // Additional
  defects?: string
  notes?: string
  descriptors?: CuppingDescriptor[]
}

interface CuppingDescriptor {
  id?: number
  descriptor: string
  intensity: number
  polarity: 'positive' | 'negative'
}

const SCA_ATTRIBUTES = [
  { key: 'fragrance', label: 'Fragancia', description: 'Aroma del café molido' },
  { key: 'aroma', label: 'Aroma', description: 'Aroma del café preparado' },
  { key: 'flavor', label: 'Sabor', description: 'Sabor principal del café' },
  { key: 'aftertaste', label: 'Retrogusto', description: 'Sabor residual después de tragar' },
  { key: 'acidity', label: 'Acidez', description: 'Brillo y vivacidad' },
  { key: 'body', label: 'Cuerpo', description: 'Peso y textura en boca' },
  { key: 'uniformity', label: 'Uniformidad', description: 'Consistencia entre tazas' },
  { key: 'cleanCup', label: 'Taza Limpia', description: 'Ausencia de defectos' },
  { key: 'sweetness', description: 'Dulzura natural' },
  { key: 'balance', label: 'Balance', description: 'Armonía entre atributos' },
  { key: 'overall', label: 'General', description: 'Evaluación general' }
]

const FLAVOR_DESCRIPTORS = [
  // Enzymatic
  { category: 'Floral', descriptors: ['Black Tea', 'Chamomile', 'Elderflower', 'Hibiscus', 'Jasmine', 'Lavender', 'Rose Hips', 'Rose Water'] },
  { category: 'Fruity', descriptors: ['Apple', 'Blackberry', 'Black Currant', 'Blueberry', 'Coconut', 'Cherry', 'Cranberry', 'Grape', 'Grapefruit', 'Lemon', 'Lime', 'Mango', 'Melon', 'Orange', 'Papaya', 'Passion Fruit', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Pomegranate', 'Raisin', 'Raspberry', 'Strawberry', 'Tangerine', 'Tomato'] },
  { category: 'Herbal', descriptors: ['Anise', 'Basil', 'Bay Leaves', 'Cilantro', 'Dill', 'Eucalyptus', 'Grass', 'Mint', 'Oregano', 'Parsley', 'Rosemary', 'Sage', 'Thyme'] },
  // Sugar Browning
  { category: 'Caramel', descriptors: ['Butterscotch', 'Caramel', 'Honey', 'Maple Syrup', 'Molasses'] },
  { category: 'Brown Sugar', descriptors: ['Brown Sugar', 'Cane Sugar', 'Demerara Sugar', 'Jaggery', 'Muscovado'] },
  { category: 'Chocolate', descriptors: ['Cacao', 'Chocolate', 'Dark Chocolate', 'Milk Chocolate'] },
  // Dry Distillation
  { category: 'Roasted', descriptors: ['Ashy', 'Burnt', 'Smoky', 'Charred'] },
  { category: 'Spices', descriptors: ['Allspice', 'Anise', 'Black Pepper', 'Cardamom', 'Cinnamon', 'Clove', 'Nutmeg', 'Star Anise'] },
  { category: 'Nutty/Cocoa', descriptors: ['Almond', 'Chestnut', 'Hazelnut', 'Peanut', 'Pecan', 'Walnut'] },
  { category: 'Cereal', descriptors: ['Barley', 'Malt', 'Oats', 'Rye', 'Wheat'] },
  // Aromatic Taints
  { category: 'Chemical', descriptors: ['Chemical', 'Medicinal', 'Petroleum', 'Skunky'] },
  { category: 'Musty/Earthy', descriptors: ['Dirt', 'Dusty', 'Earthy', 'Moldy', 'Musty', 'Mushroom'] },
  { category: 'Papery/Musty', descriptors: ['Cardboard', 'Papery', 'Stale', 'Woody'] },
  { category: 'Fermented', descriptors: ['Fermented', 'Overripe', 'Sour', 'Vinegar'] }
]

export default function CuppingScoreForm({ sample, cupper, protocol, onSave, initialScore }: CuppingScoreFormProps) {
  const [score, setScore] = useState<CuppingScore>({
    sample: sample.id,
    cupper: cupper.id,
    descriptors: [],
    ...initialScore
  })
  
  const [activeTab, setActiveTab] = useState<'scores' | 'descriptors' | 'notes'>('scores')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialScore) {
      setScore(initialScore)
    }
  }, [initialScore])

  const handleAttributeChange = (attribute: string, value: number) => {
    setScore(prev => ({
      ...prev,
      [attribute]: value
    }))
  }

  const handleDescriptorAdd = (descriptor: string, polarity: 'positive' | 'negative') => {
    const newDescriptor: CuppingDescriptor = {
      descriptor,
      intensity: 5,
      polarity
    }
    
    setScore(prev => ({
      ...prev,
      descriptors: [...(prev.descriptors || []), newDescriptor]
    }))
  }

  const handleDescriptorRemove = (index: number) => {
    setScore(prev => ({
      ...prev,
      descriptors: prev.descriptors?.filter((_, i) => i !== index) || []
    }))
  }

  const handleDescriptorUpdate = (index: number, field: keyof CuppingDescriptor, value: any) => {
    setScore(prev => ({
      ...prev,
      descriptors: prev.descriptors?.map((desc, i) => 
        i === index ? { ...desc, [field]: value } : desc
      ) || []
    }))
  }

  const calculateTotalScore = () => {
    if (protocol === 'sca') {
      const scaAttributes = [
        score.fragrance, score.aroma, score.flavor, score.aftertaste,
        score.acidity, score.body, score.uniformity, score.cleanCup,
        score.sweetness, score.balance, score.overall
      ]
      const validScores = scaAttributes.filter(s => s !== undefined && s !== null)
      return validScores.reduce((sum, s) => sum + s, 0)
    }
    return 0
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        ...score,
        totalScore: calculateTotalScore()
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getScoreColor = (value: number) => {
    if (value >= 8) return 'text-green-600 bg-green-100'
    if (value >= 6) return 'text-yellow-600 bg-yellow-100'
    if (value >= 4) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Evaluación - Muestra {sample.blindCode}
            </h2>
            <p className="text-gray-600">
              {sample.origin} • {sample.variety} • {sample.process}
            </p>
            <p className="text-sm text-gray-500">
              Catador: {cupper.name} ({cupper.role})
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600">
              {calculateTotalScore().toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Puntaje Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scores', name: 'Puntajes', icon: StarIcon },
            { id: 'descriptors', name: 'Descriptores', icon: BeakerIcon },
            { id: 'notes', name: 'Notas', icon: CheckCircleIcon }
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
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Scores Tab */}
      {activeTab === 'scores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCA_ATTRIBUTES.map((attr) => (
              <div key={attr.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {attr.label}
                </label>
                <p className="text-xs text-gray-500">{attr.description}</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.25"
                    value={score[attr.key as keyof CuppingScore] || 0}
                    onChange={(e) => handleAttributeChange(attr.key, parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className={`w-16 px-2 py-1 rounded text-center text-sm font-bold ${getScoreColor(score[attr.key as keyof CuppingScore] || 0)}`}>
                    {(score[attr.key as keyof CuppingScore] || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descriptors Tab */}
      {activeTab === 'descriptors' && (
        <div className="space-y-6">
          {/* Add Descriptors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Agregar Descriptores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FLAVOR_DESCRIPTORS.map((category) => (
                <div key={category.category} className="space-y-2">
                  <h4 className="font-medium text-gray-700">{category.category}</h4>
                  <div className="space-y-1">
                    {category.descriptors.map((descriptor) => (
                      <button
                        key={descriptor}
                        onClick={() => handleDescriptorAdd(descriptor, 'positive')}
                        className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        + {descriptor}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Descriptors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Descriptores Actuales</h3>
            {score.descriptors?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay descriptores agregados</p>
            ) : (
              <div className="space-y-2">
                {score.descriptors?.map((descriptor, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          descriptor.polarity === 'positive' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {descriptor.polarity === 'positive' ? '+' : '-'}
                        </span>
                        <span className="font-medium">{descriptor.descriptor}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={descriptor.intensity}
                        onChange={(e) => handleDescriptorUpdate(index, 'intensity', parseInt(e.target.value))}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-8 text-center text-sm font-medium">
                        {descriptor.intensity}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDescriptorRemove(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Defectos
            </label>
            <textarea
              value={score.defects || ''}
              onChange={(e) => setScore(prev => ({ ...prev, defects: e.target.value }))}
              placeholder="Describe cualquier defecto encontrado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={score.notes || ''}
              onChange={(e) => setScore(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales sobre la evaluación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Guardar Evaluación
            </>
          )}
        </button>
      </div>
    </div>
  )
}