"use client"

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  userRole?: 'super_admin' | 'franchise_owner' | 'manager'
  userName?: string
  gymName?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Vue d\'ensemble',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
    roles: ['super_admin', 'franchise_owner', 'manager']
  },
  {
    label: 'Membres',
    href: '/dashboard/members-v2',
    icon: Users,
    roles: ['super_admin', 'franchise_owner', 'manager']
  },
  {
    label: 'Sessions JARVIS',
    href: '/dashboard/sessions-v2',
    icon: MessageSquare,
    roles: ['super_admin', 'franchise_owner', 'manager']
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics-v2',
    icon: BarChart3,
    roles: ['super_admin', 'franchise_owner', 'manager']
  },
  {
    label: 'Franchises',
    href: '/dashboard/franchises',
    icon: Building2,
    roles: ['super_admin', 'franchise_owner']
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['super_admin', 'franchise_owner', 'manager']
  }
]

export function DashboardShell({
  children,
  userRole = 'manager',
  userName = 'Utilisateur',
  gymName = 'Ma Salle'
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Filtrer les items de navigation selon le rôle
  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href)
  }

  const handleLogout = async () => {
    // TODO: Implémenter la déconnexion Supabase
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-card border-r border-border w-64`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">J</span>
            </div>
            <span className="font-bold text-foreground">JARVIS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gym/User Context */}
        <div className="px-6 py-4 border-b border-border">
          <div className="text-sm text-muted-foreground">Salle actuelle</div>
          <div className="font-medium text-foreground mt-1">{gymName}</div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Menu (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {userName[0]}
                </span>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-foreground">{userName}</div>
                <div className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {userMenuOpen && (
            <div className="mt-2 py-2 bg-muted rounded-lg">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="dashboard-header sticky top-0 z-30 h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            {/* Add notifications, search, etc. here */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

