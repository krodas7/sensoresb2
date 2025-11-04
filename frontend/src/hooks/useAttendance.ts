import { useState } from 'react'
import api from '../services/api'

interface AttendanceRecord {
  id: number
  employee: number
  employee_name?: string
  timestamp: string
  record_type: 'IN' | 'OUT'
  origin: 'fingerprint' | 'manual'
  is_valid: boolean
  observations: string
}

interface WorkedHours {
  total: number
  regular: number
  overtime: number
}

export const useAttendance = () => {
  const [loading, setLoading] = useState(false)

  // Calculate worked hours from records
  const calculateWorkedHours = (records: AttendanceRecord[]): WorkedHours => {
    if (!records || records.length === 0) {
      return { total: 0, regular: 0, overtime: 0 }
    }

    // Group records by employee and date
    const grouped: Record<string, Record<string, AttendanceRecord[]>> = {}
    
    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0]
      const key = `${record.employee}_${date}`
      
      if (!grouped[record.employee]) {
        grouped[record.employee] = {}
      }
      if (!grouped[record.employee][date]) {
        grouped[record.employee][date] = []
      }
      grouped[record.employee][date].push(record)
    })

    let totalHours = 0
    const R_REGULAR_HOURS = 8

    // Calculate hours for each day
    Object.values(grouped).forEach(employeeDays => {
      Object.values(employeeDays).forEach(dayRecords => {
        const sorted = dayRecords.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        let checkIn: Date | null = null
        let dayTotal = 0

        sorted.forEach(record => {
          if (record.record_type === 'IN') {
            checkIn = new Date(record.timestamp)
          } else if (record.record_type === 'OUT' && checkIn) {
            const checkOut = new Date(record.timestamp)
            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
            dayTotal += hours
            checkIn = null
          }
        })

        totalHours += dayTotal
      })
    })

    const overtimeHours = Math.max(0, totalHours - R_REGULAR_HOURS)
    const regularHours = totalHours - overtimeHours

    return {
      total: Math.round(totalHours * 100) / 100,
      regular: Math.round(regularHours * 100) / 100,
      overtime: Math.round(overtimeHours * 100) / 100
    }
  }

  // Calculate hours for a specific day
  const calculateDayHours = (dayRecords: AttendanceRecord[]): number => {
    if (!dayRecords || dayRecords.length === 0) return 0

    const sorted = dayRecords.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let checkIn: Date | null = null
    let total = 0

    sorted.forEach(record => {
      if (record.record_type === 'IN') {
        checkIn = new Date(record.timestamp)
      } else if (record.record_type === 'OUT' && checkIn) {
        const checkOut = new Date(record.timestamp)
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
        total += hours
        checkIn = null
      }
    })

    return Math.round(total * 100) / 100
  }

  // Check for duplicate entries
  const checkDuplicates = (records: AttendanceRecord[]): AttendanceRecord[] => {
    const duplicate: AttendanceRecord[] = []
    const seen = new Set<string>()

    records.forEach(record => {
      const key = `${record.employee}_${record.record_type}_${new Date(record.timestamp).toISOString()}`
      if (seen.has(key)) {
        duplicate.push(record)
      } else {
        seen.add(key)
      }
    })

    return duplicate
  }

  // Check for incomplete pairs (entry without exit or vice versa)
  const checkIncompletePairs = (records: AttendanceRecord[]): string[] => {
    const issues: string[] = []
    const grouped: Record<string, AttendanceRecord[]> = {}

    records.forEach(record => {
      const key = `${record.employee}_${new Date(record.timestamp).toISOString().split('T')[0]}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(record)
    })

    Object.entries(grouped).forEach(([key, dayRecords]) => {
      const sorted = dayRecords.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Check for mismatched pairs
      let expectedType: 'IN' | 'OUT' | null = 'IN'
      sorted.forEach(record => {
        if (record.record_type !== expectedType) {
          issues.push(`${record.employee_name || `Empleado ${record.employee}`} tiene registro incompleto el ${new Date(record.timestamp).toLocaleDateString()}`)
        }
        expectedType = expectedType === 'IN' ? 'OUT' : 'IN'
      })

      // Check if ends with IN (entry without exit)
      if (sorted.length > 0 && sorted[sorted.length - 1].record_type === 'IN') {
        issues.push(`${sorted[sorted.length - 1].employee_name || `Empleado ${sorted[sorted.length - 1].employee}`} tiene entrada sin salida`)
      }
    })

    return issues
  }

  // Get employee attendance summary from API
  const getEmployeeSummary = async (employeeId: number, startDate: string, endDate: string) => {
    try {
      setLoading(true)
      const response = await api.get(
        `/attendance/employee/${employeeId}/summary/?start_date=${startDate}&end_date=${endDate}`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching employee summary:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    calculateWorkedHours,
    calculateDayHours,
    checkDuplicates,
    checkIncompletePairs,
    getEmployeeSummary
  }
}
