import React, { useState } from 'react'
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  MinusIcon,
  ClockIcon,
  BeakerIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface CuppingEvaluationFormProps {
  session: {
    id: number
    name: string
    protocol: string
  }
  sample: {
    id: number
    blindCode: string
    origin: string
    variety: string
    process: string
    roastDate: string
    roastProfile: string
  }
  onBack: () => void
  onSave: (score: any) => void
}

export default function CuppingEvaluationForm({ session, sample, onBack, onSave }: CuppingEvaluationFormProps) {
  const [scores, setScores] = useState({
    fragrance: { dry: 0, break: 0, score: 7.5 },
    aroma: { score: 7.5 },
    flavor: { score: 7.5 },
    aftertaste: { score: 7.5 },
    acidity: { intensity: 0, score: 7.5 },
    body: { level: 0, score: 7.5 },
    balance: { score: 7.5 },
    overall: { score: 7.5 },
    uniformity: { score: 10 },
    cleanCup: { score: 10 },
    sweetness: { score: 10 },
    defects: { cups: 0, intensity: 0, total: 0 }
  })

  const [descriptors, setDescriptors] = useState<{ [key: string]: string[] }>({})
  const [notes, setNotes] = useState('')
  const [enableTotalScore, setEnableTotalScore] = useState(false)
  const [enableTotalScoreOnly, setEnableTotalScoreOnly] = useState(false)

  const updateScore = (category: string, field: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const adjustScore = (category: string, field: string, delta: number) => {
    const currentValue = scores[category as keyof typeof scores][field as keyof typeof scores[typeof category]]
    const newValue = Math.max(0, Math.min(10, currentValue + delta))
    updateScore(category, field, newValue)
  }

  const addDescriptor = (category: string) => {
    const descriptor = prompt(`Agregar descriptor para ${category}:`)
    if (descriptor) {
      setDescriptors(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), descriptor]
      }))
    }
  }

  const removeDescriptor = (category: string, index: number) => {
    setDescriptors(prev => ({
      ...prev,
      [category]: prev[category]?.filter((_, i) => i !== index) || []
    }))
  }

  const calculateDefects = () => {
    const total = scores.defects.cups * scores.defects.intensity
    setScores(prev => ({
      ...prev,
      defects: { ...prev.defects, total }
    }))
  }

  const renderScoreInput = (category: string, field: string, label: string, value: number) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
      <button
        onClick={() => adjustScore(category, field, -0.25)}
        className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 flex items-center justify-center"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => updateScore(category, field, parseFloat(e.target.value) || 0)}
        className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-sm font-medium"
        min="0"
        max="10"
        step="0.25"
      />
      <button
        onClick={() => adjustScore(category, field, 0.25)}
        className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 flex items-center justify-center"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  )

  const renderSlider = (category: string, field: string, label: string, value: number) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => updateScore(category, field, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )

  const renderCupRating = (category: string, field: string, value: number) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Score</span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((cup) => (
          <button
            key={cup}
            onClick={() => updateScore(category, field, cup * 2)}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              cup * 2 <= value ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <BeakerIcon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-900 ml-2">Score {value}</span>
    </div>
  )

  const renderAttributeCard = (category: string, title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => addDescriptor(category)}
          className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add descriptors</span>
        </button>
      </div>
      
      {descriptors[category]?.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {descriptors[category].map((descriptor, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center space-x-2"
            >
              <span>{descriptor}</span>
              <button
                onClick={() => removeDescriptor(category, index)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          Descriptor is not added yet, click add descriptor to add
        </p>
      )}
      
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Cupping sessions</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Timer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.name}</h1>
          <p className="text-gray-600">
            Currently using <span className="text-purple-600 font-semibold">Arabica Cupping Form</span>
          </p>
          <div className="flex items-center space-x-4 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableTotalScore}
                onChange={(e) => setEnableTotalScore(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Enable total score for all</span>
            </label>
          </div>
        </div>

        {/* Sample Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sample #{sample.blindCode}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableTotalScoreOnly}
                      onChange={(e) => setEnableTotalScoreOnly(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Enable total score only</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">5 Cups</div>
                <div className="text-sm text-gray-500">Total Cup</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">---</div>
                <div className="text-sm text-gray-500">Total Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Roast Level */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Roast level</h3>
            <span className="text-gray-400">?</span>
          </div>
          <div className="flex space-x-4">
            {['Light', 'Mid-Light', 'Medium', 'Mid-Dark', 'Dark'].map((level, index) => (
              <button
                key={level}
                className={`flex flex-col items-center space-y-2 p-3 rounded-lg ${
                  level === 'Medium' ? 'bg-purple-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${
                  level === 'Medium' ? 'bg-purple-600' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cupping Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Fragrance / Aroma */}
          {renderAttributeCard('fragrance', 'Fragrance / Aroma', (
            <div className="space-y-4">
              {renderSlider('fragrance', 'dry', 'Dry', scores.fragrance.dry)}
              {renderSlider('fragrance', 'break', 'Break', scores.fragrance.break)}
              {renderScoreInput('fragrance', 'score', 'Score', scores.fragrance.score)}
            </div>
          ))}

          {/* Acidity */}
          {renderAttributeCard('acidity', 'Acidity', (
            <div className="space-y-4">
              {renderSlider('acidity', 'intensity', 'Acidity Intensity', scores.acidity.intensity)}
              {renderScoreInput('acidity', 'score', 'Score', scores.acidity.score)}
            </div>
          ))}

          {/* Body */}
          {renderAttributeCard('body', 'Body', (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              {renderSlider('body', 'level', 'Body level', scores.body.level)}
              {renderScoreInput('body', 'score', 'Score', scores.body.score)}
            </div>
          ))}

          {/* Flavor */}
          {renderAttributeCard('flavor', 'Flavor', (
            <div className="space-y-4">
              {renderScoreInput('flavor', 'score', 'Score', scores.flavor.score)}
            </div>
          ))}

          {/* Aftertaste */}
          {renderAttributeCard('aftertaste', 'Aftertaste', (
            <div className="space-y-4">
              {renderScoreInput('aftertaste', 'score', 'Score', scores.aftertaste.score)}
            </div>
          ))}

          {/* Balance */}
          {renderAttributeCard('balance', 'Balance', (
            <div className="space-y-4">
              {renderScoreInput('balance', 'score', 'Score', scores.balance.score)}
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall</h3>
            {renderScoreInput('overall', 'score', 'Score', scores.overall.score)}
          </div>

          {/* Defects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Defects</h3>
            <button
              onClick={() => addDescriptor('defects')}
              className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 flex items-center space-x-2 mb-4"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add descriptors</span>
            </button>
            <p className="text-sm text-gray-500 mb-4">
              Descriptor is not added yet, click add descriptor to add
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">#Cups</span>
                <select
                  value={scores.defects.cups}
                  onChange={(e) => updateScore('defects', 'cups', parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span className="text-gray-500">×</span>
                <span className="text-sm font-medium text-gray-700">Intensity</span>
                <select
                  value={scores.defects.intensity}
                  onChange={(e) => updateScore('defects', 'intensity', parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span className="text-gray-500">=</span>
                <input
                  type="number"
                  value={scores.defects.total}
                  readOnly
                  className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div className="text-sm text-gray-600">
                <div>Faint = 2</div>
                <div>Taint = 4</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Uniformity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uniformity</h3>
              {renderCupRating('uniformity', 'score', scores.uniformity.score)}
            </div>

            {/* Clean cup */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clean cup</h3>
              {renderCupRating('cleanCup', 'score', scores.cleanCup.score)}
            </div>

            {/* Sweetness */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sweetness</h3>
              {renderCupRating('sweetness', 'score', scores.sweetness.score)}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write here"
                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={() => onSave(scores)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <CheckIcon className="h-5 w-5" />
            <span>Review & Submit</span>
          </button>
        </div>
      </div>
    </div>
  )
}
