'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Columns, AlignJustify } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contractsApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import type { Clause } from '@/lib/types'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with diff viewer
const ReactDiffViewer = dynamic(() => import('react-diff-viewer-continued'), {
  ssr: false,
  loading: () => <div className="h-20 bg-bg-elevated animate-pulse rounded-lg" />,
})

interface Props {
  clause: Clause
  contractId: string
}

export function RedlineCard({ clause, contractId }: Props) {
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [splitView, setSplitView] = useState(true)
  const qc = useQueryClient()

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await contractsApi.acceptClause(clause.id)
      qc.invalidateQueries({ queryKey: ['contract', contractId] })
      toast.success('Accepted')
    } finally { setAccepting(false) }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      await contractsApi.rejectClause(clause.id)
      qc.invalidateQueries({ queryKey: ['contract', contractId] })
      toast.success('Flagged for negotiation')
    } finally { setRejecting(false) }
  }

  if (!clause.suggested_text) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-surface border border-white/[0.06] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-bg-elevated">
        <div className="flex items-center gap-2">
          <RiskBadge level={clause.risk_level} size="sm" />
          <span className="text-text-primary text-sm font-medium">{clause.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle split/unified view */}
          <button
            onClick={() => setSplitView(!splitView)}
            title={splitView ? 'Switch to unified view' : 'Switch to split view'}
            className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
          >
            {splitView ? <AlignJustify className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
          </button>
          {clause.is_accepted === true && (
            <span className="text-xs text-safe flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>
          )}
          {clause.is_accepted === false && (
            <span className="text-xs text-danger flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Word-level diff viewer */}
        <div className="rounded-lg overflow-hidden text-[11px] border border-white/[0.06]">
          <ReactDiffViewer
            oldValue={clause.original_text ?? ''}
            newValue={clause.suggested_text ?? ''}
            splitView={splitView}
            useDarkTheme
            leftTitle="Original"
            rightTitle="Redlined"
            styles={{
              variables: {
                dark: {
                  diffViewerBackground: '#0F0F0F',
                  addedBackground: '#00D08418',
                  addedColor: '#00D084',
                  removedBackground: '#FF444418',
                  removedColor: '#FF4444',
                  wordAddedBackground: '#00D08440',
                  wordRemovedBackground: '#FF444440',
                  gutterBackground: '#0A0A0A',
                  gutterBackgroundDark: '#0D0D0D',
                  lineNumberColor: '#444',
                  codeFoldGutterBackground: '#0F0F0F',
                  codeFoldBackground: '#0F0F0F',
                  emptyLineBackground: '#0F0F0F',
                  highlightBackground: '#E8C54710',
                  highlightGutterBackground: '#E8C54720',
                },
              },
            }}
          />
        </div>

        {/* Why better */}
        <p className="text-text-muted text-xs leading-relaxed bg-bg-elevated border border-white/[0.04] rounded-lg p-2.5">
          <span className="text-gold font-medium">Why this change: </span>
          {clause.explanation}
        </p>

        {/* Actions */}
        {clause.is_accepted === null && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleReject} loading={rejecting} className="flex-1 text-danger border-danger/20 hover:bg-danger/5">
              <XCircle className="w-3.5 h-3.5" /> Reject Original
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAccept} loading={accepting} className="flex-1 text-safe border-safe/20 hover:bg-safe/5">
              <CheckCircle className="w-3.5 h-3.5" /> Accept Suggestion
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}


interface Props {
  clause: Clause
  contractId: string
}