// ============================================================================
// AUTH HELPERS - Système d'authentification sécurisé
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentConfig } from './supabase-admin'
import type { Database } from '@/types/database'

// Types
export type UserRole = 'super_admin' | 'franchise_manager' | 'gym_manager' | 'receptionist'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  gym_id?: string
  franchise_id?: string
  full_name?: string
  is_active: boolean
}

export interface AuthResult {
  authenticated: boolean
  user: AuthUser | null
  error?: string
}

// ============================================================================
// MIDDLEWARE AUTH
// ============================================================================

/**
 * Vérifier l'authentification dans le middleware
 * Retourne { supabase, response } pour continuer la chaîne
 */
export async function verifyAuthMiddleware(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentConfig()
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Vérifier l'utilisateur
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  return { supabase, response, authUser, error }
}

/**
 * Récupérer les informations complètes de l'utilisateur
 */
export async function getUserProfile(
  supabase: any,
  userId: string
): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, gym_id, franchise_id, full_name, is_active')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('❌ [AUTH] Erreur récupération profil:', error)
      return null
    }

    return data as AuthUser
  } catch (err) {
    console.error('❌ [AUTH] Exception récupération profil:', err)
    return null
  }
}

/**
 * Vérifier si l'utilisateur a accès à une ressource
 */
export function canAccessResource(
  user: AuthUser,
  resourceType: 'gym' | 'franchise' | 'global',
  resourceId?: string
): boolean {
  // Super admin : accès complet
  if (user.role === 'super_admin') return true

  // Franchise manager : accès à sa franchise
  if (user.role === 'franchise_manager') {
    if (resourceType === 'global') return false
    if (resourceType === 'franchise') {
      return !resourceId || user.franchise_id === resourceId
    }
    if (resourceType === 'gym' && resourceId) {
      // Vérifier que la salle appartient à sa franchise (à implémenter avec query)
      return true // TODO: vérifier via query
    }
    return false
  }

  // Gym manager : accès uniquement à sa salle
  if (user.role === 'gym_manager' || user.role === 'receptionist') {
    if (resourceType === 'global' || resourceType === 'franchise') return false
    if (resourceType === 'gym') {
      return !resourceId || user.gym_id === resourceId
    }
    return false
  }

  return false
}

/**
 * Redirection selon le rôle de l'utilisateur
 * ✅ NOUVELLE ARCHITECTURE CONTEXT-AWARE : Tous vers /dashboard
 * Le ContextSwitcher gère automatiquement le filtrage selon le rôle
 */
export function getDefaultRedirectForRole(user: AuthUser): string {
  // Tout le monde vers /dashboard (sera redirigé vers /dashboard/overview)
  // Le GymContext Provider détecte automatiquement le rôle et filtre les données
  return '/dashboard'
}

// ============================================================================
// VALIDATION ROUTES
// ============================================================================

/**
 * Extraire les IDs des routes dynamiques
 */
export function extractRouteParams(pathname: string): {
  franchiseId?: string
  gymId?: string
} {
  const franchiseMatch = pathname.match(/\/franchises\/([^\/]+)/)
  const gymMatch = pathname.match(/\/gyms\/([^\/]+)/)

  return {
    franchiseId: franchiseMatch?.[1],
    gymId: gymMatch?.[1],
  }
}

/**
 * Vérifier si l'utilisateur peut accéder à cette route
 */
export function canAccessRoute(
  user: AuthUser,
  pathname: string
): { allowed: boolean; redirectTo?: string } {
  const { franchiseId, gymId } = extractRouteParams(pathname)

  // Routes globales (monitoring, admin)
  if (pathname.startsWith('/dashboard/monitoring') || 
      pathname.startsWith('/dashboard/repair')) {
    if (user.role !== 'super_admin') {
      return { 
        allowed: false, 
        redirectTo: getDefaultRedirectForRole(user) 
      }
    }
    return { allowed: true }
  }

  // Routes franchise
  if (franchiseId) {
    if (!canAccessResource(user, 'franchise', franchiseId)) {
      return { 
        allowed: false, 
        redirectTo: getDefaultRedirectForRole(user) 
      }
    }
    return { allowed: true }
  }

  // Routes gym
  if (gymId) {
    if (!canAccessResource(user, 'gym', gymId)) {
      return { 
        allowed: false, 
        redirectTo: getDefaultRedirectForRole(user) 
      }
    }
    return { allowed: true }
  }

  // Routes générales dashboard
  return { allowed: true }
}

// ============================================================================
// HELPERS API ROUTES
// ============================================================================

/**
 * Vérifier l'auth dans une API route
 */
export async function verifyAuthAPI(
  request: NextRequest
): Promise<AuthResult> {
  const { supabase, authUser, error } = await verifyAuthMiddleware(request)

  if (error || !authUser) {
    return {
      authenticated: false,
      user: null,
      error: 'Non authentifié',
    }
  }

  const userProfile = await getUserProfile(supabase, authUser.id)

  if (!userProfile || !userProfile.is_active) {
    return {
      authenticated: false,
      user: null,
      error: 'Compte inactif',
    }
  }

  return {
    authenticated: true,
    user: userProfile,
  }
}

/**
 * Helper pour retourner une erreur 401
 */
export function unauthorizedResponse(message = 'Non autorisé') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * Helper pour retourner une erreur 403
 */
export function forbiddenResponse(message = 'Accès refusé') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

