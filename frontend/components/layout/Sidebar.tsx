'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FilePlus, History, BookOpen, GitCompare,
  ChevronLeft, ChevronRight, LogOut, Layers, ShieldCheck, AlertCircle
} from 'lucide-react'
import { useAppStore, useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.FC<any>
  label: string
  href?: string | null
  action?: string
  badge?: string
  badgeColor?: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FilePlus, label: 'New Analysis', href: null, action: 'upload' },
  { icon: Layers, label: 'Workspace', href: '/analyze', badge: 'Active', badgeColor: 'bg-gold/20 text-gold border-gold/30' },
  { icon: History, label: 'History', href: '/history' },
  { icon: BookOpen, label: 'Playbooks', href: '/playbooks' },
  { icon: GitCompare, label: 'Compare', href: '/compare' },
  { icon: ShieldCheck, label: 'Compliance', href: '/history', badge: 'Beta', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const setUploadOpen = useAppStore((s) => s.setUploadModalOpen)
  const currentContractId = useAppStore((s) => s.currentContractId)
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const isWorkspaceActive = pathname.startsWith('/analyze/')

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-14 bottom-0 z-40 flex flex-col glass border-r border-white/[0.06] overflow-hidden"
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          let href = item.href
          // For Workspace route: link to active contract if available
          if (item.label === 'Workspace' && currentContractId) {
            href = `/analyze/${currentContractId}`
          }
          const isActive = href
            ? (pathname === href || pathname.startsWith(href + '/') || (item.label === 'Workspace' && isWorkspaceActive))
            : false

          // Dynamic badge: show Review Pending on Workspace when high-risk contract active
          const showReviewBadge = item.label === 'Workspace' && isWorkspaceActive

          const content = (
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group relative',
                isActive
                  ? 'bg-gold/10 text-gold border-l-2 border-gold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border-l-2 border-transparent'
              )}
              onClick={() => {
                if (item.action === 'upload') setUploadOpen(true)
              }}
            >
              <Icon className={cn(
                'flex-shrink-0 w-5 h-5 transition-colors',
                isActive ? 'text-gold' : 'text-text-muted group-hover:text-text-primary'
              )} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Dynamic badge */}
              {!collapsed && showReviewBadge && (
                <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-400/30">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Active
                </span>
              )}
              {!collapsed && !showReviewBadge && item.badge && (
                <span className={cn('flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border', item.badgeColor)}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-bg-overlay border border-white/[0.08] rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                  {showReviewBadge && <span className="ml-1 text-yellow-400">●</span>}
                </div>
              )}
            </div>
          )

          if (href) {
            return (
              <Link key={item.label} href={href}>
                {content}
              </Link>
            )
          }
          return <div key={item.label}>{content}</div>
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 space-y-1 border-t border-white/[0.06]">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-text-primary text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-text-muted text-xs truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-all duration-150 group relative"
        >
          <LogOut className="flex-shrink-0 w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-bg-overlay border border-white/[0.08] rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Sign Out
            </div>
          )}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  )
}

