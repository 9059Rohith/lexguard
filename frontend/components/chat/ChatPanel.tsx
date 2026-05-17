'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore, useAuthStore } from '@/lib/store'
import { Spinner } from '@/components/ui/Spinner'
import type { ChatMessage } from '@/lib/types'

const QUICK_PROMPTS = [
  // Risk
  { label: 'Top 3 Risks', prompt: 'What are the 3 biggest risks in this contract?', color: '#FF4444' },
  { label: 'Liability Exposure', prompt: 'What is the maximum liability exposure under this contract?', color: '#FF6B6B' },
  { label: 'Unilateral IP Transfers', prompt: 'Highlight any unilateral IP assignment clauses that could strip my ownership.', color: '#A78BFA' },
  // Negotiation
  { label: 'Negotiate Redlines', prompt: 'Which clauses should I push back on and what fallback language should I propose?', color: '#FF8C00' },
  { label: 'Fairness Check', prompt: 'Is this contract one-sided? Which party does it favor?', color: '#E8C547' },
  { label: 'Non-Compete Scope', prompt: 'Is the non-compete clause overly broad or enforceable?', color: '#00D084' },
  // Legal
  { label: 'Termination Rights', prompt: 'What are my termination rights and notice requirements?', color: '#4D9EFF' },
  { label: 'Jurisdiction Risk', prompt: 'Which jurisdiction governs this contract and what does that mean for dispute resolution?', color: '#60A5FA' },
  { label: 'Generate Fallbacks', prompt: 'Generate balanced fallback clause language for the highest-risk provisions.', color: '#C084FC' },
]

interface Props {
  contractId: string
}

function MarkdownMessage({ content }: { content: string }) {
  // Basic markdown: bold **text**, bullet points
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\n- /g, '\n• ')
  return (
    <p
      className="text-sm leading-relaxed whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  )
}

export function ChatPanel({ contractId }: Props) {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { chatHistory, addChatMessage, appendToChatMessage } = useAppStore()
  const token = useAuthStore((s) => s.token)
  const messages = chatHistory[contractId] ?? []

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }
    addChatMessage(contractId, userMsg)
    setInput('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: Date.now() }
    addChatMessage(contractId, assistantMsg)

    try {
      const res = await fetch(`${API_URL}/api/analyze/chat/${contractId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, history: messages.slice(-8) }),
      })

      if (!res.ok) throw new Error('Chat failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.token) appendToChatMessage(contractId, parsed.token)
              else if (parsed.error) toast.error(parsed.error)
            } catch {
              // plain text fallback
              appendToChatMessage(contractId, data)
            }
          }
        }
      }
    } catch {
      toast.error('Chat error. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-gold" />
            </div>
            <p className="text-text-primary font-medium mb-1">Ask about your contract</p>
            <p className="text-text-secondary text-sm max-w-xs">
              Get plain-English answers to any question about the clauses, risks, or your rights.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gold/10 border border-gold/20 text-text-primary'
                    : 'bg-bg-elevated border border-white/[0.06] text-text-secondary'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                {msg.role === 'assistant' && i === messages.length - 1 && streaming && (
                  <span className="inline-block w-1 h-3.5 bg-gold ml-0.5 animate-pulse" />
                )}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts grid */}
      {messages.length === 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mb-2">Suggested Queries</p>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.prompt)}
                className="text-left text-xs bg-bg-elevated border border-white/[0.06] hover:border-opacity-60 text-text-secondary rounded-lg px-2.5 py-2 transition-all"
                style={{ borderLeftColor: `${p.color}50`, borderLeftWidth: '2px' }}
                title={p.prompt}
              >
                <span style={{ color: p.color }} className="text-[10px] font-semibold block mb-0.5 uppercase tracking-wide">
                  {p.label}
                </span>
                <span className="line-clamp-2 text-text-muted text-[11px]">{p.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask anything about this contract..."
            rows={1}
            className="flex-1 bg-bg-elevated border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-gold/40 transition-colors max-h-32"
            style={{ fieldSizing: 'content' } as any}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 w-10 h-10 bg-gold hover:bg-gold/80 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all"
          >
            {streaming ? <Spinner size={16} /> : <Send className="w-4 h-4 text-bg-base" />}
          </button>
        </div>
      </div>
    </div>
  )
}
