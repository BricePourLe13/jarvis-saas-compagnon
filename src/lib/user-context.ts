/**
 * 🔐 SYSTÈME DE CONTEXTE UTILISATEUR UNIFIÉ
 * Gestion centralisée des permissions et du contexte multi-tenant
 */

import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

export type UserRole = 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'

export interface UserContext {
  // Identité utilisateur
  id: string
  email: string
  full_name: string
  
  // Rôle et permissions
  role: UserRole
  
  // Accès aux ressources (selon le rôle)
  franchiseIds: string[]  // Franchises accessibles
  gymIds: string[]        // Gyms accessibles
  
  // Contexte actuel (navigation)
  currentFranchiseId?: string
  currentGymId?: string
  
  // Métadonnées
  is_active: boolean
  last_login?: string
  mfa_required: boolean
  mfa_enrolled: boolean
}

export interface NavigationContext {
  // Niveau actuel dans la hiérarchie
  level: 'global' | 'franchise' | 'gym'
  
  // IDs du contexte actuel
  franchiseId?: string
  gymId?: string
  
  // Données enrichies pour l'affichage
  franchiseName?: string
  gymName?: string
  
  // Navigation disponible
  availableFranchises: Array<{ id: string; name: string; city: string }>
  availableGyms: Array<{ id: string; name: string; franchise_id: string }>
}

// ===========================================
// 🛡️ VÉRIFICATIONS DE PERMISSIONS
// ===========================================

export class PermissionChecker {
  constructor(private userContext: UserContext) {}

  // Vérifications globales
  canAccessGlobalDashboard(): boolean {
    return this.userContext.role === 'super_admin'
  }

  canManageUsers(): boolean {
    return ['super_admin', 'franchise_owner'].includes(this.userContext.role)
  }

  canManageFranchises(): boolean {
    return this.userContext.role === 'super_admin'
  }

  // Vérifications par franchise
  canAccessFranchise(franchiseId: string): boolean {
    if (this.userContext.role === 'super_admin') return true
    return this.userContext.franchiseIds.includes(franchiseId)
  }

  canManageFranchise(franchiseId: string): boolean {
    if (this.userContext.role === 'super_admin') return true
    if (this.userContext.role === 'franchise_owner') {
      return this.userContext.franchiseIds.includes(franchiseId)
    }
    return false
  }

  // Vérifications par gym
  canAccessGym(gymId: string): boolean {
    if (this.userContext.role === 'super_admin') return true
    return this.userContext.gymIds.includes(gymId)
  }

  canManageGym(gymId: string): boolean {
    if (['super_admin', 'franchise_owner'].includes(this.userContext.role)) {
      return this.canAccessGym(gymId)
    }
    if (this.userContext.role === 'gym_manager') {
      return this.userContext.gymIds.includes(gymId)
    }
    return false
  }

  // Vérifications spécifiques
  canViewLiveSessions(gymId?: string): boolean {
    if (!gymId) return this.canAccessGlobalDashboard()
    return this.canAccessGym(gymId)
  }

  canManageKiosk(gymId: string): boolean {
    return this.canManageGym(gymId)
  }

  canViewFinancialData(franchiseId?: string): boolean {
    if (this.userContext.role === 'super_admin') return true
    if (franchiseId) {
      return this.canAccessFranchise(franchiseId)
    }
    return this.userContext.role === 'franchise_owner'
  }
}

// ===========================================
// 🔄 GESTION DU CONTEXTE UTILISATEUR
// ===========================================

export class UserContextManager {
  private static instance: UserContextManager
  private userContext: UserContext | null = null
  private navigationContext: NavigationContext | null = null

  static getInstance(): UserContextManager {
    if (!UserContextManager.instance) {
      UserContextManager.instance = new UserContextManager()
    }
    return UserContextManager.instance
  }

