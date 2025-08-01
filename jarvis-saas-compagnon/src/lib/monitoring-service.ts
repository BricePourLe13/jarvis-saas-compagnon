/**
 * 📊 Service de Monitoring JARVIS - Interface TypeScript
 * Intégration avec le système de monitoring SQL avancé
 */

import { createBrowserClientWithConfig } from './supabase-admin'

// ====================================
// 🏷️ Types TypeScript
// ====================================

export interface KioskMetrics {
  id: string
  gym_id: string
  kiosk_slug: string
  cpu_usage: number | null
  memory_usage: number | null
  memory_total: number | null
  memory_used: number | null
  storage_usage: number | null
  network_latency: number | null
  api_response_time: number | null
  microphone_level: number | null
  speaker_volume: number | null
  audio_quality: 'excellent' | 'good' | 'degraded' | 'poor' | null
  temperature_cpu: number | null
  power_consumption: number | null
  browser_info: Record<string, any>
  hardware_info: Record<string, any>
  collected_at: string
  created_at: string
}

export interface KioskIncident {
  id: string
  gym_id: string
  kiosk_slug: string
  incident_type: 'offline' | 'performance_degraded' | 'audio_failure' | 'network_issue' | 'hardware_failure' | 'software_error' | 'api_timeout' | 'high_error_rate' | 'overheating'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string | null
  affected_components: string[]
  metrics_snapshot: Record<string, any> | null
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  resolution_notes: string | null
  resolved_by: string | null
  detected_at: string
  resolved_at: string | null
  duration_minutes: number | null
  sessions_affected: number
  estimated_loss_eur: number | null
  created_at: string
  updated_at: string
}

export interface MonitoringAlert {
  id: string
  gym_id: string
  kiosk_slug: string
  alert_type: 'cpu_high' | 'memory_high' | 'disk_full' | 'network_slow' | 'api_slow' | 'error_rate_high' | 'offline_detected' | 'temperature_high' | 'session_failure_spike'
  severity: 'info' | 'warning' | 'error' | 'critical'
  threshold_value: number | null
  current_value: number | null
  unit: string | null
  title: string
  description: string | null
  recommended_action: string | null
  status: 'active' | 'acknowledged' | 'resolved' | 'muted'
  acknowledged_by: string | null
  triggered_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface KioskStatus {
  gym_id: string
  gym_name: string
  franchise_name: string
  kiosk_slug: string
  gym_status: string
  online_status: 'online' | 'offline'
  last_heartbeat: string | null
  cpu_usage: number | null
  memory_usage: number | null
  network_latency: number | null
  api_response_time: number | null
  last_metrics: string | null
  active_alerts: number
  open_incidents: number
}

export interface MonitoringOverview {
  total_kiosks: number
  online_kiosks: number
  uptime_percentage: number
  kiosks_with_alerts: number
  kiosks_with_incidents: number
  avg_cpu_usage: number
  avg_memory_usage: number
  avg_network_latency: number
  avg_api_response_time: number
  total_active_alerts: number
  critical_alerts: number
  open_incidents: number
  calculated_at: string
}

export interface PerformanceTrend {
  hour: string
  avg_cpu: number
  avg_memory: number
  avg_latency: number
  total_sessions: number
  avg_success_rate: number
  avg_error_rate: number
  avg_uptime: number
}

export interface ErrorAnalysis {
  error_type: string
  error_count: number
  affected_kiosks: number
  resolved_count: number
  resolution_rate: number
  last_occurrence: string
  first_occurrence: string
  sample_details: string | null
}

export interface MaintenanceRecommendation {
  gym_name: string
  kiosk_slug: string
  issues: string[]
  maintenance_priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK'
  last_maintenance: string
  maintenance_status: string
  uptime_7_days: number
  last_check: string
}

// ====================================
// 🚀 Service Principal
// ====================================

export class MonitoringService {
  private supabase = createBrowserClientWithConfig()

