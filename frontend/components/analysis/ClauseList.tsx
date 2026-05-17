'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { ClauseCard } from './ClauseCard'
import type { Clause, RiskLevel } from '@/lib/types'

interface Props {
  clauses: Clause[]
  contractId: string
  selectedClauseId?: string | null
  onClauseSelect?: (id: string) => void
  clauseRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

const RISK_FILTERS: { label: string; value: RiskLevel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'high' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Low', value: 'low' },
]

const FILTER_COLORS = { high: '#FF4444', moderate: '#FF8C00', low: '#00D084' }

export function ClauseList({ clauses, contractId, selectedClauseId, onClauseSelect, clauseRefs }: Props) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')

  const filtered = clauses.filter((c) => {
    const matchRisk = riskFilter === 'all' || c.risk_level === riskFilter
    const matchSearch = !search || 
      (c.title ?? c.clause_type).toLowerCase().includes(search.toLowerCase()) ||
      (c.explanation ?? c.why_risky).toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchRisk && matchSearch
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-3 border-b border-white/[0.06] space-y-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search clauses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-elevated border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {RISK_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRiskFilter(f.value)}
              className={`flex-1 text-xs font-medium py-1 rounded-md transition-all ${
                riskFilter === f.value
                  ? 'bg-gold/10 text-gold border border-gold/30'
                  : 'text-text-muted hover:text-text-secondary border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-3 py-2 flex-shrink-0">
        <span className="text-xs text-text-muted font-mono">{filtered.length} clause{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">No matching clauses found</div>
        ) : (
          filtered.map((clause, i) => (
            <div
              key={clause.id}
              ref={(el) => { if (clauseRefs) clauseRefs.current[clause.id] = el }}
              data-clause-id={clause.id}
              onClick={() => onClauseSelect?.(clause.id)}
            >
              <ClauseCard
                clause={clause}
                contractId={contractId}
                index={i}
                isSelected={selectedClauseId === clause.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
