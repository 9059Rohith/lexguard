import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { RiskLevel } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function riskColor(level: RiskLevel | string): string {
  switch (level) {
    case 'high': return '#FF4444'
    case 'moderate': return '#FF8C00'
    case 'low': return '#00D084'
    default: return '#8A8A9A'
  }
}

export function riskBgColor(level: RiskLevel | string): string {
  switch (level) {
    case 'high': return 'rgba(255,68,68,0.12)'
    case 'moderate': return 'rgba(255,140,0,0.12)'
    case 'low': return 'rgba(0,208,132,0.12)'
    default: return 'rgba(138,138,154,0.12)'
  }
}

export function riskLabel(level: RiskLevel | string): string {
  switch (level) {
    case 'high': return 'HIGH RISK'
    case 'moderate': return 'MODERATE'
    case 'low': return 'LOW RISK'
    default: return 'UNKNOWN'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    Employment: '#4D9EFF',
    Financial: '#FF8C00',
    IP: '#A78BFA',
    Privacy: '#34D399',
    Compliance: '#F87171',
    Operational: '#8A8A9A',
  }
  return colors[category] ?? '#8A8A9A'
}

export function scoreToGaugeAngle(score: number): number {
  // Map 0-100 to -180 to 0 degrees (semicircle)
  return -180 + (score / 100) * 180
}
