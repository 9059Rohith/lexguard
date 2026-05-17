'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit3, Save, X, BookOpen, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { DropZoneModal } from '@/components/upload/DropZoneModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePlaybooks, useCreatePlaybook, useUpdatePlaybook, useDeletePlaybook } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import type { Playbook } from '@/lib/types'

function PlaybookCard({ playbook }: { playbook: Playbook }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(playbook.name)
  const [desc, setDesc] = useState(playbook.description)
  const updatePlaybook = useUpdatePlaybook()
  const deletePlaybook = useDeletePlaybook()

  const handleSave = async () => {
    try {
      await updatePlaybook.mutateAsync({ id: playbook.id, data: { name, description: desc, rules: playbook.rules } })
      toast.success('Playbook updated')
      setEditing(false)
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${playbook.name}"?`)) return
    try {
      await deletePlaybook.mutateAsync(playbook.id)
      toast.success('Playbook deleted')
    } catch { toast.error('Failed to delete') }
  }

  const toggleRule = async (ruleId: string) => {
    const updatedRules = playbook.rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    try {
      await updatePlaybook.mutateAsync({ id: playbook.id, data: { name, description: desc, rules: updatedRules } })
    } catch { toast.error('Failed to update rule') }
  }

  return (
    <Card goldHover className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/[0.06]">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-bg-elevated border border-gold/30 rounded-lg px-3 py-1.5 text-sm text-text-primary w-full mb-2 focus:outline-none"
            />
          ) : (
            <h3 className="text-text-primary font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              {playbook.name}
            </h3>
          )}
          {editing ? (
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="bg-bg-elevated border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-text-secondary w-full resize-none focus:outline-none"
              rows={2}
            />
          ) : (
            <p className="text-text-secondary text-sm mt-1">{playbook.description}</p>
          )}
        </div>
        <div className="flex gap-1 ml-3 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1.5 text-safe hover:bg-safe/10 rounded transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 text-text-muted hover:text-text-secondary rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-text-muted hover:text-danger rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rules */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Rules</p>
        {playbook.rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm">{rule.rule_text}</p>
              {rule.category && (
                <p className="text-text-muted text-xs mt-0.5">Category: {rule.category}</p>
              )}
            </div>
            <button
              onClick={() => toggleRule(rule.id)}
              className={`flex-shrink-0 ml-3 transition-colors ${rule.enabled ? 'text-safe' : 'text-text-muted'}`}
            >
              {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function PlaybooksPage() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const { data: playbooks, isLoading } = usePlaybooks()
  const createPlaybook = useCreatePlaybook()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await createPlaybook.mutateAsync({
        name: newName,
        description: newDesc,
        rules: [{ rule_text: 'Flag all unlimited liability clauses', category: 'Liability', enabled: true }],
      })
      toast.success('Playbook created')
      setCreating(false)
      setNewName('')
      setNewDesc('')
    } catch { toast.error('Failed to create playbook') }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />
      <Sidebar />
      <DropZoneModal />
      <main className="transition-all duration-200 pt-14" style={{ marginLeft: collapsed ? 64 : 220 }}>
        <div className="p-6 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Playbooks</h1>
              <p className="text-text-secondary text-sm mt-0.5">Standard rules for contract review by type</p>
            </div>
            <Button variant="gold" onClick={() => setCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Playbook
            </Button>
          </motion.div>

          {/* New Playbook Form */}
          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-bg-surface border border-gold/20 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-text-primary font-medium text-sm">New Playbook</h3>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Playbook name (e.g., Employment Contracts)"
                className="w-full bg-bg-elevated border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold/40"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-bg-elevated border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold/40"
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                <Button variant="gold" size="sm" onClick={handleCreate} loading={createPlaybook.isPending}>Create</Button>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-64 skeleton rounded-xl" />)}
            </div>
          ) : !playbooks?.length ? (
            <div className="text-center py-16 text-text-muted">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No playbooks yet. Create your first one.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {playbooks.map((pb) => <PlaybookCard key={pb.id} playbook={pb} />)}
            </motion.div>
          )}

          {/* Preferred Terms Mapping Table */}
          <PreferredTermsTable />

          {/* Template File Uploader */}
          <TemplateUploader />
        </div>
      </main>
    </div>
  )
}

