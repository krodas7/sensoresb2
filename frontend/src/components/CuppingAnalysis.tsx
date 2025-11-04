import React, { useState } from 'react'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import { 
  ChartBarIcon, 
  TableCellsIcon, 
  ArrowsUpDownIcon,
  TrophyIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import CuppingReport from './CuppingReport'

interface CuppingScore {
  id: number
  sample_id: number
  sample_name: string
  cupper_name: string
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
  defects: number
  total_score: number
  descriptive_scores: string
  notes: string
}

interface CuppingAnalysisProps {
  session: {
    id: number
    name: string
    protocol: string
    blinding: string
    status: string
    date: string
    description?: string
  }
  scores: CuppingScore[]
  samples: any[]
  participants: string[]
  onClose: () => void
}

export default function CuppingAnalysis({ session, scores, samples, participants, onClose }: CuppingAnalysisProps) {
  const [selectedSamples, setSelectedSamples] = useState<string[]>(
    samples.slice(0, 4).map(s => s.blind_code)
  )
  const [viewMode, setViewMode] = useState<'radar' | 'table' | 'ranking'>('radar')
  const [showReport, setShowReport] = useState(false)

  // Calcular promedios por muestra
  const getSampleAverages = (sampleCode: string) => {
    const sampleScores = scores.filter(s => s.sample_name === sampleCode)
    if (sampleScores.length === 0) return null

    const avg = {
      sample: sampleCode,
      fragrance: 0,
      flavor: 0,
      aftertaste: 0,
      acidity: 0,
      body: 0,
      uniformity: 0,
      balance: 0,
      clean_cup: 0,
      sweetness: 0,
      overall: 0,
      total: 0,
      count: sampleScores.length
    }

    sampleScores.forEach(score => {
      avg.fragrance += score.fragrance
      avg.flavor += score.flavor
      avg.aftertaste += score.aftertaste
      avg.acidity += score.acidity
      avg.body += score.body
      avg.uniformity += score.uniformity
      avg.balance += score.balance
      avg.clean_cup += score.clean_cup
      avg.sweetness += score.sweetness
      avg.overall += score.overall
      avg.total += score.total_score
    })

    Object.keys(avg).forEach(key => {
      if (key !== 'sample' && key !== 'count') {
        avg[key as keyof typeof avg] = avg[key as keyof typeof avg] / sampleScores.length
      }
    })

    return avg
  }

  // Preparar datos para el gráfico de radar
  const getRadarData = () => {
    const attributes = [
      { key: 'fragrance', label: 'Fragancia' },
      { key: 'flavor', label: 'Sabor' },
      { key: 'aftertaste', label: 'Postgusto' },
      { key: 'acidity', label: 'Acidez' },
      { key: 'body', label: 'Cuerpo' },
      { key: 'balance', label: 'Balance' }
    ]

    return attributes.map(attr => {
      const dataPoint: any = { attribute: attr.label }
      
      selectedSamples.forEach(sampleCode => {
        const avg = getSampleAverages(sampleCode)
        if (avg) {
          dataPoint[sampleCode] = avg[attr.key as keyof typeof avg]
        }
      })

      return dataPoint
    })
  }

  // Colores para cada muestra
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

  // Ranking de muestras
  const getSampleRanking = () => {
    const rankings = samples.map(sample => {
      const avg = getSampleAverages(sample.blind_code)
      return {
        code: sample.blind_code,
        origin: sample.origin,
        variety: sample.variety,
        total: avg ? avg.total : 0,
        count: avg ? avg.count : 0,
        scores: avg
      }
    }).sort((a, b) => b.total - a.total)

    return rankings
  }

  const toggleSampleSelection = (sampleCode: string) => {
    if (selectedSamples.includes(sampleCode)) {
      setSelectedSamples(selectedSamples.filter(s => s !== sampleCode))
    } else if (selectedSamples.length < 4) {
      setSelectedSamples([...selectedSamples, sampleCode])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center rounded-t-xl flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Análisis de Catación</h2>
            <p className="text-purple-100 text-sm mt-1">{session.name} • {scores.length} evaluaciones</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReport(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Generar Reporte
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-4 px-6 flex-shrink-0">
          <button
            onClick={() => setViewMode('radar')}
            className={`py-4 px-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'radar' 
                ? 'border-purple-600 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Gráfico de Radar
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`py-4 px-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'table' 
                ? 'border-purple-600 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TableCellsIcon className="h-5 w-5" />
            Tabla Detallada
          </button>
          <button
            onClick={() => setViewMode('ranking')}
            className={`py-4 px-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'ranking' 
                ? 'border-purple-600 text-purple-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrophyIcon className="h-5 w-5" />
            Ranking
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Selector de Muestras */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Seleccionar Muestras para Comparar (máx. 4)
            </h3>
            <div className="flex flex-wrap gap-2">
              {samples.map((sample, idx) => {
                const isSelected = selectedSamples.includes(sample.blind_code)
                return (
                  <button
                    key={sample.blind_code}
                    onClick={() => toggleSampleSelection(sample.blind_code)}
                    disabled={!isSelected && selectedSamples.length >= 4}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r text-white shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={isSelected ? {
                      backgroundImage: `linear-gradient(to right, ${colors[selectedSamples.indexOf(sample.blind_code)]}, ${colors[selectedSamples.indexOf(sample.blind_code)]}dd)`
                    } : {}}
                  >
                    {sample.blind_code}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vista de Radar */}
          {viewMode === 'radar' && (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Perfil Sensorial Comparativo
              </h3>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="attribute" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[6, 10]} 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                  />
                  {selectedSamples.map((sampleCode, idx) => (
                    <Radar
                      key={sampleCode}
                      name={sampleCode}
                      dataKey={sampleCode}
                      stroke={colors[idx]}
                      fill={colors[idx]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>

              {/* Leyenda de Puntajes Totales */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedSamples.map((sampleCode, idx) => {
                  const avg = getSampleAverages(sampleCode)
                  return (
                    <div 
                      key={sampleCode}
                      className="p-4 rounded-lg border-2"
                      style={{ borderColor: colors[idx] }}
                    >
                      <div className="text-2xl font-bold" style={{ color: colors[idx] }}>
                        {sampleCode}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Puntaje Total
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mt-2">
                        {avg ? avg.total.toFixed(2) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {avg?.count || 0} evaluación(es)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Vista de Tabla */}
          {viewMode === 'table' && (
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Muestra</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fragancia</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sabor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Postgusto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acidez</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cuerpo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Eval.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {samples.map(sample => {
                      const avg = getSampleAverages(sample.blind_code)
                      if (!avg) return null
                      
                      return (
                        <tr key={sample.blind_code} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-amber-600">{sample.blind_code}</div>
                            <div className="text-xs text-gray-500">{sample.origin}</div>
                          </td>
                          <td className="px-4 py-3 text-center">{avg.fragrance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{avg.flavor.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{avg.aftertaste.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{avg.acidity.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{avg.body.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">{avg.balance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-lg text-purple-600">
                              {avg.total.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {avg.count}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vista de Ranking */}
          {viewMode === 'ranking' && (
            <div className="space-y-4">
              {getSampleRanking().map((sample, idx) => (
                <div 
                  key={sample.code}
                  className={`bg-white border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                    idx === 1 ? 'border-gray-300 bg-gray-50' :
                    idx === 2 ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Ranking */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-400 text-gray-900' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-amber-600">{sample.code}</span>
                        {idx === 0 && <TrophyIcon className="h-6 w-6 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-gray-600">
                        {sample.origin && <span>{sample.origin}</span>}
                        {sample.variety && <span className="ml-2">• {sample.variety}</span>}
                      </div>
                    </div>

                    {/* Puntaje */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-purple-600">
                        {sample.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sample.count} evaluación(es)
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-yellow-400' :
                          idx === 1 ? 'bg-gray-400' :
                          idx === 2 ? 'bg-orange-400' :
                          'bg-purple-400'
                        }`}
                        style={{ width: `${(sample.total / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {samples.length} muestras • {scores.length} evaluaciones totales
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Cerrar Análisis
          </button>
        </div>
      </div>

      {/* Modal de Reporte */}
      {showReport && (
        <CuppingReport
          session={session}
          samples={samples}
          scores={scores}
          participants={participants}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
