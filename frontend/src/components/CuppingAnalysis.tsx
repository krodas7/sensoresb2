import React, { useState } from 'react'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface CuppingAnalysisProps {
  session: {
    id: number
    name: string
    samples: Array<{
      id: number
      blindCode: string
      origin: string
      scores: Array<{
        cupperId: number
        cupperName: string
        total: number
        attributes: { [key: string]: number }
      }>
    }>
    cuppers: Array<{
      id: number
      name: string
      role: string
    }>
  }
}

export default function CuppingAnalysis({ session }: CuppingAnalysisProps) {
  const [selectedSample, setSelectedSample] = useState<number | null>(null)
  const [analysisType, setAnalysisType] = useState<'overview' | 'comparison' | 'trends'>('overview')

  // Calculate averages and statistics
  const calculateSampleStats = (sample: any) => {
    const scores = sample.scores.map((s: any) => s.total)
    const average = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    const min = Math.min(...scores)
    const max = Math.max(...scores)
    const standardDeviation = Math.sqrt(
      scores.reduce((sum: number, score: number) => sum + Math.pow(score - average, 2), 0) / scores.length
    )
    
    return { average, min, max, standardDeviation, scores }
  }

  // Calculate cupper alignment
  const calculateCupperAlignment = () => {
    const cupperStats = session.cuppers.map(cupper => {
      const cupperScores = session.samples.flatMap(sample => 
        sample.scores.filter(score => score.cupperId === cupper.id)
      )
      
      if (cupperScores.length === 0) return null
      
      const total = cupperScores.reduce((sum, score) => sum + score.total, 0)
      const average = total / cupperScores.length
      
      return {
        cupper,
        average,
        count: cupperScores.length
      }
    }).filter(Boolean)

    return cupperStats
  }

  // Calculate attribute averages
  const calculateAttributeAverages = (sample: any) => {
    const attributes = ['fragrance', 'aroma', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall']
    
    return attributes.map(attr => {
      const values = sample.scores.map((s: any) => s.attributes[attr] || 0)
      const average = values.reduce((a: number, b: number) => a + b, 0) / values.length
      const standardDeviation = Math.sqrt(
        values.reduce((sum: number, value: number) => sum + Math.pow(value - average, 2), 0) / values.length
      )
      
      return {
        attribute: attr,
        average,
        standardDeviation,
        values
      }
    })
  }

  const sampleStats = session.samples.map(sample => ({
    ...sample,
    stats: calculateSampleStats(sample)
  }))

  const cupperAlignment = calculateCupperAlignment()

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    if (score >= 4) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getDeviationColor = (deviation: number) => {
    if (deviation <= 0.5) return 'text-green-600'
    if (deviation <= 1.0) return 'text-yellow-600'
    if (deviation <= 1.5) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análisis de Sesión</h2>
          <p className="text-gray-600">{session.name}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setAnalysisType('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              analysisType === 'overview' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setAnalysisType('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              analysisType === 'comparison' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Comparación
          </button>
          <button
            onClick={() => setAnalysisType('trends')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              analysisType === 'trends' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tendencias
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {analysisType === 'overview' && (
        <div className="space-y-6">
          {/* Sample Rankings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking de Muestras</h3>
            <div className="space-y-3">
              {sampleStats
                .sort((a, b) => b.stats.average - a.stats.average)
                .map((sample, index) => (
                  <div key={sample.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Muestra {sample.blindCode}
                          </div>
                          <div className="text-sm text-gray-500">{sample.origin}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(sample.stats.average).split(' ')[0]}`}>
                            {sample.stats.average.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">Promedio</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {sample.stats.min.toFixed(2)} - {sample.stats.max.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">Rango</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getDeviationColor(sample.stats.standardDeviation)}`}>
                            {sample.stats.standardDeviation.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">Desv. Est.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cupper Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento de Catadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cupperAlignment.map((cupper: any) => (
                <div key={cupper.cupper.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{cupper.cupper.name}</div>
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(cupper.average)}`}>
                      {cupper.average.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {cupper.count} evaluaciones
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${(cupper.average / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {analysisType === 'comparison' && (
        <div className="space-y-6">
          {/* Sample Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación de Muestras</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {session.samples.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSample(selectedSample === sample.id ? null : sample.id)}
                  className={`p-3 border rounded-lg text-center ${
                    selectedSample === sample.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Muestra {sample.blindCode}</div>
                  <div className="text-sm text-gray-500">{sample.origin}</div>
                </button>
              ))}
            </div>

            {/* Attribute Comparison */}
            {selectedSample && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Comparación de Atributos</h4>
                <div className="space-y-3">
                  {calculateAttributeAverages(session.samples.find(s => s.id === selectedSample)!).map(attr => (
                    <div key={attr.attribute} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 capitalize">
                          {attr.attribute.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {attr.average.toFixed(2)}
                          </span>
                          <span className={`text-sm ${getDeviationColor(attr.standardDeviation)}`}>
                            ±{attr.standardDeviation.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${(attr.average / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cupper Comparison Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación de Catadores</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catador
                    </th>
                    {session.samples.map(sample => (
                      <th key={sample.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {sample.blindCode}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desv. Est.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {session.cuppers.map(cupper => {
                    const cupperScores = session.samples.map(sample => {
                      const score = sample.scores.find(s => s.cupperId === cupper.id)
                      return score ? score.total : null
                    })
                    const validScores = cupperScores.filter(score => score !== null) as number[]
                    const average = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0
                    const deviation = validScores.length > 1 ? Math.sqrt(
                      validScores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / validScores.length
                    ) : 0

                    return (
                      <tr key={cupper.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cupper.name}
                        </td>
                        {cupperScores.map((score, index) => (
                          <td key={index} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {score ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(score)}`}>
                                {score.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {average.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          <span className={getDeviationColor(deviation)}>
                            {deviation.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {analysisType === 'trends' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Tendencias</h3>
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Análisis de Tendencias</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta funcionalidad estará disponible próximamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