// ─── Preferred Terms Table ─────────────────────────────────────────────────────
const DEFAULT_TERMS = [
  { clause: 'Liability Cap', mandatory: 'Limit to 12 months of fees paid', unapproved: 'Unlimited liability', fallback: 'Cap at $500K if unlimited not removed' },
  { clause: 'Governing Law', mandatory: 'Delaware / Singapore', unapproved: 'Jurisdiction unknown to party', fallback: 'Mutual agreement to arbitration (ICC)' },
  { clause: 'IP Assignment', mandatory: 'Background IP excluded', unapproved: 'All IP assigned to counterparty', fallback: 'License-back for own use retained' },
  { clause: 'Termination Notice', mandatory: '30-day notice with cure period', unapproved: 'Immediate termination for convenience', fallback: '14-day notice with 7-day cure' },
  { clause: 'Confidentiality Term', mandatory: '2 years post-agreement', unapproved: 'Perpetual / unlimited', fallback: '3 years maximum' },
  { clause: 'Indemnification', mandatory: 'Mutual indemnification', unapproved: 'Unilateral indemnification', fallback: 'Cap indemnity at contract value' },
]

function PreferredTermsTable() {
  const [terms, setTerms] = useState(DEFAULT_TERMS)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-text-primary font-semibold text-base">Preferred Terms Mapping</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30 font-medium">Standard</span>
      </div>
      <p className="text-text-muted text-sm mb-4">Define what's mandatory, unacceptable, and the fallback position for key clause types.</p>
      <div className="rounded-xl overflow-hidden border border-white/[0.06]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-bg-elevated">
              <th className="text-left px-4 py-3 text-text-muted font-medium w-1/5">Clause Type</th>
              <th className="text-left px-4 py-3 font-medium w-1/4" style={{ color: '#00D084' }}>Mandatory (Must Have)</th>
              <th className="text-left px-4 py-3 font-medium w-1/4" style={{ color: '#FF4444' }}>Unapproved (Reject)</th>
              <th className="text-left px-4 py-3 font-medium w-1/4" style={{ color: '#FF8C00' }}>Fallback Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] bg-bg-surface">
            {terms.map((row, i) => (
              <tr key={i} className="hover:bg-bg-elevated transition-colors group">
                <td className="px-4 py-3 text-text-primary font-medium">{row.clause}</td>
                <td className="px-4 py-3 text-text-secondary">{row.mandatory}</td>
                <td className="px-4 py-3 text-text-secondary">{row.unapproved}</td>
                <td className="px-4 py-3 text-text-secondary">{row.fallback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

// ─── Template Uploader ─────────────────────────────────────────────────────────
function TemplateUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f)
  }

  const handleExtract = () => {
    if (!file) return
    setUploading(true)
    // Placeholder — in production, would POST to /api/analyze/upload with playbook_mode=true
    setTimeout(() => {
      toast.success(`Template "${file.name}" queued for rule extraction`)
      setFile(null)
      setUploading(false)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8 mb-4"
    >
      <h2 className="text-text-primary font-semibold text-base mb-1">Template Extractor</h2>
      <p className="text-text-muted text-sm mb-4">Upload a model contract to extract playbook rules automatically.</p>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-white/[0.1] rounded-xl p-8 text-center transition-colors hover:border-gold/30 cursor-pointer"
      >
        {file ? (
          <div className="space-y-3">
            <p className="text-text-primary text-sm font-medium">{file.name}</p>
            <p className="text-text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
              <Button variant="gold" size="sm" onClick={handleExtract} loading={uploading}>Extract Rules</Button>
            </div>
          </div>
        ) : (
          <>
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-40" />
            <p className="text-text-secondary text-sm">Drop a PDF or DOCX template here</p>
            <p className="text-text-muted text-xs mt-1">Rules will be extracted and added to your playbook</p>
            <label className="mt-3 inline-block cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
              <span className="text-xs text-gold underline">Browse files</span>
            </label>
          </>
        )}
      </div>
    </motion.div>
  )
}