  // Charger le contexte utilisateur depuis Supabase
  async loadUserContext(): Promise<UserContext | null> {
    try {
      const supabase = getSupabaseSingleton()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return null

      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          franchise_access,
          gym_access,
          is_active,
          last_login,
          mfa_required,
          mfa_enrolled
        `)
        .eq('id', authUser.id)
        .single()

      if (error || !profile) return null

      // Construire le contexte utilisateur
      const userContext: UserContext = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role as UserRole,
        franchiseIds: profile.franchise_access || [],
        gymIds: profile.gym_access || [],
        is_active: profile.is_active,
        last_login: profile.last_login,
        mfa_required: profile.mfa_required || false,
        mfa_enrolled: profile.mfa_enrolled || false
      }

      this.userContext = userContext
      return userContext

    } catch (error) {
      console.error('🚨 [USER CONTEXT] Erreur chargement:', error)
      return null
    }
  }

  // Charger le contexte de navigation
  async loadNavigationContext(franchiseId?: string, gymId?: string): Promise<NavigationContext> {
    try {
      const supabase = getSupabaseSingleton()
      
      // Déterminer le niveau de navigation
      let level: 'global' | 'franchise' | 'gym' = 'global'
      if (gymId) level = 'gym'
      else if (franchiseId) level = 'franchise'

      // Charger les franchises accessibles
      let franchisesQuery = supabase
        .from('franchises')
        .select('id, name, city')
        .eq('is_active', true)

      if (this.userContext?.role !== 'super_admin') {
        franchisesQuery = franchisesQuery.in('id', this.userContext?.franchiseIds || [])
      }

      const { data: franchises } = await franchisesQuery

      // Charger les gyms accessibles
      let gymsQuery = supabase
        .from('gyms')
        .select('id, name, franchise_id')
        .eq('is_active', true)

      if (franchiseId) {
        gymsQuery = gymsQuery.eq('franchise_id', franchiseId)
      } else if (this.userContext?.role !== 'super_admin') {
        gymsQuery = gymsQuery.in('id', this.userContext?.gymIds || [])
      }

      const { data: gyms } = await gymsQuery

      // Enrichir avec les noms actuels
      let franchiseName: string | undefined
      let gymName: string | undefined

      if (franchiseId) {
        franchiseName = franchises?.find(f => f.id === franchiseId)?.name
      }
      if (gymId) {
        gymName = gyms?.find(g => g.id === gymId)?.name
      }

      const navigationContext: NavigationContext = {
        level,
        franchiseId,
        gymId,
        franchiseName,
        gymName,
        availableFranchises: franchises || [],
        availableGyms: gyms || []
      }

      this.navigationContext = navigationContext
      return navigationContext

    } catch (error) {
      console.error('🚨 [NAVIGATION CONTEXT] Erreur chargement:', error)
      return {
        level: 'global',
        availableFranchises: [],
        availableGyms: []
      }
    }
  }

  // Getters
  getUserContext(): UserContext | null {
    return this.userContext
  }

  getNavigationContext(): NavigationContext | null {
    return this.navigationContext
  }

  getPermissionChecker(): PermissionChecker | null {
    if (!this.userContext) return null
    return new PermissionChecker(this.userContext)
  }

  // Utilitaires
  isAuthenticated(): boolean {
    return this.userContext !== null && this.userContext.is_active
  }

  requiresRole(requiredRoles: UserRole[]): boolean {
    if (!this.userContext) return false
    return requiredRoles.includes(this.userContext.role)
  }

  // Nettoyage
  clearContext(): void {
    this.userContext = null
    this.navigationContext = null
  }
}

// ===========================================
// 🎯 UTILITAIRES D'URL
// ===========================================

export class DashboardUrlBuilder {
  // URLs principales
  static dashboard(): string {
    return '/dashboard'
  }

  static franchises(): string {
    return '/dashboard/franchises'
  }

  static franchise(franchiseId: string): string {
    return `/dashboard/franchises/${franchiseId}`
  }

  static franchiseGyms(franchiseId: string): string {
    return `/dashboard/franchises/${franchiseId}/gyms`
  }

  static gym(franchiseId: string, gymId: string): string {
    return `/dashboard/franchises/${franchiseId}/gyms/${gymId}`
  }

  static gymDirect(gymId: string): string {
    return `/dashboard/gyms/${gymId}`
  }

  // URLs spécialisées
  static liveSessions(franchiseId?: string, gymId?: string): string {
    if (gymId && franchiseId) {
      return `/dashboard/franchises/${franchiseId}/gyms/${gymId}/sessions/live`
    }
    if (franchiseId) {
      return `/dashboard/franchises/${franchiseId}/sessions/live`
    }
    return '/dashboard/sessions/live'
  }

  static settings(level: 'global' | 'franchise' | 'gym' = 'global'): string {
    return `/dashboard/settings?level=${level}`
  }
}

// Export de l'instance singleton
export const userContextManager = UserContextManager.getInstance()
