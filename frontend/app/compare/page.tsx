'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { GitCompare, Upload, X, FileText, AlertTriangle } from 'lucide-react'

const GOLD = '#E8C547'

function DropZone({
  label,
  file,
  onDrop,
  onClear,
}: {
  label: string
  file: File | null
  onDrop: (f: File) => void
  onClear: () => void
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    onDrop: (accepted) => { if (accepted[0]) onDrop(accepted[0]) },
  })

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{label}</h3>
      {file ? (
        <div className="flex-1 rounded-2xl border border-gold/40 bg-gold/5 flex flex-col items-center justify-center gap-3 p-6">
          <FileText className="w-10 h-10 text-gold" />
          <p className="text-white font-semibold text-center break-all">{file.name}</p>
          <p className="text-white/40 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
          <button
            onClick={onClear}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
          >
            <X className="w-4 h-4" /> Remove
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all min-h-64
            ${isDragActive ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30 bg-white/2'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-white/30" style={{ color: isDragActive ? GOLD : undefined }} />
          <p className="text-white/50 text-sm text-center">
            {isDragActive ? 'Drop it here' : 'Drag & drop PDF, DOCX, or TXT'}
          </p>
          <p className="text-white/30 text-xs">or click to browse</p>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<null | { added: string[]; removed: string[]; common: string[] }>(null)

  const handleCompare = async () => {
    if (!fileA || !fileB) return
    setComparing(true)
    // Simulate comparison — real implementation would call backend
    await new Promise((r) => setTimeout(r, 1800))
    setResult({
      added: [
        'Clause 3.2 — Unlimited liability for data breaches added in Version B',
        'Clause 7.1 — Automatic renewal clause with 90-day notice period added',
        'Clause 12 — Mandatory arbitration in Delaware jurisdiction added',
      ],
      removed: [
        'Clause 5.4 — Mutual indemnification clause removed from Version B',
        'Clause 9 — Force majeure provisions removed',
      ],
      common: [
        'Payment terms (Net-30)',
        'Confidentiality obligations',
        'IP ownership provisions',
        'Termination for cause',
      ],
    })
    setComparing(false)
  }

  const reset = () => { setFileA(null); setFileB(null); setResult(null) }

  return (
    <div className="min-h-screen bg-bg-base text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white">Contract Compare</h1>
          </div>
          <p className="text-white/40 text-sm ml-13">
            Upload two contract versions to identify additions, removals, and shared clauses.
          </p>
        </div>

        {!result ? (
          <>
            {/* Drop zones */}
            <div className="flex gap-6 mb-6">
              <DropZone label="Version A (Original)" file={fileA} onDrop={setFileA} onClear={() => setFileA(null)} />
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-white/30" />
                </div>
              </div>
              <DropZone label="Version B (Revised)" file={fileB} onDrop={setFileB} onClear={() => setFileB(null)} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleCompare}
                disabled={!fileA || !fileB || comparing}
                className="px-8 py-3 rounded-xl font-semibold text-bg-base transition-all
                  bg-gold hover:bg-gold/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {comparing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                    Comparing…
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4" />
                    Compare Contracts
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Added */}
              <div className="rounded-2xl border border-safe/20 bg-safe/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-safe" />
                  <h3 className="font-semibold text-safe text-sm">Added in Version B</h3>
                  <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{result.added.length}</span>
                </div>
                <ul className="space-y-2">
                  {result.added.map((item, i) => (
                    <li key={i} className="text-xs text-white/70 p-2 rounded-lg bg-white/3 leading-relaxed">
                      + {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Removed */}
              <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <h3 className="font-semibold text-danger text-sm">Removed from Version B</h3>
                  <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{result.removed.length}</span>
                </div>
                <ul className="space-y-2">
                  {result.removed.map((item, i) => (
                    <li key={i} className="text-xs text-white/70 p-2 rounded-lg bg-white/3 leading-relaxed">
                      − {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common */}
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-white/40" />
                  <h3 className="font-semibold text-white/60 text-sm">Unchanged Clauses</h3>
                  <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{result.common.length}</span>
                </div>
                <ul className="space-y-2">
                  {result.common.map((item, i) => (
                    <li key={i} className="text-xs text-white/50 p-2 rounded-lg bg-white/3">
                      = {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Summary banner */}
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-warning text-sm font-semibold">Risk Delta Detected</p>
                <p className="text-white/50 text-xs mt-1">
                  Version B introduces {result.added.length} new clause{result.added.length !== 1 ? 's' : ''} including unlimited liability exposure.
                  Review additions carefully before signing.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={reset}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Compare New Contracts
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
