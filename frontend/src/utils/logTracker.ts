/**
 * Log tracking utilities for the frontend
 * This module provides functions to track user activities and system events
 */

import api from '../services/api'

export interface LogData {
  level: 'info' | 'warning' | 'error' | 'success' | 'debug'
  category: 'auth' | 'user' | 'attendance' | 'cupping' | 'shipping' | 'integrations' | 'reports' | 'temperature' | 'occupation' | 'lots' | 'fermentation' | 'employees' | 'areas' | 'sensors' | 'system'
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'download' | 'upload' | 'export' | 'import' | 'approve' | 'reject' | 'start' | 'stop' | 'pause' | 'resume' | 'generate' | 'print' | 'send' | 'receive' | 'view' | 'search' | 'filter' | 'sort' | 'copy' | 'move' | 'assign' | 'unassign' | 'configure' | 'backup' | 'restore' | 'validate' | 'calculate' | 'compare' | 'merge' | 'split' | 'transform' | 'analyze' | 'report'
  message: string
  description?: string
  module: string
  object_type?: string
  object_id?: string
  metadata?: Record<string, any>
}

class LogTracker {
  private isEnabled: boolean = true

  /**
   * Enable or disable log tracking
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  /**
   * Track a user activity or system event
   */
  async track(data: LogData): Promise<void> {
    if (!this.isEnabled) return

    try {
      await api.post('/logs/create/', data)
    } catch (error) {
      // Silently fail to avoid disrupting user experience
      console.warn('Failed to track log:', error)
    }
  }

  /**
   * Track CRUD operations
   */
  async trackCRUD(
    operation: 'create' | 'read' | 'update' | 'delete',
    objectType: string,
    objectId: string | number,
    module: string,
    details?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const messages = {
      create: `Crear ${objectType}`,
      read: `Ver ${objectType}`,
      update: `Actualizar ${objectType}`,
      delete: `Eliminar ${objectType}`
    }

    await this.track({
      level: 'info',
      category: this.getCategoryFromModule(module),
      action: operation,
      message: messages[operation],
      description: details,
      module,
      object_type: objectType,
      object_id: String(objectId),
      metadata
    })
  }

  /**
   * Track authentication events
   */
  async trackAuth(
    action: 'login' | 'logout',
    success: boolean,
    username?: string,
    details?: string
  ): Promise<void> {
    await this.track({
      level: success ? 'success' : 'warning',
      category: 'auth',
      action,
      message: `${action === 'login' ? 'Inicio' : 'Cierre'} de sesión ${success ? 'exitoso' : 'fallido'}`,
      description: details,
      module: 'Authentication',
      object_type: 'User',
      object_id: username,
      metadata: { success, username }
    })
  }

  /**
   * Track file operations
   */
  async trackFileOperation(
    operation: 'upload' | 'download' | 'export' | 'import',
    filename: string,
    module: string,
    success: boolean = true,
    details?: string
  ): Promise<void> {
    await this.track({
      level: success ? 'success' : 'error',
      category: 'system',
      action: operation,
      message: `Operación de archivo ${operation} ${success ? 'exitosa' : 'fallida'}: ${filename}`,
      description: details,
      module,
      object_type: 'File',
      object_id: filename,
      metadata: { operation, filename, success }
    })
  }

  /**
   * Track report generation
   */
  async trackReportGeneration(
    reportType: string,
    module: string,
    success: boolean = true,
    details?: string
  ): Promise<void> {
    await this.track({
      level: success ? 'success' : 'error',
      category: 'reports',
      action: 'generate',
      message: `Generación de reporte ${reportType} ${success ? 'exitosa' : 'fallida'}`,
      description: details,
      module: 'Reports',
      object_type: 'Report',
      object_id: reportType,
      metadata: { reportType, success }
    })
  }

