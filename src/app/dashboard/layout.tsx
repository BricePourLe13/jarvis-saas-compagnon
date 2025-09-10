/**
 * 🏗️ LAYOUT DASHBOARD UNIFIÉ
 * Layout principal pour toutes les pages du nouveau dashboard
 */

'use client'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutProps) {
  // Le layout est maintenant géré par le composant DashboardLayout dans chaque page
  // Cela permet une flexibilité maximale pour chaque niveau de navigation
  return <>{children}</>
}
