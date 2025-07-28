/**
 * 💰 Service simplifié pour récupérer les VRAIS coûts OpenAI
 * Affichage direct des coûts réels sans estimation
 */

interface OpenAIRealCosts {
  totalCostUSD: number
  totalSessions: number
  totalDurationMinutes: number
  averageSessionCost: number
  date: string
}

export class RealOpenAICostsService {
  
  /**
   * Récupérer les vrais coûts depuis l'API OpenAI Usage
   */
  static async fetchRealCosts(
    date: string, 
    filters?: { gymId?: string; franchiseId?: string }
  ): Promise<OpenAIRealCosts | null> {
         try {
       // ✅ RÉDUCTION DES LOGS pour éviter le spam
       // console.log('💰 [REAL COSTS] Récupération coûts réels pour:', date, filters)

              // 1. Récupérer l'usage réel depuis OpenAI
        const response = await fetch(`/api/openai/usage?start_date=${date}`)
       
       if (!response.ok) {
         console.error('💰 [REAL COSTS] Erreur API OpenAI:', response.status)
         return null
       }

       const data = await response.json()
       const openaiUsage = data.success ? data.usage : null
       
       if (!openaiUsage) {
         console.error('💰 [REAL COSTS] Pas de données OpenAI Usage')
         return null
       }

      // 2. Récupérer les sessions depuis Supabase pour compter
      const { createClient } = await import('./supabase-simple')
      const supabase = createClient()
      
      let query = supabase
        .from('jarvis_session_costs')
        .select('session_id, duration_seconds')
        .gte('timestamp', `${date}T00:00:00.000Z`)
        .lt('timestamp', `${date}T23:59:59.999Z`)

      if (filters?.gymId) {
        query = query.eq('gym_id', filters.gymId)
      }
      
      if (filters?.franchiseId) {
        query = query.eq('franchise_id', filters.franchiseId)
      }

      const { data: sessions, error } = await query

      if (error) {
        console.error('💰 [REAL COSTS] Erreur récupération sessions:', error)
        return null
      }

      // 3. Calculer les métriques
      const totalSessions = sessions?.length || 0
      const totalDurationMinutes = sessions?.reduce((sum, s) => sum + s.duration_seconds, 0) / 60 || 0
      const totalCostUSD = openaiUsage.total_usage || 0
      const averageSessionCost = totalSessions > 0 ? totalCostUSD / totalSessions : 0

             // ✅ LOG RÉDUIT: Seulement si coût > 0
       if (totalCostUSD > 0) {
         console.log('💰 [REAL COSTS] Coûts calculés:', {
           totalCostUSD: totalCostUSD.toFixed(4),
           totalSessions,
           avgSessionCost: averageSessionCost.toFixed(4)
         })
       }

      return {
        totalCostUSD,
        totalSessions,
        totalDurationMinutes: Math.round(totalDurationMinutes),
        averageSessionCost,
        date
      }

    } catch (error) {
      console.error('💰 [REAL COSTS] Erreur récupération coûts réels:', error)
      return null
    }
  }

  /**
   * Récupérer les métriques en temps réel avec vrais coûts
   */
     static async getRealTimeMetrics(filters?: { gymId?: string; franchiseId?: string }) {
     const today = new Date().toISOString().split('T')[0]
     const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
     
     // ✅ LOG RÉDUIT
     // console.log('💰 [REAL COSTS] Récupération métriques temps réel pour:', today)

    const [todayCosts, yesterdayCosts] = await Promise.all([
      this.fetchRealCosts(today, filters),
      this.fetchRealCosts(yesterday, filters)
    ])

    if (!todayCosts || !yesterdayCosts) {
      console.warn('💰 [REAL COSTS] Impossible de récupérer les coûts pour les métriques')
      return null
    }

    // Calcul des variations
    const sessionChange = yesterdayCosts.totalSessions > 0 
      ? ((todayCosts.totalSessions - yesterdayCosts.totalSessions) / yesterdayCosts.totalSessions) * 100
      : 0

    const costChange = yesterdayCosts.totalCostUSD > 0
      ? ((todayCosts.totalCostUSD - yesterdayCosts.totalCostUSD) / yesterdayCosts.totalCostUSD) * 100
      : 0

    const durationChange = yesterdayCosts.totalDurationMinutes > 0
      ? ((todayCosts.totalDurationMinutes - yesterdayCosts.totalDurationMinutes) / yesterdayCosts.totalDurationMinutes) * 100
      : 0

    return {
      today: {
        totalSessions: todayCosts.totalSessions,
        totalDurationMinutes: todayCosts.totalDurationMinutes,
        totalCostUSD: todayCosts.totalCostUSD,
        averageSessionCost: todayCosts.averageSessionCost
      },
      yesterday: {
        totalSessions: yesterdayCosts.totalSessions,
        totalDurationMinutes: yesterdayCosts.totalDurationMinutes,
        totalCostUSD: yesterdayCosts.totalCostUSD,
        averageSessionCost: yesterdayCosts.averageSessionCost
      },
      changes: {
        sessions: Math.round(sessionChange),
        cost: Math.round(costChange),
        duration: Math.round(durationChange)
      }
    }
  }

  /**
   * Récupérer les métriques pour un gym spécifique avec vrais coûts
   */
     static async getRealTimeMetricsByGym(gymId: string) {
     // ✅ LOG SUPPRIMÉ pour éviter le spam
     // console.log('💰 [REAL COSTS] Récupération métriques gym:', gymId)
     return await this.getRealTimeMetrics({ gymId })
   }

  /**
   * Récupérer les métriques pour une franchise spécifique avec vrais coûts  
   */
  static async getRealTimeMetricsByFranchise(franchiseId: string) {
    console.log('💰 [REAL COSTS] Récupération métriques franchise:', franchiseId)
    return await this.getRealTimeMetrics({ franchiseId })
  }
} 