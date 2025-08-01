/**
 * 🔍 Service Monitoring Données EXISTANTES
 * Exploite uniquement ce qui est déjà disponible dans la base
 */

import { createBrowserClientWithConfig } from './supabase-admin'

// ====================================
// 🏷️ Types basés sur données RÉELLES
// ====================================

export interface ExistingSessionMetrics {
  id: string
  gym_id: string
  timestamp: string
  session_duration: number | null
  user_message_count: number | null
  api_cost: number | null
  conversation_context: {
    model?: string
    total_tokens?: number
    [key: string]: any
  } | null
  gym_name?: string
  kiosk_slug?: string
}

export interface ExistingErrorLog {
  id: string
  gym_id: string
  error_type: string
  details: string | null
  timestamp: string
  kiosk_slug?: string
}

export interface ExistingHeartbeat {
  id: string
  gym_id: string
  kiosk_slug: string
  status: string
  last_heartbeat: string
  metadata: Record<string, any> | null
  gym_name?: string
}

export interface KioskCurrentStatus {
  gym_id: string
  gym_name: string
  kiosk_slug: string | null
  // Sessions dernières 24h
  sessions_24h: number
  sessions_today: number
  // Coûts si disponibles
  cost_today_usd: number | null
  cost_7d_usd: number | null
  // Performance
  avg_duration_seconds: number | null
  avg_messages_per_session: number | null
  // Dernière activité
  last_session: string | null
  last_heartbeat: string | null
  minutes_since_heartbeat: number | null
  // Erreurs récentes
  errors_24h: number
  // Modèles utilisés
  ai_models_used: string[]
}

export interface DailyTrend {
  date: string
  sessions_count: number
  active_kiosks: number
  avg_duration_seconds: number | null
  total_cost_usd: number | null
  avg_messages_per_session: number | null
  unique_models_used: number
}

export interface ModelPerformance {
  ai_model: string
  sessions_count: number
  kiosks_using: number
  avg_duration_seconds: number | null
  avg_cost_usd: number | null
  avg_tokens: number | null
  first_used: string
  last_used: string
}

// ====================================
// 🚀 Service Données Existantes
// ====================================

export class ExistingDataMonitoringService {
  private supabase = createBrowserClientWithConfig()

