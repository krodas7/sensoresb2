import React from 'react'
import { 
  PlayIcon, 
  StopIcon, 
  ClockIcon, 
  UserGroupIcon, 
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface CuppingSessionStatusProps {
  session: {
    id: number
    name: string
    status: 'draft' | 'open' | 'closed'
    protocol: 'SCA' | 'CVA' | 'CoE' | 'Custom'
    samples: Array<{
      id: number
      blindCode: string
      scores: Array<{
        cupperId: number
        total: number
      }>
    }>
    cuppers: Array<{
      id: number
      name: string
      isActive: boolean
    }>
    isRealtime: boolean
  }
}

export default function CuppingSessionStatus({ session }: CuppingSessionStatusProps) {
  const getStatusIcon = () => {
    switch (session.status) {
      case 'draft':
        return <ClockIcon className="h-5 w-5 text-gray-500" />
      case 'open':
        return <PlayIcon className="h-5 w-5 text-green-500" />
      case 'closed':
        return <StopIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (session.status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = () => {
    switch (session.status) {
      case 'draft':
        return 'Borrador'
      case 'open':
        return 'En Progreso'
      case 'closed':
        return 'Finalizada'
      default:
        return 'Desconocido'
    }
  }

  // Calculate completion percentage
  const totalPossibleScores = session.samples.length * session.cuppers.length
  const actualScores = session.samples.reduce((total, sample) => total + sample.scores.length, 0)
  const completionPercentage = totalPossibleScores > 0 ? (actualScores / totalPossibleScores) * 100 : 0

  // Calculate average score
  const allScores = session.samples.flatMap(sample => sample.scores.map(score => score.total))
  const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0

  // Count active cuppers
  const activeCuppers = session.cuppers.filter(cupper => cupper.isActive).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
            <BeakerIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {session.protocol}
              </span>
              {session.isRealtime && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Tiempo Real
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ClockIcon className="h-4 w-4" />
          <span>Hace 2 horas</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
            <BeakerIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{session.samples.length}</div>
          <div className="text-sm text-gray-500">Muestras</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
            <UserGroupIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeCuppers}</div>
          <div className="text-sm text-gray-500">Catadores</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
            <CheckCircleIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{actualScores}</div>
          <div className="text-sm text-gray-500">Evaluaciones</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
            <ClockIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{averageScore.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Promedio</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Progreso de Evaluación</span>
          <span className="text-sm font-semibold text-gray-900">{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <PlayIcon className="h-4 w-4" />
          <span>Continuar Evaluación</span>
        </button>
      </div>
    </div>
  )
}
