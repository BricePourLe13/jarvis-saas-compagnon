'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Activity, 
  Wrench, 
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  roles: ('super_admin' | 'gym_manager')[]
}

interface CollapsibleSidebarProps {
  userRole: 'super_admin' | 'gym_manager' | 'member'
  onLogout: () => void
}

export default function CollapsibleSidebar({ userRole, onLogout }: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()

  const navItems: NavItem[] = userRole === 'super_admin' 
    ? [
        { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/dashboard', roles: ['super_admin', 'gym_manager'] },
        { label: 'Salles', icon: Building2, href: '/dashboard/admin/gyms', roles: ['super_admin'] },
        { label: 'Équipe', icon: Users, href: '/dashboard/admin/users', roles: ['super_admin'] },
        { label: 'Sessions', icon: Activity, href: '/dashboard/admin/sessions', roles: ['super_admin'] },
      ]
    : [
        { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: '/dashboard', roles: ['super_admin', 'gym_manager'] },
        { label: 'Membres', icon: Users, href: '/dashboard/members', roles: ['gym_manager'] },
        { label: 'Sessions', icon: Activity, href: '/dashboard/sessions', roles: ['gym_manager'] },
        { label: 'Outils', icon: Wrench, href: '/dashboard/tools', roles: ['gym_manager'] },
      ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-neutral-700" strokeWidth={1.5} />
      </button>

      {/* Overlay pour mobile */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden fixed inset-0 bg-black/20 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? '60px' : '240px',
          x: isCollapsed && window.innerWidth < 1024 ? '-100%' : 0
        }}
        onMouseEnter={() => window.innerWidth >= 1024 && setIsCollapsed(false)}
        onMouseLeave={() => window.innerWidth >= 1024 && setIsCollapsed(true)}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 z-40 flex flex-col"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-neutral-200 px-4">
          <motion.div
            animate={{ opacity: isCollapsed ? 1 : 0 }}
            className="absolute"
          >
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-xs font-light">J</span>
            </div>
          </motion.div>
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="absolute"
          >
            <h1 className="text-lg font-light tracking-tight text-neutral-900">JARVIS</h1>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center h-10 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-neutral-100 text-neutral-900' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
              >
                <div className="w-12 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-light tracking-tight whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={onLogout}
            className="flex items-center w-full h-10 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <div className="w-12 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-light tracking-tight"
                >
                  Déconnexion
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Expand indicator (desktop only) */}
        {isCollapsed && (
          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
            <div className="w-4 h-12 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm">
              <ChevronRight className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
            </div>
          </div>
        )}
      </motion.aside>
    </>
  )
}