  /**
   * 📊 Vue d'ensemble monitoring général
   */
  async getMonitoringOverview(): Promise<MonitoringOverview | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_monitoring_overview')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur overview:', error)
        return null
      }
      
      return data?.[0] || null
    } catch (error) {
      console.error('❌ [MONITORING] Erreur overview:', error)
      return null
    }
  }

  /**
   * 🎯 Statut de tous les kiosks
   */
  async getAllKioskStatus(): Promise<KioskStatus[]> {
    try {
      const { data, error } = await this.supabase
        .from('v_kiosk_current_status')
        .select('*')
        .order('gym_name')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur statut kiosks:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur statut kiosks:', error)
      return []
    }
  }

  /**
   * 🔍 Détail kiosk spécifique
   */
  async getKioskDetail(gymId: string): Promise<KioskStatus | null> {
    try {
      const { data, error } = await this.supabase
        .from('v_kiosk_current_status')
        .select('*')
        .eq('gym_id', gymId)
        .single()
      
      if (error) {
        console.error('❌ [MONITORING] Erreur détail kiosk:', error)
        return null
      }
      
      return data || null
    } catch (error) {
      console.error('❌ [MONITORING] Erreur détail kiosk:', error)
      return null
    }
  }

  /**
   * 🚨 Alertes critiques actives
   */
  async getCriticalAlerts(limit = 10): Promise<MonitoringAlert[]> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_alerts')
        .select(`
          *,
          gyms:gym_id (name),
          franchises:gyms.franchise_id (name)
        `)
        .eq('status', 'active')
        .in('severity', ['critical', 'error'])
        .order('triggered_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('❌ [MONITORING] Erreur alertes critiques:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur alertes critiques:', error)
      return []
    }
  }

  /**
   * 📈 Trends performance 24h
   */
  async getPerformanceTrends(): Promise<PerformanceTrend[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_performance_trends_24h')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur trends:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur trends:', error)
      return []
    }
  }

  /**
   * 📊 Métriques récentes kiosk
   */
  async getKioskMetrics(gymId: string, hoursBack = 24): Promise<KioskMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('kiosk_metrics')
        .select('*')
        .eq('gym_id', gymId)
        .gte('collected_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
        .order('collected_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('❌ [MONITORING] Erreur métriques:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur métriques:', error)
      return []
    }
  }

  /**
   * 🔧 Incidents ouverts
   */
  async getOpenIncidents(gymId?: string): Promise<KioskIncident[]> {
    try {
      let query = this.supabase
        .from('kiosk_incidents')
        .select('*')
        .in('status', ['open', 'investigating'])
        .order('detected_at', { ascending: false })
      
      if (gymId) {
        query = query.eq('gym_id', gymId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ [MONITORING] Erreur incidents:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur incidents:', error)
      return []
    }
  }

  /**
   * 📋 Analyse erreurs par type
   */
  async getErrorAnalysis(days = 7): Promise<ErrorAnalysis[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_error_analysis', {
        days_back: days
      })
      
      if (error) {
        console.error('❌ [MONITORING] Erreur analyse erreurs:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur analyse erreurs:', error)
      return []
    }
  }

  /**
   * 🔧 Recommandations maintenance
   */
  async getMaintenanceRecommendations(): Promise<MaintenanceRecommendation[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_maintenance_recommendations')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur maintenance:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('❌ [MONITORING] Erreur maintenance:', error)
      return []
    }
  }

  /**
   * ✅ Résoudre alerte
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          acknowledged_by: resolvedBy
        })
        .eq('id', alertId)
      
      if (error) {
        console.error('❌ [MONITORING] Erreur résolution alerte:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [MONITORING] Erreur résolution alerte:', error)
      return false
    }
  }

  /**
   * 📝 Créer incident
   */
  async createIncident(incident: Partial<KioskIncident>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('kiosk_incidents')
        .insert({
          ...incident,
          detected_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('❌ [MONITORING] Erreur création incident:', error)
        return null
      }
      
      return data?.id || null
    } catch (error) {
      console.error('❌ [MONITORING] Erreur création incident:', error)
      return null
    }
  }

  /**
   * 📊 Enregistrer métriques
   */
  async recordMetrics(metrics: Partial<KioskMetrics>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('kiosk_metrics')
        .insert({
          ...metrics,
          collected_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('❌ [MONITORING] Erreur enregistrement métriques:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ [MONITORING] Erreur enregistrement métriques:', error)
      return false
    }
  }

  /**
   * 🧹 Déclencher nettoyage
   */
  async triggerCleanup(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('cleanup_monitoring_data')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur nettoyage:', error)
        return false
      }
      
      console.log('✅ [MONITORING] Nettoyage effectué')
      return true
    } catch (error) {
      console.error('❌ [MONITORING] Erreur nettoyage:', error)
      return false
    }
  }

  /**
   * 📊 Calculer analytics horaires
   */
  async calculateHourlyAnalytics(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('calculate_hourly_analytics')
      
      if (error) {
        console.error('❌ [MONITORING] Erreur calcul analytics:', error)
        return false
      }
      
      console.log('✅ [MONITORING] Analytics horaires calculées')
      return true
    } catch (error) {
      console.error('❌ [MONITORING] Erreur calcul analytics:', error)
      return false
    }
  }
}

// ====================================
// 📤 Export instance singleton
// ====================================

export const monitoringService = new MonitoringService()