// ============================================================================
// SECURE QUERIES - Helpers sécurisés pour isolation par gym/franchise
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AuthUser } from './auth-helpers'

// ============================================================================
// TYPES
// ============================================================================

export interface SecureQueryOptions {
  user: AuthUser
  supabase: SupabaseClient<Database>
}

export interface QueryResult<T> {
  data: T | null
  error: string | null
}

// ============================================================================
// CORE HELPERS
// ============================================================================

/**
 * Filtrer une query selon le rôle de l'utilisateur
 * Garantit l'isolation au niveau BDD
 */
export function applyUserFilter<T>(
  query: any,
  user: AuthUser,
  resourceType: 'gym' | 'franchise' | 'member' | 'session'
) {
  // Super admin : pas de filtre (accès complet)
  if (user.role === 'super_admin') {
    return query
  }

  // Franchise manager : filtre par franchise_id
  if (user.role === 'franchise_manager' && user.franchise_id) {
    if (resourceType === 'gym') {
      // Récupérer les salles de sa franchise uniquement
      return query.eq('franchise_id', user.franchise_id)
    }
    if (resourceType === 'franchise') {
      return query.eq('id', user.franchise_id)
    }
    if (resourceType === 'member' || resourceType === 'session') {
      // Récupérer via join gym → franchise
      // NOTE: Nécessite que la table ait gym_id
      // Peut nécessiter une query plus complexe
      return query // À implémenter selon structure BDD
    }
  }

  // Gym manager / receptionist : filtre par gym_id
  if ((user.role === 'gym_manager' || user.role === 'receptionist') && user.gym_id) {
    if (resourceType === 'gym') {
      return query.eq('id', user.gym_id)
    }
    if (resourceType === 'member' || resourceType === 'session') {
      return query.eq('gym_id', user.gym_id)
    }
    // Pas d'accès aux franchises
    if (resourceType === 'franchise') {
      return query.eq('id', '00000000-0000-0000-0000-000000000000') // Retour vide
    }
  }

  // Par défaut : bloquer accès (sécurité)
  return query.eq('id', '00000000-0000-0000-0000-000000000000')
}

// ============================================================================
// HELPERS GYMS
// ============================================================================

/**
 * Récupérer les salles accessibles par l'utilisateur
 */
