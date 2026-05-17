'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, FileText, ChevronDown, Pen, Globe, Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import { useAuthStore, useAppStore } from '@/lib/store'
import type { ContractDetail } from '@/lib/types'
import { useState } from 'react'

interface NavbarProps {
  contract?: ContractDetail | null
}

/** Compact CRI circular gauge for navbar */
function CRIGauge({ score, level }: { score: number; level: string }) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference
  const color = level === 'high' ? '#FF4444' : level === 'moderate' ? '#FF8C00' : '#00D084'

  return (
    <div className="relative flex items-center justify-center w-12 h-12" title={`CRI: ${score.toFixed(0)}/100`}>
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-bold" style={{ color }}>
        {clampedScore.toFixed(0)}
      </span>
    </div>
  )
}

export default function Navbar({ contract }: NavbarProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const storeToken = useAuthStore((s) => s.token)
  const [exportOpen, setExportOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const downloadFile = async (url: string, filename: string) => {
    // Use Zustand store token first (always fresh), fall back to localStorage
    const token = storeToken || (typeof window !== 'undefined' ? localStorage.getItem('lexguard_token') : null)
    if (!token) {
      alert('Session expired. Please log in again.')
      router.push('/login')
      return
    }
    setDownloading(filename)
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(href)
    } catch (e: any) {
      alert(`Export failed: ${e.message}`)
    } finally {
      setDownloading(null)
    }
  }

  const handleExportPdf = () => {
    if (contract) {
      downloadFile(
        `${API_URL}/api/export/pdf/${contract.id}`,
        `${contract.original_filename.replace(/\.[^.]+$/, '')}_risk_report.pdf`
      )
    }
    setExportOpen(false)
  }

  const handleExportDocx = () => {
    if (contract) {
      downloadFile(
        `${API_URL}/api/export/docx/${contract.id}`,
        `${contract.original_filename.replace(/\.[^.]+$/, '')}_redlines.docx`
      )
    }
    setExportOpen(false)
  }

  const handleESign = () => {
    alert('E-Sign integration: Connect DocuSign or HelloSign API to enable one-click signing workflows.')
    setExportOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-white/[0.06]">
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Left: Logo + contract breadcrumb */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 7v9c0 7 5.4 13.5 12 15 6.6-1.5 12-8 12-15V7L16 2z"
                fill="#E8C547" fillOpacity="0.15" stroke="#E8C547" strokeWidth="1.5" />
              <path d="M11 16l3 3 7-7" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-base tracking-wide hidden sm:block">LEXGUARD</span>
          </Link>

          {contract && (
            <>
              <span className="text-text-muted hidden sm:block">/</span>
              <span className="text-text-secondary text-sm truncate max-w-36 hidden sm:block">
                {contract.original_filename}
              </span>
            </>
          )}
        </div>

        {/* Center: Active metadata HUD */}
        {contract?.status === 'complete' && (
          <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
            {contract.contract_type && (
              <span className="text-xs bg-bg-elevated border border-white/[0.08] rounded-full px-2.5 py-0.5 text-text-secondary hidden md:block">
                {contract.contract_type}
              </span>
            )}
            {contract.counterparty && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-text-muted">
                <Building2 className="w-3 h-3" />
                <span className="truncate max-w-28">{contract.counterparty}</span>
              </div>
            )}
            {contract.jurisdiction && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-text-muted">
                <Globe className="w-3 h-3" />
                <span className="truncate max-w-24">{contract.jurisdiction}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-safe" />
              <span className="text-xs text-text-secondary font-mono">Analysis Complete</span>
            </div>
          </div>
        )}

        {contract?.status === 'processing' && (
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            <span className="text-xs text-text-secondary font-mono">Analyzing pipeline...</span>
          </div>
        )}

        {/* Right: CRI Gauge + Export */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {contract?.status === 'complete' && (
            <>
              {/* CRI circular gauge */}
              <CRIGauge score={contract.aggregate_risk_index ?? 0} level={contract.risk_level} />
              <RiskBadge level={contract.risk_level} size="sm" pulse={contract.risk_level === 'high'} />

              {/* Export Action Group */}
              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-white/[0.08] hover:border-white/20 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-bg-overlay border border-white/[0.08] rounded-lg py-1 min-w-44 z-50 shadow-xl">
                      <button onClick={handleExportDocx} disabled={!!downloading} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 disabled:opacity-50">
                        <FileText className="w-3.5 h-3.5 text-warning" />
                        {downloading?.includes('redlines') ? 'Downloading...' : 'Export Redlines (DOCX)'}
                      </button>
                      <button onClick={handleExportPdf} disabled={!!downloading} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 disabled:opacity-50">
                        <FileText className="w-3.5 h-3.5 text-safe" />
                        {downloading?.includes('risk_report') ? 'Downloading...' : 'Risk Report (PDF)'}
                      </button>
                      <div className="border-t border-white/[0.06] my-1" />
                      <button onClick={handleESign} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2">
                        <Pen className="w-3.5 h-3.5 text-gold" />
                        E-Sign Document
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
            <span className="text-gold text-sm font-semibold">
              {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

