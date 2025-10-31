'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
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
  ChevronDown,
  Monitor,
  Activity,
  FileText,
  UserCog
} from 'lucide-react'
import { useGymContext } from '@/contexts/GymContext'
import { ContextSwitcher } from './ContextSwitcher'

interface DashboardShellProps {
  children: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
  roles?: string[]
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: string[]
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const supabase = getSupabaseSingleton()
  const pathname = usePathname()
  
  const { userRole, userEmail, loading: contextLoading } = useGymContext()
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Navigation sections (adaptées au rôle)
  const navigationSections: NavSection[] = [
    {
      title: "Dashboard",
      items: [
        { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Gestion",
      items: [
        { label: "Membres", href: "/dashboard/members", icon: Users },
        { label: "Sessions JARVIS", href: "/dashboard/sessions", icon: MessageSquare },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      ]
    },
    {
      title: "Kiosk",
      items: [
        { label: "Interface Kiosk", href: "/dashboard/kiosk", icon: Monitor },
      ],
      roles: ['gym_manager', 'super_admin', 'franchise_owner']
    },
    {
      title: "Administration",
      items: [
        { label: "Franchises", href: "/dashboard/admin/franchises", icon: Building2 },
        { label: "Salles", href: "/dashboard/admin/gyms", icon: Building2 },
        { label: "Utilisateurs", href: "/dashboard/admin/users", icon: UserCog },
        { label: "Monitoring", href: "/dashboard/admin/monitoring", icon: Activity },
        { label: "Logs", href: "/dashboard/admin/logs", icon: FileText },
      ],
      roles: ['super_admin']
    },
    {
      title: "Paramètres",
      items: [
        { label: "Mon profil", href: "/dashboard/settings", icon: Settings },
        { label: "Équipe", href: "/dashboard/team", icon: Users, roles: ['franchise_owner', 'super_admin'] },
      ]
    }
  ]

  // Filter sections by role
  const filteredSections = navigationSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => 
        !item.roles || (userRole && item.roles.includes(userRole))
      )
    }))
    .filter(section => 
      section.items.length > 0 && 
      (!section.roles || (userRole && section.roles.includes(userRole)))
    )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-black/40 backdrop-blur-xl border-r border-primary/10 w-64`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary via-purple-600 to-primary animate-pulse">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-transparent blur-md"></div>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/90"></div>
              </div>
            </div>
            <span className="font-bold text-foreground tracking-wide">JARVIS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto">
          {filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        active 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
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
                  {userEmail?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {userEmail || 'Utilisateur'}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {userRole?.replace('_', ' ') || 'Manager'}
                </div>
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
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-black/20 backdrop-blur-xl border-b border-primary/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <ContextSwitcher />
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