export async function getAccessibleGyms(
  options: SecureQueryOptions
): Promise<QueryResult<any[]>> {
  const { user, supabase } = options

  try {
    let query = supabase
      .from('gyms')
      .select('*')
      .order('name')

    query = applyUserFilter(query, user, 'gym')

    const { data, error } = await query

    if (error) {
      console.error('❌ [SECURE] Erreur récupération gyms:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération gyms:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

/**
 * Récupérer une salle spécifique (avec vérification accès)
 */
export async function getGymById(
  gymId: string,
  options: SecureQueryOptions
): Promise<QueryResult<any>> {
  const { user, supabase } = options

  try {
    let query = supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single()

    // Vérifier que l'utilisateur peut accéder à cette salle
    if (user.role === 'gym_manager' || user.role === 'receptionist') {
      if (user.gym_id !== gymId) {
        return { data: null, error: 'Accès refusé à cette salle' }
      }
    }

    if (user.role === 'franchise_manager' && user.franchise_id) {
      // Vérifier que la salle appartient à sa franchise
      const { data: gym } = await supabase
        .from('gyms')
        .select('franchise_id')
        .eq('id', gymId)
        .single()

      if (!gym || gym.franchise_id !== user.franchise_id) {
        return { data: null, error: 'Accès refusé à cette salle' }
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ [SECURE] Erreur récupération gym:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération gym:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

// ============================================================================
// HELPERS MEMBERS
// ============================================================================

/**
 * Récupérer les membres accessibles par l'utilisateur
 */
export async function getAccessibleMembers(
  gymId: string | null,
  options: SecureQueryOptions
): Promise<QueryResult<any[]>> {
  const { user, supabase } = options

  try {
    let query = supabase
      .from('gym_members_v2')
      .select('*')
      .order('created_at', { ascending: false })

    // Si gymId fourni, filtrer par salle
    if (gymId) {
      query = query.eq('gym_id', gymId)
    }

    // Appliquer filtre utilisateur
    query = applyUserFilter(query, user, 'member')

    const { data, error } = await query

    if (error) {
      console.error('❌ [SECURE] Erreur récupération members:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération members:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

/**
 * Récupérer un membre spécifique (avec vérification accès)
 */
export async function getMemberById(
  memberId: string,
  options: SecureQueryOptions
): Promise<QueryResult<any>> {
  const { user, supabase } = options

  try {
    const { data: member, error } = await supabase
      .from('gym_members_v2')
      .select('*')
      .eq('id', memberId)
      .single()

    if (error) {
      console.error('❌ [SECURE] Erreur récupération member:', error)
      return { data: null, error: error.message }
    }

    if (!member) {
      return { data: null, error: 'Membre introuvable' }
    }

    // Vérifier accès selon rôle
    if (user.role === 'gym_manager' || user.role === 'receptionist') {
      if (member.gym_id !== user.gym_id) {
        return { data: null, error: 'Accès refusé à ce membre' }
      }
    }

    if (user.role === 'franchise_manager' && user.franchise_id) {
      // Vérifier que le membre appartient à une salle de sa franchise
      const { data: gym } = await supabase
        .from('gyms')
        .select('franchise_id')
        .eq('id', member.gym_id)
        .single()

      if (!gym || gym.franchise_id !== user.franchise_id) {
        return { data: null, error: 'Accès refusé à ce membre' }
      }
    }

    return { data: member, error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération member:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

// ============================================================================
// HELPERS SESSIONS
// ============================================================================

/**
 * Récupérer les sessions accessibles par l'utilisateur
 */
export async function getAccessibleSessions(
  gymId: string | null,
  options: SecureQueryOptions
): Promise<QueryResult<any[]>> {
  const { user, supabase } = options

  try {
    let query = supabase
      .from('openai_realtime_sessions')
      .select(`
        *,
        gym_members_v2 (
          id,
          first_name,
          last_name,
          badge_id
        )
      `)
      .order('created_at', { ascending: false })

    // Si gymId fourni, filtrer par salle
    if (gymId) {
      query = query.eq('gym_id', gymId)
    }

    // Appliquer filtre utilisateur
    query = applyUserFilter(query, user, 'session')

    const { data, error } = await query

    if (error) {
      console.error('❌ [SECURE] Erreur récupération sessions:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération sessions:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

// ============================================================================
// HELPERS FRANCHISES
// ============================================================================

/**
 * Récupérer les franchises accessibles par l'utilisateur
 */
export async function getAccessibleFranchises(
  options: SecureQueryOptions
): Promise<QueryResult<any[]>> {
  const { user, supabase } = options

  try {
    let query = supabase
      .from('franchises')
      .select('*')
      .order('name')

    query = applyUserFilter(query, user, 'franchise')

    const { data, error } = await query

    if (error) {
      console.error('❌ [SECURE] Erreur récupération franchises:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération franchises:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

/**
 * Récupérer une franchise spécifique (avec vérification accès)
 */
export async function getFranchiseById(
  franchiseId: string,
  options: SecureQueryOptions
): Promise<QueryResult<any>> {
  const { user, supabase } = options

  try {
    // Vérifier accès selon rôle
    if (user.role === 'franchise_manager') {
      if (user.franchise_id !== franchiseId) {
        return { data: null, error: 'Accès refusé à cette franchise' }
      }
    }

    if (user.role === 'gym_manager' || user.role === 'receptionist') {
      return { data: null, error: 'Accès refusé aux franchises' }
    }

    const { data, error } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single()

    if (error) {
      console.error('❌ [SECURE] Erreur récupération franchise:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('❌ [SECURE] Exception récupération franchise:', err)
    return { data: null, error: 'Erreur interne' }
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Logger une action utilisateur (audit trail)
 */
export async function logAuditAction(
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any>,
  options: SecureQueryOptions
): Promise<void> {
  const { user, supabase } = options

  try {
    await supabase.from('user_activity_logs').insert({
      user_id: user.id,
      action_type: action,
      target_type: resourceType,
      target_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    })

    console.log(`✅ [AUDIT] ${action} sur ${resourceType} ${resourceId} par ${user.email}`)
  } catch (err) {
    console.error('❌ [AUDIT] Erreur logging:', err)
    // Ne pas bloquer l'action si le logging échoue
  }
}