  /**
   * 📊 Status actuel de tous les kiosks
   * Basé sur jarvis_sessions + kiosk_heartbeats
   */
  async getKiosksCurrentStatus(): Promise<KioskCurrentStatus[]> {
    try {
      // Requête principale pour récupérer les statistiques par gym
      const { data, error } = await this.supabase.rpc('get_kiosks_current_status_existing')
      
      if (error) {
        console.error('❌ [EXISTING MONITORING] Erreur status kiosks:', error)
        
        // Fallback: requête manuelle
        return await this.getKiosksStatusFallback()
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur status kiosks:', error)
      return await this.getKiosksStatusFallback()
    }
  }

  /**
   * 📊 Fallback: Status kiosks avec requête manuelle
   */
  private async getKiosksStatusFallback(): Promise<KioskCurrentStatus[]> {
    try {
      // Récupérer tous les gyms avec kiosk
      const { data: gyms, error: gymsError } = await this.supabase
        .from('gyms')
        .select('id, name, kiosk_config')
        .not('kiosk_config->kiosk_url_slug', 'is', null)
      
      if (gymsError) throw gymsError
      
      const results: KioskCurrentStatus[] = []
      
      for (const gym of gyms || []) {
        const kiosk_slug = gym.kiosk_config?.kiosk_url_slug
        
        // Sessions dernières 24h
        const { data: sessions24h } = await this.supabase
          .from('jarvis_sessions')
          .select('*')
          .eq('gym_id', gym.id)
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        
        // Sessions aujourd'hui
        const { data: sessionsToday } = await this.supabase
          .from('jarvis_sessions')
          .select('*')
          .eq('gym_id', gym.id)
          .gte('timestamp', new Date().toISOString().split('T')[0])
        
        // Dernière session
        const { data: lastSession } = await this.supabase
          .from('jarvis_sessions')
          .select('timestamp')
          .eq('gym_id', gym.id)
          .order('timestamp', { ascending: false })
          .limit(1)
        
        // Heartbeat si disponible
        const { data: heartbeat } = await this.supabase
          .from('kiosk_heartbeats')
          .select('last_heartbeat')
          .eq('gym_id', gym.id)
          .order('last_heartbeat', { ascending: false })
          .limit(1)
        
        // Erreurs dernières 24h
        const { data: errors } = await this.supabase
          .from('jarvis_errors_log')
          .select('id')
          .eq('gym_id', gym.id)
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        
        // Calculs
        const sessions24hArray = sessions24h || []
        const sessionsTodayArray = sessionsToday || []
        
        const costToday = sessionsTodayArray
          .filter(s => s.api_cost)
          .reduce((sum, s) => sum + (s.api_cost || 0), 0)
        
        const cost7d = sessions24hArray
          .filter(s => s.api_cost)
          .reduce((sum, s) => sum + (s.api_cost || 0), 0)
        
        const avgDuration = sessions24hArray.length > 0
          ? sessions24hArray.reduce((sum, s) => sum + (s.session_duration || 0), 0) / sessions24hArray.length
          : null
        
        const avgMessages = sessions24hArray.length > 0
          ? sessions24hArray.reduce((sum, s) => sum + (s.user_message_count || 0), 0) / sessions24hArray.length
          : null
        
        const aiModels = [...new Set(
          sessions24hArray
            .map(s => s.conversation_context?.model)
            .filter(Boolean)
        )]
        
        const lastHeartbeat = heartbeat?.[0]?.last_heartbeat
        const minutesSinceHeartbeat = lastHeartbeat
          ? Math.round((Date.now() - new Date(lastHeartbeat).getTime()) / (1000 * 60))
          : null
        
        results.push({
          gym_id: gym.id,
          gym_name: gym.name,
          kiosk_slug,
          sessions_24h: sessions24hArray.length,
          sessions_today: sessionsTodayArray.length,
          cost_today_usd: costToday > 0 ? costToday : null,
          cost_7d_usd: cost7d > 0 ? cost7d : null,
          avg_duration_seconds: avgDuration,
          avg_messages_per_session: avgMessages,
          last_session: lastSession?.[0]?.timestamp || null,
          last_heartbeat: lastHeartbeat || null,
          minutes_since_heartbeat: minutesSinceHeartbeat,
          errors_24h: errors?.length || 0,
          ai_models_used: aiModels
        })
      }
      
      return results.sort((a, b) => b.sessions_24h - a.sessions_24h)
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur fallback:', error)
      return []
    }
  }

  /**
   * 💰 Coûts par gym (données existantes)
   */
  async getCostsByGym(days = 7): Promise<Array<{
    gym_name: string
    kiosk_slug: string | null
    sessions_count: number
    total_cost_usd: number | null
    avg_cost_per_session: number | null
    total_messages: number
    models_used: string[]
  }>> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: sessions, error } = await this.supabase
        .from('jarvis_sessions')
        .select(`
          gym_id,
          api_cost,
          user_message_count,
          conversation_context,
          gyms!inner(name, kiosk_config)
        `)
        .gte('timestamp', sinceDate)
      
      if (error) throw error
      
      // Grouper par gym
      const grouped = sessions?.reduce((acc, session) => {
        const gymId = session.gym_id
        if (!acc[gymId]) {
          acc[gymId] = {
            gym_name: session.gyms.name,
            kiosk_slug: session.gyms.kiosk_config?.kiosk_url_slug || null,
            sessions: []
          }
        }
        acc[gymId].sessions.push(session)
        return acc
      }, {} as Record<string, any>) || {}
      
