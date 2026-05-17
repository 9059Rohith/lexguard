'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Trash2, Eye, Clock, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { DropZoneModal } from '@/components/upload/DropZoneModal'
import { RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useContracts, useDeleteContract } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { formatDateTime, truncate } from '@/lib/utils'

export default function HistoryPage() {
  const router = useRouter()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const [search, setSearch] = useState('')
  const { data: contracts, isLoading } = useContracts()
  const deleteContract = useDeleteContract()

  const filtered = contracts?.filter((c) =>
    !search ||
    c.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    c.contract_type.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this contract permanently?')) return
    try {
      await deleteContract.mutateAsync(id)
      toast.success('Contract deleted')
    } catch {
      toast.error('Failed to delete contract')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />
      <DropZoneModal />
      <main className="transition-all duration-200 pt-14" style={{ marginLeft: collapsed ? 64 : 220 }}>
        <div className="p-6 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Contract History</h1>
            <p className="text-text-secondary text-sm mt-0.5">All analyzed contracts</p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by filename or contract type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-bg-surface border border-white/[0.06] rounded-xl skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No contracts match your search.' : 'No contracts analyzed yet.'}</p>
            </div>
          ) : (
            <div className="bg-bg-surface border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-bg-elevated">
                    {['Contract', 'Type', 'Risk Level', 'Score', 'Clauses', 'Date', ''].map(h => (
                      <th key={h} className="text-left text-xs text-text-muted font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/[0.04] hover:bg-bg-elevated transition-colors cursor-pointer group"
                      onClick={() => router.push(`/analyze/${c.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-text-primary text-sm font-medium">
                          {truncate(c.original_filename, 40)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-bg-elevated border border-white/[0.06] rounded px-2 py-0.5 text-text-muted">
                          {c.contract_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={c.risk_level} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-text-primary">
                          {c.status === 'complete' ? c.aggregate_risk_index.toFixed(0) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.status === 'complete' ? (
                          <div className="flex gap-1">
                            <span className="text-xs text-danger font-mono">{c.high_count}H</span>
                            <span className="text-xs text-text-muted">/</span>
                            <span className="text-xs text-warning font-mono">{c.moderate_count}M</span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">{c.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-text-muted text-xs">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(c.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
                            onClick={(e) => { e.stopPropagation(); router.push(`/analyze/${c.id}`) }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 text-text-muted hover:text-danger rounded transition-colors"
                            onClick={(e) => handleDelete(c.id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
