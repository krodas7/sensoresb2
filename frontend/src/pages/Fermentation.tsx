import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SunIcon
} from '@heroicons/react/24/outline'
import api from '../services/api'

interface FermentationPile {
  id: number
  name: string
  raspberry: string
  raspberryIp: string
  percentage: number | null
  distance: number | null
  status: string | null
  lastReading: string | null
  totalMeasurements: number
  params: {
    distanciaVacia: number | null
    distanciaLlena: number | null
    rangoTotal: number | null
  }
}

interface FermentationApiResponse {
  recipiente: string
  raspberry: string
  raspberry_ip: string
  tipo: string
  pin_trig: number
  pin_echo: number
  ultima_medicion: string | null
  porcentaje_actual: string | number | null
  distancia_actual: string | number | null
  estado_actual: string | null
  total_mediciones: number
  activo: boolean
  parametros: {
    distancia_vacia?: number
    distancia_llena?: number
    rango_total?: number
  }
}

const createExpectedPiles = (): FermentationPile[] =>
  Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    name: `Pila de Fermentación ${index + 1}`,
    raspberry: '—',
    raspberryIp: '—',
    percentage: null,
    distance: null,
    status: null,
    lastReading: null,
    totalMeasurements: 0,
    params: {
      distanciaVacia: null,
      distanciaLlena: null,
      rangoTotal: null
    }
  }))

const formatDateTime = (iso: string | null): string => {
  if (!iso) return 'Sin datos'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Sin datos'
  return date.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return 'Sin datos'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Sin datos'
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Hace menos de 1 min'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `Hace ${diffDays} d`
}

