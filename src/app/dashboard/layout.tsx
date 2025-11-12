/**
 * 🏗️ LAYOUT DASHBOARD MONOCHROME
 * Design épuré, minimaliste, cohérent
 * Palette: Blanc/Gris/Noir uniquement
 * Sidebar rétractable avec Framer Motion
 */

'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { GymContextProvider, useGymContext } from '@/contexts/GymContext'
import CollapsibleSidebar from '@/components/dashboard/CollapsibleSidebar'
import { ContextSwitcher } from '@/components/dashboard/ContextSwitcher'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface DashboardLayoutProps {
  children: ReactNode
}

function DashboardContent({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { userRole } = useGymContext()

  const handleLogout = async () => {
    const supabase = getSupabaseSingleton()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 overflow-x-hidden">
      {/* Sidebar Rétractable */}
      <CollapsibleSidebar userRole={userRole} onLogout={handleLogout} />

      {/* Main Content avec padding pour sidebar */}
      <div className="lg:pl-[60px] transition-all duration-200">
        {/* Top Bar avec Context Switcher */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-light text-neutral-600 tracking-tight">
              {userRole === 'super_admin' ? 'Administration Plateforme' : 'Dashboard Gérant'}
            </h2>
          </div>
          <ContextSwitcher />
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <GymContextProvider>
      <DashboardContent>{children}</DashboardContent>
    </GymContextProvider>
  )
}