      return Object.values(grouped).map((group: any) => {
        const sessions = group.sessions
        const costs = sessions.filter((s: any) => s.api_cost).map((s: any) => s.api_cost)
        const totalCost = costs.length > 0 ? costs.reduce((sum: number, cost: number) => sum + cost, 0) : null
        const totalMessages = sessions.reduce((sum: number, s: any) => sum + (s.user_message_count || 0), 0)
        const models = [...new Set(sessions.map((s: any) => s.conversation_context?.model).filter(Boolean))]
        
        return {
          gym_name: group.gym_name,
          kiosk_slug: group.kiosk_slug,
          sessions_count: sessions.length,
          total_cost_usd: totalCost,
          avg_cost_per_session: totalCost && sessions.length > 0 ? totalCost / sessions.length : null,
          total_messages,
          models_used: models
        }
      }).sort((a, b) => b.sessions_count - a.sessions_count)
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur coûts:', error)
      return []
    }
  }

  /**
   * 🤖 Performance par modèle IA
   */
  async getModelPerformance(days = 7): Promise<ModelPerformance[]> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: sessions, error } = await this.supabase
        .from('jarvis_sessions')
        .select('gym_id, timestamp, session_duration, api_cost, conversation_context')
        .gte('timestamp', sinceDate)
        .not('conversation_context->model', 'is', null)
      
      if (error) throw error
      
      // Grouper par modèle
      const grouped = sessions?.reduce((acc, session) => {
        const model = session.conversation_context?.model
        if (!model) return acc
        
        if (!acc[model]) {
          acc[model] = []
        }
        acc[model].push(session)
        return acc
      }, {} as Record<string, any[]>) || {}
      
      return Object.entries(grouped).map(([model, sessions]) => {
        const durations = sessions.filter(s => s.session_duration).map(s => s.session_duration)
        const costs = sessions.filter(s => s.api_cost).map(s => s.api_cost)
        const tokens = sessions
          .filter(s => s.conversation_context?.total_tokens)
          .map(s => s.conversation_context.total_tokens)
        const timestamps = sessions.map(s => s.timestamp).sort()
        
        return {
          ai_model: model,
          sessions_count: sessions.length,
          kiosks_using: new Set(sessions.map(s => s.gym_id)).size,
          avg_duration_seconds: durations.length > 0 
            ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
            : null,
          avg_cost_usd: costs.length > 0 
            ? costs.reduce((sum, c) => sum + c, 0) / costs.length
            : null,
          avg_tokens: tokens.length > 0
            ? Math.round(tokens.reduce((sum, t) => sum + t, 0) / tokens.length)
            : null,
          first_used: timestamps[0],
          last_used: timestamps[timestamps.length - 1]
        }
      }).sort((a, b) => b.sessions_count - a.sessions_count)
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur modèles:', error)
      return []
    }
  }

  /**
   * 📈 Trends journaliers
   */
  async getDailyTrends(days = 14): Promise<DailyTrend[]> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: sessions, error } = await this.supabase
        .from('jarvis_sessions')
        .select('gym_id, timestamp, session_duration, api_cost, user_message_count, conversation_context')
        .gte('timestamp', sinceDate)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      
      // Grouper par date
      const grouped = sessions?.reduce((acc, session) => {
        const date = session.timestamp.split('T')[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(session)
        return acc
      }, {} as Record<string, any[]>) || {}
      
      return Object.entries(grouped).map(([date, sessions]) => {
        const durations = sessions.filter(s => s.session_duration).map(s => s.session_duration)
        const costs = sessions.filter(s => s.api_cost).map(s => s.api_cost)
        const messages = sessions.filter(s => s.user_message_count).map(s => s.user_message_count)
        const models = new Set(sessions.map(s => s.conversation_context?.model).filter(Boolean))
        
        return {
          date,
          sessions_count: sessions.length,
          active_kiosks: new Set(sessions.map(s => s.gym_id)).size,
          avg_duration_seconds: durations.length > 0 
            ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
            : null,
          total_cost_usd: costs.length > 0 
            ? costs.reduce((sum, c) => sum + c, 0)
            : null,
          avg_messages_per_session: messages.length > 0
            ? Math.round((messages.reduce((sum, m) => sum + m, 0) / messages.length) * 10) / 10
            : null,
          unique_models_used: models.size
        }
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur trends:', error)
      return []
    }
  }

  /**
   * 🚨 Erreurs récentes (si table existe)
   */
  async getRecentErrors(days = 7): Promise<Array<{
    error_type: string
    error_count: number
    last_error: string
    sample_details: string | null
    affected_kiosks: number
  }>> {
    try {
      // Vérifier si la table existe
      const { data: tableExists } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'jarvis_errors_log')
        .single()
      
      if (!tableExists) {
        return []
      }
      
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: errors, error } = await this.supabase
        .from('jarvis_errors_log')
        .select('error_type, details, timestamp, gym_id')
        .gte('timestamp', sinceDate)
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      
      // Grouper par type d'erreur
      const grouped = errors?.reduce((acc, error) => {
        const type = error.error_type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(error)
        return acc
      }, {} as Record<string, any[]>) || {}
      
      return Object.entries(grouped).map(([errorType, errorList]) => {
        const timestamps = errorList.map(e => e.timestamp).sort()
        
        return {
          error_type: errorType,
          error_count: errorList.length,
          last_error: timestamps[timestamps.length - 1],
          sample_details: errorList[0]?.details || null,
          affected_kiosks: new Set(errorList.map(e => e.gym_id)).size
        }
      }).sort((a, b) => b.error_count - a.error_count)
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur erreurs récentes:', error)
      return []
    }
  }

  /**
   * 📊 Métriques kiosk spécifique
   */
  async getKioskSpecificMetrics(gymId: string, hours = 24): Promise<{
    sessions: ExistingSessionMetrics[]
    errors: ExistingErrorLog[]
    heartbeats: ExistingHeartbeat[]
    summary: {
      sessions_count: number
      total_cost_usd: number | null
      avg_duration: number | null
      models_used: string[]
      last_activity: string | null
    }
  }> {
    try {
      const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      
      // Sessions récentes
      const { data: sessions } = await this.supabase
        .from('jarvis_sessions')
        .select('*')
        .eq('gym_id', gymId)
        .gte('timestamp', sinceDate)
        .order('timestamp', { ascending: false })
        .limit(50)
      
      // Erreurs récentes
      const { data: errors } = await this.supabase
        .from('jarvis_errors_log')
        .select('*')
        .eq('gym_id', gymId)
        .gte('timestamp', sinceDate)
        .order('timestamp', { ascending: false })
        .limit(20)
      
      // Heartbeats récents
      const { data: heartbeats } = await this.supabase
        .from('kiosk_heartbeats')
        .select('*')
        .eq('gym_id', gymId)
        .gte('last_heartbeat', sinceDate)
        .order('last_heartbeat', { ascending: false })
        .limit(10)
      
      // Calcul summary
      const sessionsArray = sessions || []
      const costs = sessionsArray.filter(s => s.api_cost).map(s => s.api_cost)
      const durations = sessionsArray.filter(s => s.session_duration).map(s => s.session_duration)
      const models = [...new Set(sessionsArray.map(s => s.conversation_context?.model).filter(Boolean))]
      
      return {
        sessions: sessionsArray,
        errors: errors || [],
        heartbeats: heartbeats || [],
        summary: {
          sessions_count: sessionsArray.length,
          total_cost_usd: costs.length > 0 ? costs.reduce((sum, c) => sum + c, 0) : null,
          avg_duration: durations.length > 0 
            ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
            : null,
          models_used: models,
          last_activity: sessionsArray[0]?.timestamp || null
        }
      }
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur métriques kiosk:', error)
      return {
        sessions: [],
        errors: [],
        heartbeats: [],
        summary: {
          sessions_count: 0,
          total_cost_usd: null,
          avg_duration: null,
          models_used: [],
          last_activity: null
        }
      }
    }
  }

  /**
   * ⚡ Statistiques rapides globales
   */
  async getQuickGlobalStats(): Promise<{
    total_sessions_today: number
    total_sessions_7d: number
    active_kiosks_today: number
    total_cost_today: number | null
    total_cost_7d: number | null
    top_model: string | null
    errors_24h: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      // Sessions aujourd'hui
      const { data: sessionsToday } = await this.supabase
        .from('jarvis_sessions')
        .select('gym_id, api_cost')
        .gte('timestamp', today)
      
      // Sessions 7 jours
      const { data: sessions7d } = await this.supabase
        .from('jarvis_sessions')
        .select('api_cost, conversation_context')
        .gte('timestamp', since7d)
      
      // Erreurs 24h
      const { data: errors24h } = await this.supabase
        .from('jarvis_errors_log')
        .select('id')
        .gte('timestamp', since24h)
      
      const sessionsTodayArray = sessionsToday || []
      const sessions7dArray = sessions7d || []
      
      // Calculs
      const costToday = sessionsTodayArray
        .filter(s => s.api_cost)
        .reduce((sum, s) => sum + s.api_cost, 0)
      
      const cost7d = sessions7dArray
        .filter(s => s.api_cost)
        .reduce((sum, s) => sum + s.api_cost, 0)
      
      // Modèle le plus utilisé
      const modelCounts = sessions7dArray.reduce((acc, s) => {
        const model = s.conversation_context?.model
        if (model) {
          acc[model] = (acc[model] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      const topModel = Object.entries(modelCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null
      
      return {
        total_sessions_today: sessionsTodayArray.length,
        total_sessions_7d: sessions7dArray.length,
        active_kiosks_today: new Set(sessionsTodayArray.map(s => s.gym_id)).size,
        total_cost_today: costToday > 0 ? costToday : null,
        total_cost_7d: cost7d > 0 ? cost7d : null,
        top_model: topModel,
        errors_24h: errors24h?.length || 0
      }
    } catch (error) {
      console.error('❌ [EXISTING MONITORING] Erreur stats globales:', error)
      return {
        total_sessions_today: 0,
        total_sessions_7d: 0,
        active_kiosks_today: 0,
        total_cost_today: null,
        total_cost_7d: null,
        top_model: null,
        errors_24h: 0
      }
    }
  }
}

// ====================================
// 📤 Export instance singleton
// ====================================

export const existingDataMonitoringService = new ExistingDataMonitoringService()