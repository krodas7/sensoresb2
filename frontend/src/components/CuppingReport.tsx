import React from 'react'
import { 
  DocumentArrowDownIcon, 
  PrinterIcon, 
  XMarkIcon,
  TrophyIcon,
  BeakerIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
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

interface CuppingReportProps {
  session: {
    id: number
    name: string
    protocol: string
    blinding: string
    status: string
    date: string
    description?: string
  }
  samples: any[]
  scores: any[]
  participants: string[]
  onClose: () => void
}

export default function CuppingReport({ session, samples, scores, participants, onClose }: CuppingReportProps) {
  
  // SVG icons para el HTML exportado
  const icons = {
    calendar: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
    beaker: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>',
    users: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
    chart: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
    trophy: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>',
    sparkles: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>'
  }
  
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
      count: sampleScores.length,
      descriptors: typeof sampleScores[0]?.descriptive_scores === 'object' 
        ? sampleScores[0]?.descriptive_scores?.descriptors || ''
        : sampleScores[0]?.descriptive_scores || '',
      notes: sampleScores.map(s => s.notes).filter(Boolean).join(' | ')
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
      if (key !== 'sample' && key !== 'count' && key !== 'descriptors' && key !== 'notes') {
        const typedKey = key as keyof typeof avg
        const value = avg[typedKey]
        if (typeof value === 'number') {
          (avg as any)[typedKey] = value / sampleScores.length
        }
      }
    })

    return avg
  }

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
      
      samples.forEach(sample => {
        const avg = getSampleAverages(sample.blind_code)
        if (avg) {
          dataPoint[sample.blind_code] = avg[attr.key as keyof typeof avg]
        }
      })

      return dataPoint
    })
  }

  const getSampleRanking = () => {
    return samples.map(sample => {
      const avg = getSampleAverages(sample.blind_code)
      return {
        code: sample.blind_code,
        origin: sample.origin,
        variety: sample.variety,
        process: sample.process,
        total: avg ? avg.total : 0,
        count: avg ? avg.count : 0,
        scores: avg
      }
    }).sort((a, b) => b.total - a.total)
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleDownloadHTML = () => {
    const reportContent = document.getElementById('cupping-report-content')
    if (!reportContent) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Catación - ${session.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.7; 
      padding: 50px;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
      color: #1f2937;
    }
    
    h1, h2, h3 { 
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
    }
    
    h1 { 
      font-size: 42px;
      color: #ffffff; 
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    h2 { 
      font-size: 28px;
      color: #7c3aed; 
      margin: 40px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #c4b5fd;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    h3 {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 8px;
    }
    
    .header { 
      background: linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%);
      color: white; 
      padding: 50px;
      border-radius: 20px;
      margin-bottom: 40px;
      box-shadow: 0 20px 50px rgba(217, 119, 6, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .subtitle {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    
    .info-grid { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 25px; 
      margin-bottom: 40px; 
    }
    
    .info-card { 
      background: white;
      padding: 25px;
      border-radius: 15px;
      border-left: 5px solid #d97706;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s;
    }
    
    .info-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }
    
    .info-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    table { 
      width: 100%; 
      border-collapse: separate;
      border-spacing: 0;
      margin: 25px 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }
    
    th { 
      background: linear-gradient(to bottom, #7c3aed, #6d28d9);
      color: white;
      padding: 16px 12px;
      text-align: center;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td { 
      padding: 14px 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
    }
    
    tr:nth-child(even) {
      background: #fafaf9;
    }
    
    tr:hover {
      background: #faf5ff;
    }
    
    .ranking { 
      background: white;
      padding: 30px;
      border-radius: 15px;
      margin: 15px 0;
      border-left: 6px solid #eab308;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
    }
    
    .ranking::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 100%;
      background: linear-gradient(to bottom, #fbbf24, #eab308);
    }
    
    .ranking.first { 
      background: linear-gradient(to right, #fef3c7, #fde68a);
      border-left-color: #f59e0b;
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.25);
    }
    
    .ranking.first::before {
      background: linear-gradient(to bottom, #fbbf24, #f59e0b);
    }
    
    .ranking.second { 
      background: linear-gradient(to right, #f9fafb, #f3f4f6);
      border-left-color: #9ca3af;
    }
    
    .ranking.second::before {
      background: linear-gradient(to bottom, #d1d5db, #9ca3af);
    }
    
    .ranking.third { 
      background: linear-gradient(to right, #fed7aa, #fdba74);
      border-left-color: #fb923c;
    }
    
    .ranking.third::before {
      background: linear-gradient(to bottom, #fb923c, #f97316);
    }
    
    .score-big { 
      font-size: 56px;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed, #c026d3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    
    .medal {
      display: inline-block;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      text-align: center;
      line-height: 60px;
      font-size: 28px;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .medal.first {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
    }
    
    .medal.second {
      background: linear-gradient(135deg, #d1d5db, #9ca3af);
    }
    
    .medal.third {
      background: linear-gradient(135deg, #fb923c, #f97316);
    }
    
    .progress-bar {
      height: 12px;
      background: #e5e7eb;
      border-radius: 20px;
      overflow: hidden;
      margin-top: 15px;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 20px;
      background: linear-gradient(90deg, #7c3aed, #c026d3);
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
    }
    
    .descriptor-badge {
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
      color: #5b21b6;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      margin: 4px;
      box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
    }
    
    .sample-profile {
      background: white;
      padding: 25px;
      border-radius: 15px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      margin-bottom: 20px;
    }
    
    .sample-code {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #d97706, #ea580c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }
    
    .chart-container {
      background: white;
      padding: 35px;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin: 25px 0;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 3px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #d97706;
      margin-bottom: 8px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin: 0 4px;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      vertical-align: middle;
      color: #d97706;
    }
    
    .icon-large {
      width: 32px;
      height: 32px;
    }
    
    h2 .icon {
      width: 28px;
      height: 28px;
      color: #7c3aed;
    }
    
    /* Heroicons SVG styling for exported HTML */
    svg {
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }
    
    h2 svg {
      width: 28px;
      height: 28px;
      stroke: #7c3aed;
      flex-shrink: 0;
    }
    
    .info-card svg {
      width: 24px;
      height: 24px;
      stroke: #d97706;
      margin-bottom: 8px;
    }
    
    @media print {
      body { 
        padding: 20px;
        background: white;
      }
      .no-print { display: none; }
      .ranking, .info-card, .sample-profile, .chart-container {
        page-break-inside: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  ${reportContent.innerHTML}
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Reporte_Catacion_${session.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
  const ranking = getSampleRanking()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header con botones */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center rounded-t-xl no-print">
        <div>
            <h2 className="text-2xl font-bold">Reporte de Catación</h2>
            <p className="text-purple-100 text-sm mt-1">Vista previa del reporte profesional</p>
        </div>
          <div className="flex gap-2">
          <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
              <PrinterIcon className="h-5 w-5" />
              Imprimir PDF
          </button>
          <button
              onClick={handleDownloadHTML}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Descargar HTML
          </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

        {/* Contenido del Reporte */}
        <div id="cupping-report-content" className="p-8 max-h-[80vh] overflow-y-auto">
          {/* Encabezado del Reporte */}
          <div className="header mb-8">
            <div className="header-content">
              <div className="flex items-center justify-between">
          <div>
                  <h1 className="text-4xl font-bold mb-3">{session.name}</h1>
                  <p className="subtitle">Reporte de Catación Profesional</p>
          </div>
                <BeakerIcon className="h-20 w-20 text-white/60" />
          </div>
        </div>
      </div>

          {/* Información de la Sesión */}
          <div className="info-grid">
            <div className="info-card">
              <CalendarIcon className="h-6 w-6 text-amber-600 mb-2" />
              <div className="info-label">Fecha de Catación</div>
              <div className="info-value">{new Date(session.date).toLocaleDateString('es-GT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>

            <div className="info-card">
              <BeakerIcon className="h-6 w-6 text-amber-600 mb-2" />
              <div className="info-label">Protocolo</div>
              <div className="info-value">{session.protocol.toUpperCase()}</div>
            </div>

            <div className="info-card">
              <UserIcon className="h-6 w-6 text-amber-600 mb-2" />
              <div className="info-label">Catadores</div>
              <div className="info-value">{participants.join(', ')}</div>
            </div>

            <div className="info-card">
              <ChartBarIcon className="h-6 w-6 text-amber-600 mb-2" />
              <div className="info-label">Muestras Evaluadas</div>
              <div className="info-value">{samples.length} muestras • {scores.length} evaluaciones</div>
            </div>
          </div>

          {session.description && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Descripción</h3>
              <p className="text-gray-600">{session.description}</p>
        </div>
          )}

          {/* Ranking de Muestras */}
          <div className="mb-8">
            <h2 className="flex items-center gap-3">
              <TrophyIcon className="h-7 w-7 text-purple-600" />
              Ranking Final
            </h2>
            
            {ranking.map((sample, idx) => (
              <div 
                key={sample.code}
                className={`ranking ${idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : ''}`}
              >
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`medal ${idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : ''}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="sample-code">{sample.code}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        {sample.origin && <span>{sample.origin}</span>}
                        {sample.variety && <span> • {sample.variety}</span>}
                        {sample.process && <span> • {sample.process}</span>}
                      </div>
                      {sample.scores?.descriptors && (
                        <div style={{ marginTop: '10px' }}>
                          {sample.scores.descriptors.split(',').map((desc: string, i: number) => (
                            <span key={i} className="descriptor-badge">{desc.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="score-big">{sample.total.toFixed(2)}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                      {sample.count} evaluación(es)
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(sample.total / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de Radar */}
          <div className="mb-8">
            <h2 className="flex items-center gap-3">
              <ChartBarIcon className="h-7 w-7 text-purple-600" />
              Perfil Sensorial Comparativo
            </h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
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
                  {samples.slice(0, 4).map((sample, idx) => (
                    <Radar
                      key={sample.blind_code}
                      name={sample.blind_code}
                      dataKey={sample.blind_code}
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
            </div>
          </div>

          {/* Tabla Detallada */}
          <div className="mb-8">
            <h2 className="flex items-center gap-3">
              <DocumentArrowDownIcon className="h-7 w-7 text-purple-600" />
              Resultados Detallados
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left">Muestra</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Frag.</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Sabor</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Post.</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Acidez</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Cuerpo</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Unif.</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Balance</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Limpia</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Dulzor</th>
                    <th className="border border-gray-300 px-3 py-3 text-center">Gral.</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((sample, idx) => {
                    const avg = sample.scores
                    if (!avg) return null
                    
                    return (
                      <tr key={sample.code} className={idx < 3 ? 'bg-yellow-50' : ''}>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="font-bold text-amber-600">{sample.code}</div>
                          <div className="text-xs text-gray-500">{sample.origin}</div>
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.fragrance.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.flavor.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.aftertaste.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.acidity.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.body.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.uniformity.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.balance.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.clean_cup.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.sweetness.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-3 text-center">{avg.overall.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="font-bold text-xl text-purple-600">{avg.total.toFixed(2)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descriptores por Muestra */}
          <div className="mb-8">
            <h2 className="flex items-center gap-3">
              <SparklesIcon className="h-7 w-7 text-purple-600" />
              Perfiles de Sabor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ranking.map(sample => {
                const avg = sample.scores
                if (!avg || !avg.descriptors) return null
                
                return (
                  <div key={sample.code} className="sample-profile">
                    <div className="sample-code">{sample.code}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '15px' }}>
                      {sample.origin && <div><strong>Origen:</strong> {sample.origin}</div>}
                      {sample.variety && <div><strong>Variedad:</strong> {sample.variety}</div>}
                    </div>
                    {avg.descriptors && typeof avg.descriptors === 'string' && avg.descriptors.trim() && (
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Descriptores de Sabor
                        </div>
                        <div>
                          {avg.descriptors.split(',').map((desc: string, i: number) => (
                            <span key={i} className="descriptor-badge">{desc.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {avg.notes && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Notas del Catador
                        </div>
                        <p style={{ fontSize: '14px', color: '#4b5563', fontStyle: 'italic', lineHeight: '1.6' }}>
                          "{avg.notes}"
                        </p>
          </div>
        )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="footer-logo">Sistema de Beneficio de Café</div>
            <p style={{ marginBottom: '8px' }}>
              Reporte generado el {new Date().toLocaleDateString('es-GT', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              Protocolo {session.protocol.toUpperCase()} • {samples.length} muestras evaluadas • {scores.length} evaluaciones totales
            </p>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="border-t p-4 flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
