'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, MagnifyingGlass, Warning, Scales, ChatCircle, FileDoc } from '@phosphor-icons/react'
import { ArrowRight, Upload, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/store'

const features = [
  {
    icon: Shield,
    title: 'Contract Risk Scoring',
    desc: 'Mathematical risk formula (CRI) scores your contract 0-100. Know your exposure instantly.',
    color: '#E8C547',
  },
  {
    icon: MagnifyingGlass,
    title: 'Clause Extraction',
    desc: 'AI identifies every risky clause — non-competes, IP grabs, auto-renewals, and more.',
    color: '#4D9EFF',
  },
  {
    icon: Warning,
    title: 'Hidden Liability Detection',
    desc: 'Uncovers buried clauses that could cost you thousands in penalties or lost opportunities.',
    color: '#FF4444',
  },
  {
    icon: Scales,
    title: 'Fairness Analysis',
    desc: 'Rates each clause for one-sidedness. See exactly who the contract was written to protect.',
    color: '#00D084',
  },
  {
    icon: ChatCircle,
    title: 'AI Legal Q&A',
    desc: 'Ask any question about your contract in plain English. Get specific, actionable answers.',
    color: '#A78BFA',
  },
  {
    icon: FileDoc,
    title: 'Redline Suggestions',
    desc: 'Get fairer rewritten versions of every risky clause, ready to send back for negotiation.',
    color: '#FF8C00',
  },
]

const howItWorks = [
  { step: '01', title: 'Upload Your Contract', desc: 'Drop any PDF, DOCX, or TXT file. Supports scanned documents too.' },
  { step: '02', title: 'AI Analyzes Everything', desc: 'Our multi-agent system reads every clause using Groq LLaMA-3.3. Takes ~30 seconds.' },
  { step: '03', title: 'Get Your Risk Report', desc: 'Receive a scored, categorized breakdown with plain English explanations and redline suggestions.' },
]

const contractTypes = [
  'Employment Contracts', 'NDAs', 'SaaS Terms', 'Rental Agreements',
  'Privacy Policies', 'Vendor Agreements', 'Consulting Contracts', 'Freelance Agreements',
]

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
}

export default function LandingPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06] h-14">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 7v9c0 7 5.4 13.5 12 15 6.6-1.5 12-8 12-15V7L16 2z"
                fill="#E8C547" fillOpacity="0.15" stroke="#E8C547" strokeWidth="1.5" />
              <path d="M11 16l3 3 7-7" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-lg tracking-wide">LEXGUARD</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gold" size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        <div className="absolute inset-0 gradient-mesh" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-blue/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-danger/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-gold text-sm font-medium font-mono">AI-Powered Contract Intelligence</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-display text-text-primary mb-6 leading-[1.05]"
          >
            Know What You&apos;re
            <br />
            <span className="text-gold italic">Signing</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            LEXGUARD analyzes any contract in 60 seconds and tells you exactly what could{' '}
            <span className="text-danger font-medium">hurt you</span> — in plain English, with{' '}
            <span className="text-gold font-medium">redline suggestions</span> to fight back.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/signup">
              <Button variant="gold" size="lg" className="text-base px-8 py-3.5">
                Analyze a Contract Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="text-base px-8 py-3.5">
                Sign In to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Scrolling contract types */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {contractTypes.map((type) => (
              <span
                key={type}
                className="text-xs text-text-muted bg-bg-elevated border border-white/[0.06] rounded-full px-3 py-1"
              >
                {type}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-white/40 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Risk preview stats */}
      <section className="py-12 border-y border-white/[0.06] bg-bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '94%', label: 'Of standard contracts contain at least one unfair clause', color: '#FF4444' },
              { value: '60s', label: 'Average analysis time for a 20-page contract', color: '#E8C547' },
              { value: '15+', label: 'Risk categories analyzed per contract', color: '#4D9EFF' },
              { value: '100%', label: 'Private — your contracts never leave your session', color: '#00D084' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl font-mono font-bold mb-2" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-text-secondary text-sm leading-snug">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-gold text-sm font-mono font-medium tracking-widest uppercase mb-3 block">How It Works</span>
            <h2 className="text-4xl font-display text-text-primary">Three steps to clarity</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="card card-gold-hover p-6">
                  <div className="text-5xl font-mono font-bold text-white/5 mb-4 absolute top-4 right-6">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-gold font-mono font-bold text-sm">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10 items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-bg-surface border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-gold text-sm font-mono font-medium tracking-widest uppercase mb-3 block">Features</span>
            <h2 className="text-4xl font-display text-text-primary mb-4">Complete contract protection</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Not just a keyword scanner — LEXGUARD uses real legal reasoning to understand context and intent.
            </p>
          </motion.div>

          <motion.div
            variants={stagger.container}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div key={i} variants={stagger.item}>
                  <div className="card card-gold-hover p-6 h-full group">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                      style={{ background: `${feat.color}15`, border: `1px solid ${feat.color}30` }}
                    >
                      <Icon size={22} color={feat.color} weight="duotone" />
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2">{feat.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-gold/20 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl font-display text-text-primary mb-6">
            Stop signing contracts blind
          </h2>
          <p className="text-text-secondary text-xl mb-10">
            It takes 60 seconds. Upload your contract and know exactly what you&apos;re agreeing to.
          </p>
          <Link href="/signup">
            <Button variant="gold" size="lg" className="text-lg px-10 py-4">
              <Upload className="w-5 h-5" />
              Analyze Your First Contract Free
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-text-muted">
            {['No credit card required', 'Results in 60 seconds', '100% private'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-safe" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L4 7v9c0 7 5.4 13.5 12 15 6.6-1.5 12-8 12-15V7L16 2z"
                    fill="#E8C547" fillOpacity="0.15" stroke="#E8C547" strokeWidth="1.5" />
                  <path d="M11 16l3 3 7-7" stroke="#E8C547" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="font-display text-text-primary tracking-wide">LEXGUARD</span>
              </Link>
              <p className="text-text-muted text-sm max-w-xs leading-relaxed">
                AI-Powered Contract Intelligence Platform
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-text-secondary text-sm font-medium mb-3">Product</p>
                <div className="space-y-2">
                  {['Features', 'How It Works', 'Pricing'].map(link => (
                    <p key={link} className="text-text-muted text-sm hover:text-text-secondary cursor-pointer transition-colors">{link}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-text-secondary text-sm font-medium mb-3">Legal</p>
                <div className="space-y-2">
                  {['Privacy Policy', 'Terms of Service', 'Disclaimer'].map(link => (
                    <p key={link} className="text-text-muted text-sm hover:text-text-secondary cursor-pointer transition-colors">{link}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6">
            <p className="text-text-muted text-xs text-center leading-relaxed">
              ⚠ LEXGUARD provides AI-powered analysis for awareness only. It is not a substitute for professional legal counsel.
              Always consult a licensed attorney before signing important contracts.
            </p>
            <p className="text-text-muted text-xs text-center mt-2">
              © 2024 LexGuard AI. Built for hackathon demonstration purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
