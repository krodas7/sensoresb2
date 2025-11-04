import React, { useState, useEffect } from 'react'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as installed PWA
    const isInStandaloneMode = () => {
      return (
        ('standalone' in window.navigator && (window.navigator as any).standalone) ||
        window.matchMedia('(display-mode: standalone)').matches
      )
    }

    setIsStandalone(isInStandaloneMode())

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install prompt if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowInstallPrompt(true)
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowInstallPrompt(false)
        }, 5000)
      }
    }

    // For iOS, show install prompt immediately if not dismissed
    if (iOS && !isInStandaloneMode()) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowInstallPrompt(true)
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowInstallPrompt(false)
        }, 5000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed
  if (isStandalone) {
    return null
  }

  // iOS install instructions
  if (isIOS && !isStandalone && showInstallPrompt) {
    return (
      <div className="show-mobile fixed bottom-20 left-4 right-4 z-40">
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white stroke-4 rounded-lg shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Instalar App</h3>
              <p className="text-sm mb-2">
                Para instalar esta app en tu iPhone/iPad:
              </p>
              <ol className="text-xs space-y-1 ml-4 list-decimal">
                <li>Toca el botón de compartir <span className="inline-block">📤</span></li>
                <li>Desplázate y toca "Agregar a pantalla de inicio"</li>
                <li>Toca "Agregar"</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-2 text-white hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <>
        {/* Mobile version */}
        <div className="show-mobile fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Instalar App</h3>
                <p className="text-sm mt-1">
                  Instala Beneficio en tu dispositivo para acceso rápido y funcionalidad offline
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="ml-2 text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full bg-white text-amber-900 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Instalar Ahora</span>
            </button>
          </div>
        </div>

        {/* Desktop version */}
        <div className="hide-mobile fixed bottom-6 right-6 z-40">
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white p-6 rounded-xl shadow-2xl max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-2">Instalar App</h3>
                <p className="text-sm">
                  Instala Beneficio para acceso rápido desde tu escritorio y funcionalidad offline
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="ml-3 text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full bg-white text-amber-900 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowDownTrayIcon className="h-6 w-6" />
                <span>Instalar Ahora</span>
              </button>
              <button
                onClick={handleDismiss}
                className="w-full text-white text-sm hover:text-gray-200 py-2"
              >
                Más tarde
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}

export default PWAInstallPrompt
