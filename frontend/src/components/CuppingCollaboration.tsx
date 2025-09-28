import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface CuppingCollaborationProps {
  session: {
    id: number
    name: string
    participants: Array<{
      id: number
      cupper: {
        id: number
        name: string
        role: string
      }
      joinedAt: string
      isActive: boolean
    }>
  }
  currentUser: {
    id: number
    name: string
    role: string
  }
  onInviteUser: (email: string) => void
  onRemoveUser: (userId: number) => void
}

interface ChatMessage {
  id: number
  user: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'evaluation'
}

export default function CuppingCollaboration({ 
  session, 
  currentUser, 
  onInviteUser, 
  onRemoveUser 
}: CuppingCollaborationProps) {
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'activity'>('participants')
  const [chatMessage, setChatMessage] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Mock chat messages
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: 1,
        user: 'Juan Pérez',
        message: 'Iniciando la sesión de catación',
        timestamp: '10:30',
        type: 'system'
      },
      {
        id: 2,
        user: 'María García',
        message: 'Muestra A tiene un aroma muy floral',
        timestamp: '10:32',
        type: 'evaluation'
      },
      {
        id: 3,
        user: 'Carlos López',
        message: 'Estoy de acuerdo, también noto notas cítricas',
        timestamp: '10:33',
        type: 'message'
      }
    ]
    setMessages(mockMessages)
  }, [])

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    const newMessage: ChatMessage = {
      id: messages.length + 1,
      user: currentUser.name,
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: 'message'
    }

    setMessages(prev => [...prev, newMessage])
    setChatMessage('')
  }

  const handleInviteUser = () => {
    if (!inviteEmail.trim()) return
    onInviteUser(inviteEmail)
    setInviteEmail('')
    setShowInviteModal(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'qc_leader':
        return 'bg-blue-100 text-blue-800'
      case 'cupper':
        return 'bg-green-100 text-green-800'
      case 'guest':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
      case 'evaluation':
        return <EyeIcon className="h-4 w-4 text-green-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Colaboración</h2>
          <p className="text-gray-600">{session.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4" />
            <span>{session.participants.length} participantes</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>En vivo</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'participants', name: 'Participantes', icon: UserGroupIcon },
            { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
            { id: 'activity', name: 'Actividad', icon: ClockIcon }
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

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Invitar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session.participants.map((participant) => (
              <div key={participant.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {participant.cupper.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{participant.cupper.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(participant.joinedAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(participant.cupper.role)}`}>
                      {participant.cupper.role.replace('_', ' ')}
                    </span>
                    {participant.isActive ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                </div>
                {currentUser.role === 'admin' && participant.cupper.id !== currentUser.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => onRemoveUser(participant.cupper.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Remover
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div className="h-96 border border-gray-200 rounded-lg flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getMessageTypeIcon(message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.user}
                      </span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <p className={`text-sm ${
                      message.type === 'system' ? 'text-blue-600' :
                      message.type === 'evaluation' ? 'text-green-600' :
                      'text-gray-700'
                    }`}>
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 input"
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          <div className="space-y-3">
            {[
              {
                id: 1,
                user: 'Juan Pérez',
                action: 'completó la evaluación de la Muestra A',
                timestamp: 'Hace 2 minutos',
                type: 'evaluation'
              },
              {
                id: 2,
                user: 'María García',
                action: 'agregó un descriptor: "Floral"',
                timestamp: 'Hace 5 minutos',
                type: 'descriptor'
              },
              {
                id: 3,
                user: 'Carlos López',
                action: 'se unió a la sesión',
                timestamp: 'Hace 10 minutos',
                type: 'join'
              }
            ].map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'evaluation' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : activity.type === 'descriptor' ? (
                    <EyeIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <UserGroupIcon className="h-5 w-5 text-purple-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invitar Usuario</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del usuario
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="input w-full"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInviteUser}
                  className="btn btn-primary"
                >
                  Enviar Invitación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
