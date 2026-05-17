'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingUp, Zap, Play, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import type { ContractDetail } from '@/lib/types'

interface Props {
  contract: ContractDetail
}

const SCENARIO_ICONS = [AlertTriangle, TrendingUp, Zap]
const SEVERITY_COLORS = { high: '#FF4444', medium: '#FF8C00', low: '#00D084' }

// Full pool of 8 dispute simulations
const ALL_DISPUTE_SIMULATIONS = [
  {
    id: 'data_breach',
    label: 'Data Breach',
    keywords: ['data', 'privacy', 'personal information', 'gdpr', 'pii', 'security', 'breach'],
    steps: [
      { day: 0, event: 'Data breach detected — customer PII exposed', type: 'trigger' },
      { day: 3, event: 'Notify affected parties per contract obligation (72-hour window)', type: 'obligation' },
      { day: 7, event: 'Counterparty sends formal breach notice', type: 'notice' },
      { day: 14, event: 'Cure period begins — you must remediate or face penalties', type: 'risk' },
      { day: 30, event: 'Liability clause triggered if uncured — legal review recommended', type: 'liability' },
    ],
    worstCase: 'Unlimited or capped liability for data damages + regulatory fines + reputational harm',
  },
  {
    id: 'early_term',
    label: 'Early Termination',
    keywords: ['termination', 'cancellation', 'notice period', 'auto-renewal', 'renewal', 'early exit'],
    steps: [
      { day: 0, event: 'You decide to terminate the contract early', type: 'trigger' },
      { day: 1, event: 'Check notice requirement: contract may require 30–90 days written notice', type: 'obligation' },
      { day: 15, event: 'If notice was insufficient, penalty clause may activate', type: 'risk' },
      { day: 30, event: 'Counterparty can claim for work-in-progress and lost revenue', type: 'liability' },
      { day: 45, event: 'Arbitration or litigation demand filed if dispute unresolved', type: 'dispute' },
    ],
    worstCase: 'Breach of contract damages + legal fees + 6-month operational lockout',
  },
  {
    id: 'ip_dispute',
    label: 'IP Ownership Dispute',
    keywords: ['intellectual property', 'ip ', 'copyright', 'patent', 'work product', 'assignment', 'ownership transfer'],
    steps: [
      { day: 0, event: 'You commercialize a product built with work product from this contract', type: 'trigger' },
      { day: 7, event: 'Counterparty claims IP assignment clause gives them ownership', type: 'risk' },
      { day: 14, event: 'Cease-and-desist letter received', type: 'notice' },
      { day: 30, event: 'Injunction motion filed in governing jurisdiction court', type: 'dispute' },
      { day: 90, event: 'Litigation costs mount — may exceed revenue from commercialization', type: 'liability' },
    ],
    worstCase: 'Loss of IP ownership + injunction + $200K+ in litigation costs',
  },
  {
    id: 'non_compete',
    label: 'Non-Compete Violation',
    keywords: ['non-compete', 'non compete', 'non-solicitation', 'restrictive covenant', 'compete', 'solicitation'],
    steps: [
      { day: 0, event: 'You accept a role at a competing company after leaving', type: 'trigger' },
      { day: 3, event: 'Former counterparty discovers new employment via LinkedIn or referral', type: 'notice' },
      { day: 10, event: 'Demand letter citing non-compete breach sent by their attorneys', type: 'risk' },
      { day: 21, event: 'Injunction filed to prevent you from working at new role', type: 'dispute' },
      { day: 60, event: 'Court enforces non-compete based on governing law jurisdiction', type: 'liability' },
    ],
    worstCase: 'Employment terminated at new role + injunction enforced + liquidated damages',
  },
  {
    id: 'arbitration',
    label: 'Forced Arbitration',
    keywords: ['arbitration', 'dispute resolution', 'mediation', 'binding arbitration', 'aaa', 'jams', 'class action waiver'],
    steps: [
      { day: 0, event: 'You raise a dispute about contract performance or overcharging', type: 'trigger' },
      { day: 5, event: 'Counterparty invokes mandatory arbitration clause — court access blocked', type: 'risk' },
      { day: 14, event: 'Arbitration demand filed; you must pay arbitration filing fees', type: 'obligation' },
      { day: 45, event: 'Arbitration proceedings begin — class action waiver may apply', type: 'dispute' },
      { day: 120, event: 'Final arbitration award issued — no appeal rights under the clause', type: 'liability' },
    ],
    worstCase: 'No court access + arbitration costs + unfavorable award with no appeal',
  },
  {
    id: 'nda_breach',
    label: 'NDA / Confidentiality Breach',
    keywords: ['confidential', 'non-disclosure', 'nda', 'trade secret', 'proprietary', 'confidentiality'],
    steps: [
      { day: 0, event: 'An employee or contractor shares confidential information externally', type: 'trigger' },
      { day: 2, event: 'Counterparty discovers disclosure via social media or leaked document', type: 'notice' },
      { day: 7, event: 'Formal breach notice sent citing NDA obligations', type: 'risk' },
      { day: 21, event: 'Injunction to prevent further disclosure filed in court', type: 'dispute' },
      { day: 45, event: 'Liquidated damages or actual damages claimed — legal review critical', type: 'liability' },
    ],
    worstCase: 'Injunction + liquidated damages + destruction of competitive advantage',
  },
  {
    id: 'payment_dispute',
    label: 'Payment Dispute',
    keywords: ['payment', 'invoice', 'fees', 'compensation', 'billing', 'late payment', 'indemnif', 'penalty'],
    steps: [
      { day: 0, event: 'Counterparty disputes your invoice or withholds payment', type: 'trigger' },
      { day: 7, event: 'You send formal payment demand per contract terms', type: 'obligation' },
      { day: 15, event: 'Late payment interest or penalties begin accruing under contract clause', type: 'risk' },
      { day: 30, event: 'Counterparty claims set-off rights or performance deficiency as justification', type: 'dispute' },
      { day: 60, event: 'Debt collection or legal proceedings initiated — relationship severed', type: 'liability' },
    ],
    worstCase: 'Unpaid fees + collection costs + service disruption + potential counterclaim',
  },
  {
    id: 'liability_claim',
    label: 'Liability Cap Exceeded',
    keywords: ['liability', 'damages', 'indemnification', 'unlimited liability', 'cap', 'consequential', 'limitation of liability'],
    steps: [
      { day: 0, event: 'Your service failure causes significant downstream losses to counterparty', type: 'trigger' },
      { day: 5, event: 'Counterparty quantifies losses — potentially exceeding contract liability cap', type: 'risk' },
      { day: 14, event: 'Formal claim filed citing your indemnification obligations', type: 'notice' },
      { day: 30, event: 'Dispute over whether liability cap is enforceable under governing law', type: 'dispute' },
      { day: 90, event: 'If cap is struck down, full consequential damages exposure applies', type: 'liability' },
    ],
    worstCase: 'Full consequential damages + legal costs + loss of business relationship',
  },
]

