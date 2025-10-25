/**
 * 🏗️ LAYOUT DASHBOARD V2 - CONTEXT-AWARE
 * Layout unifié avec Context Provider et navigation adaptative
 */

'use client'

import { ReactNode } from 'react'
import { GymContextProvider } from '@/contexts/GymContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <GymContextProvider>
      <DashboardShell>{children}</DashboardShell>
    </GymContextProvider>
  )
}
