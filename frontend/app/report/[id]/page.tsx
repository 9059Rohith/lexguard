'use client'

import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Printer, ArrowLeft } from 'lucide-react'
import { useContractDetail } from '@/lib/api'
import { RiskScoreGauge } from '@/components/analysis/RiskScoreGauge'
import { RiskRadarChart } from '@/components/analysis/RiskRadarChart'
import { RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/utils'
import type { RadarDataPoint } from '@/lib/types'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  const { data: contract, isLoading } = useContractDetail(contractId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <Spinner />
      </div>
    )
  }

  if (!contract) return null

  const radarData: RadarDataPoint[] = [
    { category: 'Liability', score: contract.category_scores?.Liability ?? 0 },
    { category: 'Termination', score: contract.category_scores?.Termination ?? 0 },
    { category: 'IP', score: contract.category_scores?.IP ?? 0 },
    { category: 'Privacy', score: contract.category_scores?.Privacy ?? 0 },
    { category: 'Payment', score: contract.category_scores?.Payment ?? 0 },
    { category: 'Dispute', score: contract.category_scores?.Dispute ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Print bar */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-white/[0.06] flex items-center justify-between px-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-sm font-medium">Contract Risk Report</h1>
        <Button variant="gold" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Report Content */}
      <div className="pt-20 print:pt-0 max-w-4xl mx-auto px-6 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L4 7v9c0 7 5.4 13.5 12 15 6.6-1.5 12-8 12-15V7L16 2z"
                  fill="#E8C547" fillOpacity="0.15" stroke="#E8C547" strokeWidth="1.5" />
                <path d="M11 16l3 3 7-7" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-display text-lg tracking-wide">LEXGUARD</span>
            </div>
            <RiskBadge level={contract.risk_level} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mt-4">{contract.original_filename}</h2>
          <div className="flex gap-4 mt-2 text-sm text-text-secondary">
            <span>Type: <strong>{contract.contract_type}</strong></span>
            <span>Pages: <strong>{contract.page_count}</strong></span>
            <span>Analyzed: <strong>{formatDateTime(contract.created_at)}</strong></span>
          </div>
        </motion.div>

        {/* Risk Score + Radar */}
        <div className="grid grid-cols-2 gap-8 mb-10 bg-bg-surface border border-white/[0.06] rounded-2xl p-6">
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Contract Risk Index</h3>
            <RiskScoreGauge score={contract.aggregate_risk_index} size={200} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">Risk by Category</h3>
            <RiskRadarChart data={radarData} />
          </div>
        </div>

        {/* Executive Summary */}
        {contract.executive_summary && (
          <div className="mb-8 bg-bg-surface border border-gold/20 rounded-xl p-5">
            <h3 className="text-gold font-semibold mb-3">Executive Summary</h3>
            <p className="text-text-secondary leading-relaxed">{contract.executive_summary}</p>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'High Risk Clauses', value: contract.high_count, color: '#FF4444' },
            { label: 'Moderate Clauses', value: contract.moderate_count, color: '#FF8C00' },
            { label: 'Low Risk Clauses', value: contract.low_count, color: '#00D084' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-surface border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-text-muted text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Clauses */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Identified Risk Clauses</h3>
          <div className="space-y-3">
            {contract.clauses.map((clause, i) => {
              const color = clause.risk_level === 'high' ? '#FF4444' : clause.risk_level === 'moderate' ? '#FF8C00' : '#00D084'
              return (
                <div key={clause.id} className="bg-bg-surface border border-white/[0.06] rounded-xl p-4" style={{ borderLeft: `3px solid ${color}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color, background: `${color}20` }}>
                      {clause.risk_level.toUpperCase()}
                    </span>
                    <span className="text-text-primary font-medium text-sm">{clause.clause_type}</span>
                    <span className="text-text-muted text-xs ml-auto font-mono">Score: {clause.risk_score}/25</span>
                  </div>
                  <p className="text-text-muted text-xs mb-2 italic">"{clause.raw_text?.slice(0, 200)}..."</p>
                  <p className="text-text-secondary text-sm">{clause.why_risky}</p>
                  {clause.redline_suggestion && (
                    <div className="mt-2 p-2 bg-safe/5 border border-safe/15 rounded text-xs text-text-secondary">
                      <span className="text-safe font-medium">Suggested: </span>{clause.redline_suggestion?.slice(0, 200)}...
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/[0.06] pt-6 text-center">
          <p className="text-text-muted text-xs">
            ⚠ This report was generated by AI and is for informational purposes only. It does not constitute legal advice.
            Always consult a qualified attorney before making legal decisions.
          </p>
          <p className="text-text-muted text-xs mt-1">Generated by LEXGUARD AI • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
