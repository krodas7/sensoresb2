import React, { useState } from 'react'
import { 
  DocumentArrowDownIcon, 
  PrinterIcon, 
  ShareIcon,
  ChartBarIcon,
  TableCellsIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import FlavorWheel from './FlavorWheel'

interface CuppingReportProps {
  session: {
    id: number
    name: string
    protocol: string
    date: string
    samples: Array<{
      id: number
      blindCode: string
      origin: string
      variety: string
      process: string
      scores: Array<{
        cupperId: number
        cupperName: string
        total: number
        attributes: { [key: string]: number }
      }>
      descriptors: Array<{
        descriptor: string
        intensity: number
        polarity: 'positive' | 'negative'
      }>
    }>
    cuppers: Array<{
      id: number
      name: string
      role: string
    }>
  }
}

export default function CuppingReport({ session }: CuppingReportProps) {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'comparison'>('summary')
  const [selectedSamples, setSelectedSamples] = useState<number[]>([])
  const [includeFlavorWheel, setIncludeFlavorWheel] = useState(true)
  const [includeStatistics, setIncludeStatistics] = useState(true)

  // Calculate sample statistics
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

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF report...')
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting Excel report...')
  }

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporte de Catación</h2>
          <p className="text-gray-600">{session.name} - {new Date(session.date).toLocaleDateString()}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn btn-secondary flex items-center"
          >
            <TableCellsIcon className="h-4 w-4 mr-2" />
            Excel
          </button>
          <button
            onClick={handleShare}
            className="btn btn-secondary flex items-center"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Compartir
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="input"
            >
              <option value="summary">Resumen</option>
              <option value="detailed">Detallado</option>
              <option value="comparison">Comparativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Muestras</label>
            <select
              multiple
              value={selectedSamples}
              onChange={(e) => setSelectedSamples(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
              className="input"
            >
              {session.samples.map(sample => (
                <option key={sample.id} value={sample.id}>
                  {sample.blindCode} - {sample.origin}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeFlavorWheel"
              checked={includeFlavorWheel}
              onChange={(e) => setIncludeFlavorWheel(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="includeFlavorWheel" className="ml-2 text-sm text-gray-700">
              Incluir Flavor Wheel
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeStatistics"
              checked={includeStatistics}
              onChange={(e) => setIncludeStatistics(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="includeStatistics" className="ml-2 text-sm text-gray-700">
              Incluir Estadísticas
            </label>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Session Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Sesión</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{session.samples.length}</div>
              <div className="text-sm text-blue-800">Muestras</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{session.cuppers.length}</div>
              <div className="text-sm text-green-800">Catadores</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{session.protocol}</div>
              <div className="text-sm text-purple-800">Protocolo</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {session.samples.reduce((acc, sample) => acc + sample.scores.length, 0)}
              </div>
              <div className="text-sm text-yellow-800">Evaluaciones</div>
            </div>
          </div>
        </div>

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
                        <div className="text-xs text-gray-400">{sample.variety} • {sample.process}</div>
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
                        <div className="text-lg font-semibold text-gray-900">
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
        {includeStatistics && (
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
        )}

        {/* Flavor Wheels */}
        {includeFlavorWheel && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flavor Wheels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {session.samples.map(sample => (
                <div key={sample.id} className="space-y-4">
                  <FlavorWheel
                    descriptors={sample.descriptors}
                    sampleName={`Muestra ${sample.blindCode}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Scores Table */}
        {reportType === 'detailed' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Puntajes Detallados</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Muestra
                    </th>
                    {session.cuppers.map(cupper => (
                      <th key={cupper.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {cupper.name}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {session.samples.map(sample => {
                    const sampleScores = sample.scores
                    const average = sampleScores.reduce((sum, score) => sum + score.total, 0) / sampleScores.length
                    
                    return (
                      <tr key={sample.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sample.blindCode}
                            </div>
                            <div className="text-sm text-gray-500">{sample.origin}</div>
                          </div>
                        </td>
                        {session.cuppers.map(cupper => {
                          const score = sampleScores.find(s => s.cupperId === cupper.id)
                          return (
                            <td key={cupper.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {score ? (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(score.total)}`}>
                                  {score.total.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(average)}`}>
                            {average.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
