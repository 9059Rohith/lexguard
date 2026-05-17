'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { useAuthStore, useAppStore } from '@/lib/store'
import { DropZoneModal } from '@/components/upload/DropZoneModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />
      <Sidebar />
      <main
        className="transition-all duration-200 pt-14 flex-1"
        style={{ marginLeft: collapsed ? 64 : 220 }}
      >
        {children}
      </main>
      <div style={{ marginLeft: collapsed ? 64 : 220 }} className="transition-all duration-200">
        <LegalFooter />
      </div>
      <DropZoneModal />
    </div>
  )
}