  /**
   * Track search operations
   */
  async trackSearch(
    query: string,
    module: string,
    resultCount: number,
    filters?: Record<string, any>
  ): Promise<void> {
    await this.track({
      level: 'info',
      category: 'system',
      action: 'search',
      message: `Búsqueda en ${module}: "${query}" (${resultCount} resultados)`,
      description: `Consulta: ${query}`,
      module,
      metadata: { query, resultCount, filters }
    })
  }

  /**
   * Track filter operations
   */
  async trackFilter(
    module: string,
    filters: Record<string, any>,
    resultCount: number
  ): Promise<void> {
    await this.track({
      level: 'info',
      category: 'system',
      action: 'filter',
      message: `Filtros aplicados en ${module} (${resultCount} resultados)`,
      description: `Filtros: ${JSON.stringify(filters)}`,
      module,
      metadata: { filters, resultCount }
    })
  }

  /**
   * Track error events
   */
  async trackError(
    error: Error,
    module: string,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      level: 'error',
      category: 'system',
      action: 'create',
      message: `Error en ${module}: ${error.message}`,
      description: context,
      module,
      metadata: {
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        context,
        ...metadata
      }
    })
  }

  /**
   * Track system events
   */
  async trackSystemEvent(
    event: string,
    module: string,
    level: 'info' | 'warning' | 'error' = 'info',
    details?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      level,
      category: 'system',
      action: 'create',
      message: `Evento del sistema: ${event}`,
      description: details,
      module,
      metadata: { event, ...metadata }
    })
  }

  /**
   * Track user navigation
   */
  async trackNavigation(
    fromModule: string,
    toModule: string,
    duration?: number
  ): Promise<void> {
    await this.track({
      level: 'info',
      category: 'system',
      action: 'view',
      message: `Navegación de ${fromModule} a ${toModule}`,
      description: duration ? `Duración en ${fromModule}: ${duration}ms` : undefined,
      module: 'Navigation',
      metadata: { fromModule, toModule, duration }
    })
  }

  /**
   * Track data validation
   */
  async trackValidation(
    module: string,
    objectType: string,
    success: boolean,
    errors?: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.track({
      level: success ? 'success' : 'warning',
      category: 'system',
      action: 'validate',
      message: `Validación de ${objectType} en ${module} ${success ? 'exitosa' : 'fallida'}`,
      description: errors ? `Errores: ${errors.join(', ')}` : undefined,
      module,
      object_type: objectType,
      metadata: { success, errors, ...metadata }
    })
  }

  /**
   * Get category from module name
   */
  private getCategoryFromModule(module: string): LogData['category'] {
    const moduleMap: Record<string, LogData['category']> = {
      'Attendance': 'attendance',
      'Cupping': 'cupping',
      'ShippingWeights': 'shipping',
      'LotIntegration': 'integrations',
      'Reports': 'reports',
      'TemperatureMonitor': 'temperature',
      'Occupation': 'occupation',
      'Lots': 'lots',
      'Fermentation': 'fermentation',
      'Employees': 'employees',
      'Areas': 'areas',
      'Sensors': 'sensors',
      'Users': 'user',
      'Authentication': 'auth',
      'System': 'system',
    }

    return moduleMap[module] || 'system'
  }
}

// Create singleton instance
const logTracker = new LogTracker()

// Export the instance and types
export default logTracker
export type { LogData }

// Convenience functions for common operations
export const trackCRUD = logTracker.trackCRUD.bind(logTracker)
export const trackAuth = logTracker.trackAuth.bind(logTracker)
export const trackFileOperation = logTracker.trackFileOperation.bind(logTracker)
export const trackReportGeneration = logTracker.trackReportGeneration.bind(logTracker)
export const trackSearch = logTracker.trackSearch.bind(logTracker)
export const trackFilter = logTracker.trackFilter.bind(logTracker)
export const trackError = logTracker.trackError.bind(logTracker)
export const trackSystemEvent = logTracker.trackSystemEvent.bind(logTracker)
export const trackNavigation = logTracker.trackNavigation.bind(logTracker)
export const trackValidation = logTracker.trackValidation.bind(logTracker)
