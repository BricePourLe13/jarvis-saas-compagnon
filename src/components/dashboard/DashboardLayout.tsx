"use client"

import { ReactNode, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Monitor, 
  Users, 
  Activity, 
  AlertCircle, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'super_admin' | 'gym_manager'
  userName: string
  userEmail: string
}

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Vue d\'ensemble',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Salles',
    href: '/dashboard/gyms',
    icon: Building2,
    adminOnly: true,
  },
  {
    label: 'Kiosks',
    href: '/dashboard/kiosks',
    icon: Monitor,
  },
  {
    label: 'Adhérents',
    href: '/dashboard/members',
    icon: Users,
  },
  {
    label: 'Sessions',
    href: '/dashboard/sessions',
    icon: Activity,
  },
  {
    label: 'Insights',
    href: '/dashboard/insights',
    icon: AlertCircle,
  },
]

export default function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = getSupabaseSingleton()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredNavItems = NAV_ITEMS.filter(
    item => !item.adminOnly || userRole === 'super_admin'
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden dashboard-header sticky top-0 z-40 flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-sm">J</span>
          </div>
          <span className="font-semibold text-foreground">JARVIS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar - Fixed Desktop, Slide-in Mobile */}
        <aside className={`
          sidebar fixed lg:static inset-y-0 left-0 z-40
          w-64 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${mobileMenuOpen ? 'top-0' : 'top-16 lg:top-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Desktop Logo */}
            <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">J</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">JARVIS</p>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setMobileMenuOpen(false)
                    }}
                    className={`
                      sidebar-item w-full
                      ${active ? 'sidebar-item-active' : ''}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard/settings')}
                className="sidebar-item w-full mb-1"
              >
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </button>

              <button
                onClick={handleLogout}
                className="sidebar-item w-full text-destructive hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

