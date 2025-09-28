import { toast } from 'react-hot-toast'

export const useNotifications = () => {
  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string) => {
    toast.error(message)
  }

  const showWarning = (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        borderRadius: '10px',
        background: '#fbbf24',
        color: '#fff',
      },
    })
  }

  const showInfo = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        borderRadius: '10px',
        background: '#3b82f6',
        color: '#fff',
      },
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
