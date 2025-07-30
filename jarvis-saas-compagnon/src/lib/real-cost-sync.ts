/**
 * 💰 Service de synchronisation des coûts réels avec l'API OpenAI
 * Remplace les estimations par les vrais coûts de facturation
 */

import { createSimpleClient } from './supabase-admin'

interface OpenAIUsageDay {
  timestamp: number
  n_requests: number
  operation: string
  snapshot_id: string
  n_context_tokens_total: number
  n_generated_tokens_total: number
  costs_usd: number
}

interface OpenAIUsageResponse {
  object: string
  start_date: string
  end_date: string
  total_usage: number
  daily_costs: OpenAIUsageDay[]
}

interface SessionCostData {
  session_id: string
  gym_id: string
  timestamp: Date
  estimated_cost: number
  real_cost?: number
  is_cost_real: boolean
}

export class RealCostSyncService {
  
  /**
   * Récupérer l'usage réel depuis l'API OpenAI
   */
     static async fetchOpenAIUsage(startDate: string, endDate: string): Promise<OpenAIUsageResponse | null> {
     try {
       const response = await fetch(`/api/openai/usage?start_date=${startDate}`)
      
      if (!response.ok) {
        console.error('💰 [SYNC] Erreur récupération usage:', response.status)
        return null
      }

      const data = await response.json()
      return data.success ? data.usage : null
      
    } catch (error) {
      console.error('💰 [SYNC] Exception récupération usage:', error)
      return null
    }
  }

  /**
   * Récupérer les sessions avec coûts estimés depuis Supabase
   */
  static async getSessionsWithEstimatedCosts(startDate: string, endDate: string): Promise<SessionCostData[]> {
    try {
      const supabase = createSimpleClient()
      
      const { data: sessions, error } = await supabase
        .from('jarvis_session_costs')
        .select('session_id, gym_id, timestamp, total_cost, is_cost_real')
        .gte('timestamp', startDate + 'T00:00:00.000Z')
        .lte('timestamp', endDate + 'T23:59:59.999Z')
        .eq('is_cost_real', false) // Seulement les estimations
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('💰 [SYNC] Erreur récupération sessions:', error)
        return []
      }

      return sessions?.map(session => ({
        session_id: session.session_id,
        gym_id: session.gym_id,
        timestamp: new Date(session.timestamp),
        estimated_cost: session.total_cost,
        is_cost_real: session.is_cost_real
      })) || []

    } catch (error) {
      console.error('💰 [SYNC] Exception récupération sessions:', error)
      return []
    }
  }

  /**
   * Calculer la répartition des coûts réels par session
   */
  static calculateCostDistribution(
    openaiUsage: OpenAIUsageResponse, 
    sessions: SessionCostData[]
  ): Map<string, number> {
    const distribution = new Map<string, number>()
    
    if (!sessions.length || !openaiUsage.total_usage) {
      return distribution
    }

    // Calculer le coût total estimé de toutes les sessions
    const totalEstimatedCost = sessions.reduce((sum, session) => sum + session.estimated_cost, 0)
    
    // Répartir le coût réel proportionnellement aux estimations
    const realCostRatio = openaiUsage.total_usage / totalEstimatedCost
    
    console.log('💰 [SYNC] Répartition des coûts:', {
      totalReal: openaiUsage.total_usage,
      totalEstimated: totalEstimatedCost,
      ratio: realCostRatio,
      sessionsCount: sessions.length
    })

    sessions.forEach(session => {
      const realCost = session.estimated_cost * realCostRatio
      distribution.set(session.session_id, realCost)
    })

    return distribution
  }

  /**
   * Mettre à jour les coûts dans Supabase
   */
  static async updateRealCosts(costDistribution: Map<string, number>): Promise<boolean> {
    try {
      const supabase = createSimpleClient()
      const updates = []

      for (const [sessionId, realCost] of costDistribution) {
        updates.push({
          session_id: sessionId,
          total_cost: realCost,
          is_cost_real: true,
          real_cost_updated_at: new Date().toISOString()
        })
      }

      if (!updates.length) {
        console.log('💰 [SYNC] Aucune mise à jour nécessaire')
        return true
      }

      // Mise à jour en batch
      const { error } = await supabase
        .from('jarvis_session_costs')
        .upsert(updates, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('💰 [SYNC] Erreur mise à jour coûts:', error)
        return false
      }

      console.log(`💰 [SYNC] ✅ ${updates.length} coûts réels mis à jour`)
      return true

    } catch (error) {
      console.error('💰 [SYNC] Exception mise à jour:', error)
      return false
    }
  }

  /**
   * Synchronisation complète des coûts réels
   */
  static async syncRealCosts(daysBack: number = 1): Promise<{
    success: boolean
    sessionsUpdated: number
    totalRealCost: number
    message: string
  }> {
    try {
      console.log(`💰 [SYNC] ===== DÉBUT SYNCHRONISATION COÛTS RÉELS =====`)
      
      // Calculer les dates
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log(`💰 [SYNC] Période: ${startDateStr} → ${endDateStr}`)

      // 1. Récupérer l'usage réel depuis OpenAI
      const openaiUsage = await this.fetchOpenAIUsage(startDateStr, endDateStr)
      if (!openaiUsage) {
        return {
          success: false,
          sessionsUpdated: 0,
          totalRealCost: 0,
          message: 'Impossible de récupérer l\'usage OpenAI'
        }
      }

      // 2. Récupérer les sessions avec coûts estimés
      const sessions = await this.getSessionsWithEstimatedCosts(startDateStr, endDateStr)
      if (!sessions.length) {
        return {
          success: true,
          sessionsUpdated: 0,
          totalRealCost: openaiUsage.total_usage,
          message: 'Aucune session avec coûts estimés trouvée'
        }
      }

      // 3. Calculer la répartition des coûts
      const costDistribution = this.calculateCostDistribution(openaiUsage, sessions)

      // 4. Mettre à jour les coûts dans Supabase
      const updateSuccess = await this.updateRealCosts(costDistribution)
      
      const result = {
        success: updateSuccess,
        sessionsUpdated: costDistribution.size,
        totalRealCost: openaiUsage.total_usage,
        message: updateSuccess 
          ? `${costDistribution.size} sessions synchronisées avec succès`
          : 'Erreur lors de la mise à jour des coûts'
      }

      console.log(`💰 [SYNC] ===== FIN SYNCHRONISATION =====`, result)
      return result

    } catch (error) {
      console.error('💰 [SYNC] ❌ ERREUR CRITIQUE:', error)
      return {
        success: false,
        sessionsUpdated: 0,
        totalRealCost: 0,
        message: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`
      }
    }
  }

  /**
   * Vérifier si une synchronisation est nécessaire
   */
  static async needsSync(): Promise<boolean> {
    try {
      const supabase = createSimpleClient()
      
      // Vérifier s'il y a des sessions avec coûts estimés des dernières 24h
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count } = await supabase
        .from('jarvis_session_costs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', yesterday.toISOString())
        .eq('is_cost_real', false)

      return (count || 0) > 0

    } catch (error) {
      console.error('💰 [SYNC] Erreur vérification sync:', error)
      return false
    }
  }
} 