import { createSimpleClient } from './supabase-admin'

export interface KioskStatus {
  gymId: string
  kioskSlug?: string
  isOnline: boolean
  lastSeen?: Date
  status: 'online' | 'offline'
}

/**
 * 💓 Service de gestion du statut des kiosks en temps réel
 */
export class KioskStatusService {
  
  /**
   * Vérifier si un kiosk est en ligne
   */
  static async isKioskOnline(gymId: string): Promise<boolean> {
    try {
      const supabase = createSimpleClient()
      
      // ⚡ Vérifier les heartbeats des 45 dernières secondes (détection ultra-rapide)
      const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000).toISOString()
      
              const { data: heartbeat, error } = await supabase
          .from('kiosk_heartbeats')
          .select('*')
          .eq('gym_id', gymId)
          .gte('last_heartbeat', fortyFiveSecondsAgo)
          .eq('status', 'online')
          .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('🔍 [KIOSK STATUS] Erreur vérification:', error)
        return false
      }

      return !!heartbeat
    } catch (error) {
      console.warn('🔍 [KIOSK STATUS] Erreur isKioskOnline:', error)
      return false
    }
  }

  /**
   * Obtenir le statut détaillé d'un kiosk
   */
  static async getKioskStatus(gymId: string): Promise<KioskStatus> {
    try {
      const supabase = createSimpleClient()
      
      const { data: heartbeat, error } = await supabase
        .from('kiosk_heartbeats')
        .select('*')
        .eq('gym_id', gymId)
        .order('last_heartbeat', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('🔍 [KIOSK STATUS] Erreur getKioskStatus:', error)
        return {
          gymId,
          isOnline: false,
          status: 'offline'
        }
      }

      if (!heartbeat) {
        return {
          gymId,
          isOnline: false,
          status: 'offline'
        }
      }

      // ⚡ Vérifier si le heartbeat est récent (moins de 45 secondes)
      const lastSeen = new Date(heartbeat.last_heartbeat)
      const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000)
      const isOnline = lastSeen > fortyFiveSecondsAgo && heartbeat.status === 'online'

      return {
        gymId,
        kioskSlug: heartbeat.kiosk_slug,
        isOnline,
        lastSeen,
        status: isOnline ? 'online' : 'offline'
      }
    } catch (error) {
      console.warn('🔍 [KIOSK STATUS] Erreur getKioskStatus:', error)
      return {
        gymId,
        isOnline: false,
        status: 'offline'
      }
    }
  }

  /**
   * Obtenir le statut de tous les kiosks actifs
   */
  static async getAllKioskStatuses(): Promise<KioskStatus[]> {
    try {
      const supabase = createSimpleClient()
      
      const { data: heartbeats, error } = await supabase
        .from('kiosk_heartbeats')
        .select('*')
        .order('last_heartbeat', { ascending: false })

      if (error) {
        console.warn('🔍 [KIOSK STATUS] Erreur getAllKioskStatuses:', error)
        return []
      }

      const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000)

      return (heartbeats || []).map(heartbeat => {
        const lastSeen = new Date(heartbeat.last_heartbeat)
        const isOnline = lastSeen > fortyFiveSecondsAgo && heartbeat.status === 'online'

        return {
          gymId: heartbeat.gym_id,
          kioskSlug: heartbeat.kiosk_slug,
          isOnline,
          lastSeen,
          status: isOnline ? 'online' : 'offline'
        }
      })
    } catch (error) {
      console.warn('🔍 [KIOSK STATUS] Erreur getAllKioskStatuses:', error)
      return []
    }
  }

  /**
   * Nettoyer les anciens heartbeats
   */
  static async cleanupOldHeartbeats(): Promise<void> {
    try {
      const supabase = createSimpleClient()
      
      await supabase.rpc('cleanup_old_heartbeats')
      console.log('🧹 [KIOSK STATUS] Nettoyage des anciens heartbeats effectué')
    } catch (error) {
      console.warn('🧹 [KIOSK STATUS] Erreur nettoyage:', error)
    }
  }

  /**
   * Obtenir les statistiques temps réel des kiosks
   */
  static async getKioskStats(): Promise<{
    totalKiosks: number
    onlineKiosks: number
    offlineKiosks: number
    recentActivity: number
  }> {
    try {
      const statuses = await this.getAllKioskStatuses()
      const onlineKiosks = statuses.filter(s => s.isOnline).length
      const offlineKiosks = statuses.length - onlineKiosks
      
      // Activité récente = kiosks vus dans les 10 dernières minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const recentActivity = statuses.filter(s => 
        s.lastSeen && s.lastSeen > tenMinutesAgo
      ).length

      return {
        totalKiosks: statuses.length,
        onlineKiosks,
        offlineKiosks,
        recentActivity
      }
    } catch (error) {
      console.warn('📊 [KIOSK STATUS] Erreur getKioskStats:', error)
      return {
        totalKiosks: 0,
        onlineKiosks: 0,
        offlineKiosks: 0,
        recentActivity: 0
      }
    }
  }
} 