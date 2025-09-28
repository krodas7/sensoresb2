import React, { useState } from 'react';
import {
  BellIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    settings,
    isLoading,
    requestPermission,
    saveSettings,
    disableNotifications,
    enableNotifications,
  } = useNotifications();

  const [tempSettings, setTempSettings] = useState(settings);

  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleSave = () => {
    saveSettings(tempSettings);
    onClose();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setTempSettings(prev => ({ ...prev, enabled: true, push: true }));
    }
  };

  const handleToggle = (key: keyof typeof tempSettings) => {
    setTempSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnableAll = () => {
    setTempSettings(prev => ({
      ...prev,
      enabled: true,
      push: true,
      temperature: true,
      weight: true,
      cupping: true,
      employees: true,
      inventory: true,
      lots: true,
      users: true,
      gestions: true,
    }));
  };

  const handleDisableAll = () => {
    setTempSettings(prev => ({
      ...prev,
      enabled: false,
      push: false,
      temperature: false,
      weight: false,
      cupping: false,
      employees: false,
      inventory: false,
      lots: false,
      users: false,
      gestions: false,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 xl:w-2/5 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Configuración de Notificaciones</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Estado de soporte y permisos */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Estado del Sistema</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-24">Soporte:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isSupported ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-24">Permisos:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  permission === 'granted' ? 'bg-green-100 text-green-800' :
                  permission === 'denied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {permission === 'granted' ? 'Concedidos' :
                   permission === 'denied' ? 'Denegados' : 'Pendientes'}
                </span>
              </div>
            </div>
          </div>

          {/* Configuración principal */}
          <div className="space-y-6">
            {/* Notificaciones generales */}
            <div className="border-b pb-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Configuración General</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notificaciones</span>
                      <p className="text-xs text-gray-500">Habilitar/deshabilitar todas las notificaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('enabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tempSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notificaciones Push</span>
                      <p className="text-xs text-gray-500">Recibir notificaciones cuando la app esté cerrada</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('push')}
                    disabled={!tempSettings.enabled || permission !== 'granted'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tempSettings.push && tempSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    } ${!tempSettings.enabled || permission !== 'granted' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempSettings.push && tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {tempSettings.sounds ? (
                      <SpeakerWaveIcon className="h-5 w-5 text-gray-400 mr-3" />
                    ) : (
                      <SpeakerXMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Sonidos</span>
                      <p className="text-xs text-gray-500">Reproducir sonido con las notificaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('sounds')}
                    disabled={!tempSettings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tempSettings.sounds && tempSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    } ${!tempSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempSettings.sounds && tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vibración</span>
                      <p className="text-xs text-gray-500">Vibrar el dispositivo con las notificaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('vibration')}
                    disabled={!tempSettings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tempSettings.vibration && tempSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    } ${!tempSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempSettings.vibration && tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notificaciones por módulo */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Notificaciones por Módulo</h4>
              <div className="space-y-3">
                {[
                  { key: 'temperature', label: 'Temperatura', description: 'Alertas de sensores de temperatura' },
                  { key: 'weight', label: 'Pesos de Envío', description: 'Nuevos registros de peso' },
                  { key: 'cupping', label: 'Catación', description: 'Sesiones de catación completadas' },
                  { key: 'employees', label: 'Empleados', description: 'Asignaciones de turnos' },
                  { key: 'inventory', label: 'Inventario', description: 'Alertas de stock bajo' },
                  { key: 'lots', label: 'Lotes', description: 'Lotes completados' },
                  { key: 'users', label: 'Usuarios', description: 'Acciones de usuarios' },
                  { key: 'gestions', label: 'Gestiones', description: 'Nuevas solicitudes' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BellIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(key as keyof typeof tempSettings)}
                      disabled={!tempSettings.enabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tempSettings[key as keyof typeof tempSettings] && tempSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      } ${!tempSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tempSettings[key as keyof typeof tempSettings] && tempSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción rápida */}
            <div className="flex space-x-3">
              <button
                onClick={handleEnableAll}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Habilitar Todo
              </button>
              <button
                onClick={handleDisableAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Deshabilitar Todo
              </button>
            </div>

            {/* Solicitar permisos si es necesario */}
            {permission !== 'granted' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800">
                      Para recibir notificaciones, necesitas conceder permisos al navegador.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    disabled={isLoading}
                    className="ml-4 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Solicitando...' : 'Conceder Permisos'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
