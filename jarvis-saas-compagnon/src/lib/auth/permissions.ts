/**
 * 🔐 SYSTÈME PERMISSIONS HIÉRARCHIQUE
 * Architecture propre pour les rôles
 */

import { UserRole } from '../../../generated/prisma'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  owned_franchises?: string[]  // IDs franchises possédées
  managed_gyms?: string[]      // IDs salles gérées
}

/**
 * 🎯 Permissions par rôle
 */
export const PERMISSIONS = {
  SUPER_ADMIN: {
    can_view_all_franchises: true,
    can_create_franchises: true,
    can_manage_users: true,
    can_view_all_analytics: true,
    can_access_system_settings: true
  },
  
  FRANCHISE_OWNER: {
    can_view_own_franchise: true,
    can_manage_own_gyms: true,
    can_create_gyms: true,
    can_view_franchise_analytics: true,
    can_manage_gym_managers: true
  },
  
  GYM_MANAGER: {
    can_view_own_gym: true,
    can_manage_members: true,
    can_configure_kiosk: true,
    can_view_gym_analytics: true
  },
  
  MEMBER: {
    can_use_kiosk: true
  }
} as const

/**
 * ✅ Vérifier si utilisateur peut voir une franchise
 */
export function canViewFranchise(user: AuthUser, franchiseId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  if (user.role === 'FRANCHISE_OWNER') {
    return user.owned_franchises?.includes(franchiseId) ?? false
  }
  return false
}

/**
 * ✅ Vérifier si utilisateur peut voir une salle
 */
export function canViewGym(user: AuthUser, gymId: string, franchiseId?: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  
  if (user.role === 'FRANCHISE_OWNER' && franchiseId) {
    return user.owned_franchises?.includes(franchiseId) ?? false
  }
  
  if (user.role === 'GYM_MANAGER') {
    return user.managed_gyms?.includes(gymId) ?? false
  }
  
  return false
}

/**
 * ✅ Vérifier permission spécifique
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  const rolePermissions = PERMISSIONS[user.role]
  return (rolePermissions as any)[permission] ?? false
}

/**
 * 🚫 Middleware de protection des routes
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (user: AuthUser | null): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }
}

/**
 * 🔍 Filtrer données selon permissions
 */
export function filterByPermissions<T extends { id: string }>(
  user: AuthUser,
  items: T[],
  type: 'franchise' | 'gym'
): T[] {
  if (user.role === 'SUPER_ADMIN') return items
  
  if (type === 'franchise' && user.role === 'FRANCHISE_OWNER') {
    return items.filter(item => user.owned_franchises?.includes(item.id))
  }
  
  if (type === 'gym' && user.role === 'GYM_MANAGER') {
    return items.filter(item => user.managed_gyms?.includes(item.id))
  }
  
  return []
}
