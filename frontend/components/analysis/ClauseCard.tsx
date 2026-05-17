'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contractsApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Clause } from '@/lib/types'

const categoryColors: Record<string, string> = {
  'Liability': '#FF4444',
  'Termination': '#FF8C00',
  'IP': '#A78BFA',
  'Privacy': '#4D9EFF',
  'Payment': '#E8C547',
  'Non-Compete': '#FF6B6B',
  'Dispute': '#00D084',
}

interface Props {
  clause: Clause
  contractId: string
  index: number
  isSelected?: boolean
}

export function ClauseCard({ clause, contractId, index, isSelected }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const qc = useQueryClient()

  const borderColor = clause.risk_level === 'high'
    ? '#FF4444'
    : clause.risk_level === 'moderate'
    ? '#FF8C00'
    : '#00D084'

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAccepting(true)
    try {
      await contractsApi.acceptClause(clause.id)
      qc.invalidateQueries({ queryKey: ['contract', contractId] })
      toast.success('Clause accepted')
    } catch {
      toast.error('Failed to update clause')
    } finally { setAccepting(false) }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRejecting(true)
    try {
      await contractsApi.rejectClause(clause.id)
      qc.invalidateQueries({ queryKey: ['contract', contractId] })
      toast.success('Clause rejected — redline suggestion will be reviewed')
    } catch {
      toast.error('Failed to update clause')
    } finally { setRejecting(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'bg-bg-surface border rounded-lg overflow-hidden transition-all duration-200',
        clause.is_accepted === true ? 'opacity-60' : '',
        isSelected ? 'border-gold/40 shadow-[0_0_0_1px_rgba(232,197,71,0.2)]' : 'border-white/[0.06]'
      )}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-bg-elevated transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <RiskBadge level={clause.risk_level} size="sm" />
            <span
              className="text-xs px-2 py-0.5 rounded-full border font-medium"
              style={{
                color: categoryColors[clause.category] ?? '#6B7280',
                background: `${categoryColors[clause.category] ?? '#6B7280'}15`,
                borderColor: `${categoryColors[clause.category] ?? '#6B7280'}30`,
              }}
            >
              {clause.category}
            </span>
            <span className="text-text-muted text-xs font-mono">
              Risk: {clause.risk_score}/25
            </span>
            {clause.is_accepted === true && (
              <span className="text-xs text-safe flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Accepted
              </span>
            )}
            {clause.is_accepted === false && (
              <span className="text-xs text-danger flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Rejected
              </span>
            )}
          </div>
          <p className="text-text-primary text-sm font-medium leading-snug line-clamp-2">
            {clause.title}
          </p>
          <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">
            {clause.original_text}
          </p>
        </div>
        <ChevronDown
          className={cn('flex-shrink-0 w-4 h-4 text-text-muted transition-transform mt-0.5', expanded && 'rotate-180')}
        />
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04] pt-3">
              {/* Explanation */}
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Why it's risky</p>
                <p className="text-text-secondary text-sm leading-relaxed">{clause.explanation}</p>
              </div>

              {/* Original Text */}
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Original Clause</p>
                <p className="text-text-muted text-xs font-mono bg-bg-elevated border border-white/[0.04] rounded p-3 leading-relaxed italic">
                  "{clause.original_text}"
                </p>
              </div>

              {/* Redline suggestion */}
              {clause.suggested_text && (
                <div>
                  <p className="text-xs font-medium text-safe uppercase tracking-wider mb-1.5">Suggested Redline</p>
                  <p className="text-text-secondary text-xs font-mono bg-safe/5 border border-safe/20 rounded p-3 leading-relaxed">
                    "{clause.suggested_text}"
                  </p>
                </div>
              )}

              {/* Scores */}
              <div className="flex gap-4 text-xs font-mono">
                <div>
                  <span className="text-text-muted">Likelihood: </span>
                  <span className="text-text-primary font-bold">{clause.likelihood}/5</span>
                </div>
                <div>
                  <span className="text-text-muted">Severity: </span>
                  <span className="text-text-primary font-bold">{clause.severity}/5</span>
                </div>
              </div>

              {/* Actions */}
              {clause.is_accepted === null && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReject}
                    loading={rejecting}
                    className="flex-1 text-danger border-danger/30 hover:bg-danger/10"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject & Flag
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAccept}
                    loading={accepting}
                    className="flex-1 text-safe border-safe/30 hover:bg-safe/10"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept Risk
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