const getStatusBadgeClasses = (status: string | null): string => {
  switch (status) {
    case 'Vacío':
      return 'bg-blue-100 text-blue-800'
    case 'Llenando':
      return 'bg-yellow-100 text-yellow-800'
    case 'Lleno':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const getFillGradient = (percentage: number | null): string => {
  if (percentage === null) return 'from-gray-300 to-gray-400'
  if (percentage >= 80) return 'from-green-500 to-green-600'
  if (percentage >= 50) return 'from-yellow-400 to-yellow-500'
  return 'from-red-400 to-red-500'
}

const Fermentation: React.FC = () => {
  const expectedPiles = useMemo(() => createExpectedPiles(), [])
  const [piles, setPiles] = useState<FermentationPile[]>(expectedPiles)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const response = await api.get('/sensors/fermentacion/resumen/')
      const data: FermentationApiResponse[] = Array.isArray(response.data) ? response.data : []

      const dataMap = new Map<string, FermentationApiResponse>()
      data.forEach(item => {
        const rawName = (item.recipiente || '').trim()
        if (!rawName) return
        dataMap.set(rawName, item)
        dataMap.set(rawName.toLowerCase(), item)
        dataMap.set(rawName.replace(/\s+/g, ' ').toLowerCase(), item)
      })

      const mapped = expectedPiles.map(expected => {
        const key = expected.name
        const record =
          dataMap.get(key) ||
          dataMap.get(key.toLowerCase()) ||
          dataMap.get(key.replace(/\s+/g, ' ').toLowerCase())

        if (!record) {
          return { ...expected }
        }

        const porcentaje =
          record.porcentaje_actual !== null && record.porcentaje_actual !== undefined
            ? Number(record.porcentaje_actual)
            : null
        const distancia =
          record.distancia_actual !== null && record.distancia_actual !== undefined
            ? Number(record.distancia_actual)
            : null

        return {
          ...expected,
          raspberry: record.raspberry || expected.raspberry,
          raspberryIp: record.raspberry_ip || expected.raspberryIp,
          percentage: Number.isNaN(porcentaje) ? null : porcentaje,
          distance: Number.isNaN(distancia) ? null : distancia,
          status: record.estado_actual,
          lastReading: record.ultima_medicion,
          totalMeasurements: record.total_mediciones ?? 0,
          params: {
            distanciaVacia: record.parametros?.distancia_vacia ?? null,
            distanciaLlena: record.parametros?.distancia_llena ?? null,
            rangoTotal: record.parametros?.rango_total ?? null
          }
        }
      })

      setPiles(mapped)
    } catch (err) {
      console.error('Error fetching fermentation data:', err)
      setError('No se pudo obtener la información de las pilas. Verifica la conexión con el servidor.')
      setPiles(expectedPiles)
    } finally {
      setLoading(false)
    }
  }, [expectedPiles])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const pilesWithData = useMemo(() => piles.filter(p => p.percentage !== null), [piles])
  const averageFill = useMemo(() => {
    if (!pilesWithData.length) return null
    const total = pilesWithData.reduce((sum, pile) => sum + (pile.percentage || 0), 0)
    return total / pilesWithData.length
  }, [pilesWithData])

  const alertCount = useMemo(
    () =>
      piles.filter(
        pile =>
          pile.percentage !== null &&
          (pile.status?.toLowerCase() === 'lleno' || (pile.percentage ?? 0) >= 90)
      ).length,
    [piles]
  )

  const latestUpdate = useMemo(() => {
    const timestamps = pilesWithData
      .map(pile => pile.lastReading)
      .filter((ts): ts is string => Boolean(ts))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return timestamps[0] || null
  }, [pilesWithData])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🍇 Pilas de Fermentación</h1>
          <p className="text-sm text-gray-600">Monitoreo en tiempo real de las 6 pilas de fermentación</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Auto-actualizar cada 30 segundos
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
          <div className="rounded-full bg-blue-100 p-3">
            <BeakerIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pilas con datos</p>
            <p className="text-2xl font-semibold text-gray-900">{pilesWithData.length}/6</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
          <div className="rounded-full bg-green-100 p-3">
            <ChartBarIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Promedio de llenado</p>
            <p className="text-2xl font-semibold text-gray-900">
              {averageFill !== null ? `${averageFill.toFixed(1)}%` : 'Sin datos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
          <div className="rounded-full bg-yellow-100 p-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Alertas de llenado</p>
            <p className="text-2xl font-semibold text-gray-900">{alertCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
          <div className="rounded-full bg-purple-100 p-3">
            <ClockIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Última medición</p>
            <p className="text-base font-semibold text-gray-900">{formatRelativeTime(latestUpdate)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {piles.map((pile) => {
          const percentage = pile.percentage ?? 0
          const limitedPercentage = Math.max(0, Math.min(percentage, 100))
          const gradient = getFillGradient(pile.percentage)

          return (
            <div key={pile.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pila #{pile.id}</p>
                  <h2 className="text-lg font-semibold text-gray-900">{pile.name}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(pile.status)}`}>
                  {pile.status || 'Sin estado'}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative w-20">
                  <div className="relative h-32 w-16 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                    <div
                      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${gradient}`}
                      style={{ height: `${limitedPercentage}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/40"></div>
                    </div>
                    <div className="absolute -top-1 left-1/2 h-3 w-6 -translate-x-1/2 rounded-full bg-blue-600">
                      <div className="h-full w-full animate-ping rounded-full bg-blue-200 opacity-70"></div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-500">
                    {pile.percentage !== null ? `${pile.percentage.toFixed(1)}%` : 'Sin datos'}
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Distancia</span>
                    <span className="font-medium text-gray-900">
                      {pile.distance !== null ? `${pile.distance.toFixed(1)} cm` : 'Sin datos'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Raspberry</span>
                    <span className="font-medium text-gray-900">{pile.raspberry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">IP</span>
                    <span className="font-medium text-gray-900">{pile.raspberryIp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Lecturas</span>
                    <span className="font-medium text-gray-900">{pile.totalMeasurements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Última medición</span>
                    <span className="font-medium text-gray-900">{formatDateTime(pile.lastReading)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {pilesWithData.length === 0 && (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <BeakerIcon className="h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Aún no se han recibido mediciones</p>
          <p className="text-xs text-gray-500">En cuanto las pilas envíen datos aparecerán aquí automáticamente.</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <SunIcon className="h-4 w-4 text-blue-500" />
            <span>Vacío</span>
          </div>
          <div className="flex items-center gap-1">
            <SunIcon className="h-4 w-4 text-yellow-500" />
            <span>Llenando</span>
          </div>
          <div className="flex items-center gap-1">
            <SunIcon className="h-4 w-4 text-green-500" />
            <span>Lleno</span>
          </div>
          <div className="ml-auto text-right">
            <p>Actualizado: {formatDateTime(latestUpdate)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Fermentation
