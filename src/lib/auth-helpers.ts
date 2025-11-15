// ============================================================================
// AUTH HELPERS - Système d'authentification sécurisé
// VERSION MVP - 2 ROLES (super_admin + gym_manager)
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentConfig } from './supabase-admin'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/core'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  gym_id?: string
  gym_access?: string[] // Array of gym IDs for gym_manager
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
      .select('id, email, role, gym_id, gym_access, full_name, is_active')
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

// ============================================================================
// ACCESS CONTROL (2 ROLES)
// ============================================================================

/**
 * Vérifier si l'utilisateur a accès à une ressource (GYM uniquement)
 * 
 * - super_admin : accès à TOUT
 * - gym_manager : accès uniquement aux salles de gym_access[]
 */
export function canAccessResource(
  user: AuthUser,
  resourceType: 'gym' | 'global',
  resourceId?: string
): boolean {
  // Super admin : accès complet
  if (user.role === 'super_admin') return true

  // Gym manager : accès uniquement à ses salles
  if (user.role === 'gym_manager') {
    if (resourceType === 'global') return false
    
    if (resourceType === 'gym' && resourceId) {
      // Vérifier que la salle est dans gym_access
      const gymAccess = user.gym_access || (user.gym_id ? [user.gym_id] : [])
      return gymAccess.includes(resourceId)
    }
    
    // Si pas de resourceId spécifié, autoriser (la query sera filtrée par RLS)
    return true
  }

  return false
}

/**
 * Redirection selon le rôle de l'utilisateur
 * 
 * Tous vers /dashboard (le GymContext filtre automatiquement les données)
 */
export function getDefaultRedirectForRole(user: AuthUser): string {
  // Tout le monde vers /dashboard
  // Le GymContext Provider détecte automatiquement le rôle et filtre les données
  return '/dashboard'
}

// ============================================================================
// VALIDATION ROUTES
// ============================================================================

/**
 * Extraire les IDs des routes dynamiques (GYM uniquement)
 */
export function extractRouteParams(pathname: string): {
  gymId?: string
} {
  const gymMatch = pathname.match(/\/gyms\/([^\/]+)/)

  return {
    gymId: gymMatch?.[1],
  }
}

/**
 * Vérifier si l'utilisateur peut accéder à cette route
 * 
 * - super_admin : accès à /admin et /dashboard
 * - gym_manager : accès uniquement à /dashboard
 */
export function canAccessRoute(
  user: AuthUser,
  pathname: string
): { allowed: boolean; redirectTo?: string } {
  const { gymId } = extractRouteParams(pathname)

  // Routes /admin : UNIQUEMENT super_admin
  if (pathname.startsWith('/admin')) {
    if (user.role !== 'super_admin') {
      return { 
        allowed: false, 
        redirectTo: '/dashboard' 
      }
    }
    return { allowed: true }
  }

  // Routes globales (monitoring) : UNIQUEMENT super_admin
  if (pathname.startsWith('/dashboard/monitoring') || 
      pathname.startsWith('/dashboard/repair')) {
    if (user.role !== 'super_admin') {
      return { 
        allowed: false, 
        redirectTo: '/dashboard' 
      }
    }
    return { allowed: true }
  }

  // Routes gym spécifiques (/dashboard/gyms/:id, /admin/gyms/:id)
  if (gymId) {
    if (!canAccessResource(user, 'gym', gymId)) {
      return { 
        allowed: false, 
        redirectTo: '/dashboard' 
      }
    }
    return { allowed: true }
  }

  // Routes générales dashboard : autorisées pour tous
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