/**
 * Score each simulation against the contract's clauses and return top-3 IDs.
 * Ensures the most relevant dispute scenarios are shown for this specific contract.
 */
function getRelevantSimIds(clauses: any[]): string[] {
  const contractText = clauses
    .map((c) => `${c.clause_type ?? ''} ${c.why_risky ?? ''} ${c.raw_text ?? ''}`)
    .join(' ')
    .toLowerCase()

  const scored = ALL_DISPUTE_SIMULATIONS.map((sim) => ({
    id: sim.id,
    score: sim.keywords.reduce((acc, kw) => acc + (contractText.includes(kw) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map((s) => s.id)
}

export function ScenariosTab({ contract }: Props) {
  const scenarios = contract.scenarios ?? []

  // Pick the 3 dispute simulations most relevant to this contract's actual clauses
  const relevantIds = getRelevantSimIds(contract.clauses ?? [])
  const DISPUTE_SIMULATIONS = ALL_DISPUTE_SIMULATIONS.filter((s) => relevantIds.includes(s.id))

  const [simId, setSimId] = useState<string>(DISPUTE_SIMULATIONS[0]?.id ?? ALL_DISPUTE_SIMULATIONS[0].id)
  const [simExpanded, setSimExpanded] = useState(false)

  const activeSim = DISPUTE_SIMULATIONS.find((s) => s.id === simId) ?? DISPUTE_SIMULATIONS[0]!

  const typeColors: Record<string, string> = {
    trigger: '#4D9EFF',
    obligation: '#E8C547',
    notice: '#FF8C00',
    risk: '#FF6B6B',
    liability: '#FF4444',
    dispute: '#A78BFA',
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Dispute Simulator */}
      <div className="p-4 border-b border-white/[0.06]">
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setSimExpanded(!simExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gold/10 flex items-center justify-center">
              <Play className="w-3 h-3 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Dispute Simulator</h3>
              <p className="text-[11px] text-text-muted">What happens if things go wrong?</p>
            </div>
          </div>
          {simExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </button>

        <AnimatePresence>
          {simExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                {/* Scenario selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {DISPUTE_SIMULATIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSimId(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        simId === s.id
                          ? 'bg-gold/10 text-gold border-gold/40'
                          : 'text-text-muted border-white/[0.08] hover:text-text-secondary'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Timeline */}
                <div className="space-y-2 relative">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-white/[0.06]" />
                  {activeSim.steps.map((step, i) => {
                    const color = typeColors[step.type] ?? '#888'
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex gap-3 items-start pl-2"
                      >
                        <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-bg-base"
                          style={{ borderColor: color }}>
                          <span className="text-[9px] font-bold" style={{ color }}>D{step.day}</span>
                        </div>
                        <div className="bg-bg-surface border border-white/[0.05] rounded-lg px-3 py-2 flex-1">
                          <p className="text-text-secondary text-xs leading-relaxed">{step.event}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Worst case */}
                <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-danger text-[11px] font-semibold mb-0.5">Worst-Case Liability</p>
                    <p className="text-text-secondary text-xs">{activeSim.worstCase}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI-Generated Scenarios */}
      <div className="p-4 space-y-4">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-text-primary">What-If Scenarios</h3>
          <p className="text-text-muted text-xs mt-0.5">AI-generated risk scenarios for this contract</p>
        </div>

        {!scenarios.length ? (
          <div className="text-center py-8 text-text-muted text-sm">No scenarios generated yet.</div>
        ) : (
          scenarios.map((scenario, i) => {
            const Icon = SCENARIO_ICONS[i % SCENARIO_ICONS.length]
            const color = SEVERITY_COLORS[(scenario.severity as keyof typeof SEVERITY_COLORS) ?? 'medium']
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-bg-elevated border border-white/[0.06] rounded-xl p-4"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-text-primary font-semibold text-sm">{scenario.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full border font-mono"
                        style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
                        {scenario.severity} risk
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed mb-3">{scenario.description}</p>
                    {scenario.financial_impact && (
                      <div className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-danger mb-1">Potential Financial Impact</p>
                        <p className="text-text-secondary text-xs leading-relaxed">{scenario.financial_impact}</p>
                      </div>
                    )}
                    {scenario.mitigation && (
                      <div className="bg-safe/5 border border-safe/20 rounded-lg p-3 mt-2">
                        <p className="text-xs font-medium text-safe mb-1">Mitigation Strategy</p>
                        <p className="text-text-secondary text-xs leading-relaxed">{scenario.mitigation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}


interface Props {
  contract: ContractDetail
}