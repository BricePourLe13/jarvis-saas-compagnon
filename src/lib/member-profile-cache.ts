/**
 * 🚀 CACHE PROFIL MEMBRE PRODUCTION
 * Cache intelligent pour éviter les requêtes répétées de profils
 */

import { getSupabaseService } from './supabase-service'

export interface CachedMemberProfile {
  id: string
  gym_id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string
  membership_type: string
  fitness_level: string
  fitness_goals: any[]
  current_goals: any[]
  member_preferences: any
  jarvis_personalization_score: number
  engagement_level: string
  communication_style: string
  preferred_feedback_style: string
  // Métadonnées complètes pour personnalisation IA
  full_profile: any
}

interface CacheEntry {
  profile: CachedMemberProfile
  cached_at: number
  ttl: number
}

class MemberProfileCache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  /**
   * Récupérer un profil membre (avec cache)
   */
  async getMemberProfile(badge_id: string, gym_slug: string): Promise<CachedMemberProfile | null> {
    const cacheKey = `${gym_slug}:${badge_id}`
    
    // Vérifier le cache
    const cached = this.cache.get(cacheKey)
    if (cached && (Date.now() - cached.cached_at) < cached.ttl) {
      console.log(`📋 [CACHE] Hit pour ${badge_id}`)
      return cached.profile
    }

    // Cache miss - récupérer depuis la base
    console.log(`🔍 [CACHE] Miss pour ${badge_id} - Requête DB`)
    const profile = await this.fetchMemberFromDB(badge_id, gym_slug)
    
    if (profile) {
      // Mettre en cache
      this.setCache(cacheKey, profile)
      return profile
    }

    return null
  }

  /**
   * Récupérer un profil par member_id (UUID)
   */
  async getMemberProfileById(member_id: string): Promise<CachedMemberProfile | null> {
    // Chercher dans le cache par member_id
    for (const [key, entry] of this.cache.entries()) {
      if (entry.profile.id === member_id && (Date.now() - entry.cached_at) < entry.ttl) {
        console.log(`📋 [CACHE] Hit par ID pour ${member_id}`)
        return entry.profile
      }
    }

    // Cache miss - récupérer depuis la base
    console.log(`🔍 [CACHE] Miss par ID pour ${member_id} - Requête DB`)
    const profile = await this.fetchMemberByIdFromDB(member_id)
    
    if (profile) {
      // Mettre en cache avec la clé badge
      const cacheKey = `${profile.gym_id}:${profile.badge_id}`
      this.setCache(cacheKey, profile)
      return profile
    }

    return null
  }

  /**
   * Invalider le cache pour un membre
   */
  invalidateMember(badge_id: string, gym_slug: string): void {
    const cacheKey = `${gym_slug}:${badge_id}`
    this.cache.delete(cacheKey)
    console.log(`🗑️ [CACHE] Invalidé pour ${badge_id}`)
  }

  /**
   * Récupérer depuis la base de données par badge
   */
  private async fetchMemberFromDB(badge_id: string, gym_slug: string): Promise<CachedMemberProfile | null> {
    try {
      const supabase = getSupabaseService()

      // 1. Récupérer la gym
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('kiosk_config->>kiosk_url_slug', gym_slug)
        .single()

      if (gymError || !gym) {
        console.error(`❌ [CACHE] Gym non trouvée: ${gym_slug}`)
        return null
      }

      // 2. Récupérer le membre complet
      const { data: member, error: memberError } = await supabase
        .from('gym_members')
        .select('*')
        .eq('badge_id', badge_id)
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .single()

      if (memberError || !member) {
        console.error(`❌ [CACHE] Membre non trouvé: ${badge_id}`)
        return null
      }

      return this.transformMemberData(member)

    } catch (error) {
      console.error('❌ [CACHE] Erreur DB:', error)
      return null
    }
  }

  /**
   * Récupérer depuis la base de données par ID
   */
  private async fetchMemberByIdFromDB(member_id: string): Promise<CachedMemberProfile | null> {
    try {
      const supabase = getSupabaseService()

      const { data: member, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('id', member_id)
        .eq('is_active', true)
        .single()

      if (error || !member) {
        console.error(`❌ [CACHE] Membre non trouvé par ID: ${member_id}`)
        return null
      }

      return this.transformMemberData(member)

    } catch (error) {
      console.error('❌ [CACHE] Erreur DB par ID:', error)
      return null
    }
  }

  /**
   * Transformer les données membre pour le cache
   */
  private transformMemberData(member: any): CachedMemberProfile {
    return {
      id: member.id,
      gym_id: member.gym_id,
      badge_id: member.badge_id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      membership_type: member.membership_type,
      fitness_level: member.fitness_level,
      fitness_goals: member.fitness_goals || [],
      current_goals: member.current_goals || [],
      member_preferences: member.member_preferences || {},
      jarvis_personalization_score: member.jarvis_personalization_score || 0,
      engagement_level: member.engagement_level,
      communication_style: member.communication_style,
      preferred_feedback_style: member.preferred_feedback_style,
      full_profile: member // Garder tout pour personnalisation IA
    }
  }

  /**
   * Mettre en cache
   */
  private setCache(key: string, profile: CachedMemberProfile): void {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      profile,
      cached_at: Date.now(),
      ttl: this.DEFAULT_TTL
    })

    console.log(`💾 [CACHE] Mis en cache: ${profile.first_name} ${profile.last_name}`)
  }

  /**
   * Statistiques du cache
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: implémenter tracking hit rate
    }
  }

  /**
   * Vider le cache
   */
  clear(): void {
    this.cache.clear()
    console.log('🗑️ [CACHE] Cache vidé')
  }
}

// Instance singleton
export const memberProfileCache = new MemberProfileCache()
