import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// Types pour le monitoring microphone
interface MicrophoneMetrics {
  level: number
  quality: 'excellent' | 'good' | 'degraded' | 'poor'
  timestamp: Date
  isActive: boolean
  errorCount: number
}

interface MicrophoneHealthResult {
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  score: number // 0-100
  issues: string[]
  recommendations: string[]
  lastMetrics?: MicrophoneMetrics
}

interface MicrophoneAlert {
  id: string
  gymId: string
  kioskSlug: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: string
  timestamp: Date
  resolved: boolean
}

class MicrophoneHealthMonitor {
  private supabase = getSupabaseSingleton()
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false

  /**
   * Démarre le monitoring en temps réel du microphone
   */
  startMonitoring(gymId: string, kioskSlug: string, intervalMs: number = 30000) {
    if (this.isMonitoring) {
      console.warn('Monitoring déjà actif')
      return
    }

    this.isMonitoring = true
    console.log(`🎤 [MONITORING] Démarrage monitoring microphone pour ${kioskSlug}`)

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkMicrophoneHealth(gymId, kioskSlug)
      } catch (error) {
        console.error('Erreur monitoring microphone:', error)
      }
    }, intervalMs)
  }

  /**
   * Arrête le monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('🎤 [MONITORING] Monitoring microphone arrêté')
  }

  /**
   * Vérifie la santé du microphone
   */
  async checkMicrophoneHealth(gymId: string, kioskSlug: string): Promise<MicrophoneHealthResult> {
    try {
      // 1. Récupérer les métriques récentes (5 dernières minutes)
      const { data: recentMetrics, error } = await this.supabase
        .from('kiosk_metrics')
        .select('microphone_level, audio_quality, collected_at, browser_info')
        .eq('gym_id', gymId)
        .eq('kiosk_slug', kioskSlug)
        .gte('collected_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('collected_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      // 2. Analyser la santé du microphone
      const healthResult = this.analyzeMicrophoneHealth(recentMetrics || [])

      // 3. Créer des alertes si nécessaire
      if (healthResult.status === 'critical' || healthResult.status === 'warning') {
        await this.createMicrophoneAlert(gymId, kioskSlug, healthResult)
      }

      // 4. Enregistrer le résultat du monitoring
      await this.recordHealthCheck(gymId, kioskSlug, healthResult)

      return healthResult

    } catch (error) {
      console.error('Erreur monitoring microphone:', error)
      return {
        status: 'unknown',
        score: 0,
        issues: ['Erreur de monitoring'],
        recommendations: ['Vérifiez la connexion à la base de données']
      }
    }
  }

  /**
   * Analyse les métriques pour déterminer la santé du microphone
   */
  private analyzeMicrophoneHealth(metrics: any[]): MicrophoneHealthResult {
    if (metrics.length === 0) {
      return {
        status: 'critical',
        score: 0,
        issues: ['Aucune métrique microphone récente'],
        recommendations: [
          'Vérifiez que le kiosque est en ligne',
          'Redémarrez le kiosque si nécessaire'
        ]
      }
    }

    const issues: string[] = []
    const recommendations: string[] = []
    let score = 100

    // Analyser le niveau du microphone
    const avgLevel = metrics.reduce((sum, m) => sum + (m.microphone_level || 0), 0) / metrics.length
    if (avgLevel < 10) {
      issues.push('Niveau microphone très faible')
      recommendations.push('Vérifiez que le microphone n\'est pas coupé')
      score -= 30
    } else if (avgLevel < 30) {
      issues.push('Niveau microphone faible')
      recommendations.push('Ajustez le volume du microphone')
      score -= 15
    }

    // Analyser la qualité audio
    const poorQualityCount = metrics.filter(m => m.audio_quality === 'poor').length
    const degradedQualityCount = metrics.filter(m => m.audio_quality === 'degraded').length
    
    if (poorQualityCount > metrics.length * 0.5) {
      issues.push('Qualité audio dégradée')
      recommendations.push('Vérifiez l\'environnement sonore et le matériel')
      score -= 25
    } else if (degradedQualityCount > metrics.length * 0.3) {
      issues.push('Qualité audio variable')
      recommendations.push('Réduisez le bruit ambiant')
      score -= 10
    }

    // Analyser la continuité des métriques
    const timeGaps = this.findTimeGaps(metrics)
    if (timeGaps.length > 0) {
      issues.push('Interruptions dans les métriques')
      recommendations.push('Vérifiez la stabilité de la connexion')
      score -= 20
    }

    // Déterminer le statut global
    let status: MicrophoneHealthResult['status'] = 'healthy'
    if (score < 30) status = 'critical'
    else if (score < 60) status = 'warning'
    else if (score < 85) status = 'warning'

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      lastMetrics: metrics[0] ? {
        level: metrics[0].microphone_level || 0,
        quality: metrics[0].audio_quality || 'unknown',
        timestamp: new Date(metrics[0].collected_at),
        isActive: true,
        errorCount: 0
      } : undefined
    }
  }

  /**
   * Trouve les gaps temporels dans les métriques
   */
  private findTimeGaps(metrics: any[]): { start: Date; end: Date; duration: number }[] {
    const gaps: { start: Date; end: Date; duration: number }[] = []
    const expectedInterval = 30000 // 30 secondes

    for (let i = 0; i < metrics.length - 1; i++) {
      const current = new Date(metrics[i].collected_at)
      const next = new Date(metrics[i + 1].collected_at)
      const gap = current.getTime() - next.getTime()

      if (gap > expectedInterval * 2) { // Gap > 1 minute
        gaps.push({
          start: next,
          end: current,
          duration: gap
        })
      }
    }

    return gaps
  }

  /**
   * Crée une alerte microphone
   */
  private async createMicrophoneAlert(
    gymId: string, 
    kioskSlug: string, 
    healthResult: MicrophoneHealthResult
  ): Promise<void> {
    try {
      const severity = healthResult.status === 'critical' ? 'critical' : 'medium'
      
      const alert: Omit<MicrophoneAlert, 'id'> = {
        gymId,
        kioskSlug,
        severity,
        message: `Problème microphone détecté (score: ${healthResult.score}/100)`,
        details: JSON.stringify({
          issues: healthResult.issues,
          recommendations: healthResult.recommendations,
          timestamp: new Date().toISOString()
        }),
        timestamp: new Date(),
        resolved: false
      }

      // Vérifier si une alerte similaire existe déjà
      const { data: existingAlerts } = await this.supabase
        .from('jarvis_errors_log')
        .select('id')
        .eq('gym_slug', kioskSlug)
        .eq('error_type', 'microphone_health')
        .eq('resolved', false)
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1 heure

      if (!existingAlerts || existingAlerts.length === 0) {
        // Créer nouvelle alerte
        await this.supabase
          .from('jarvis_errors_log')
          .insert({
            error_type: 'microphone_health',
            error_details: alert.message,
            gym_slug: kioskSlug,
            metadata: {
              severity: alert.severity,
              health_result: healthResult,
              alert_details: alert.details
            },
            resolved: false
          })

        console.log(`🚨 [MONITORING] Alerte microphone créée pour ${kioskSlug}`)
      }

    } catch (error) {
      console.error('Erreur création alerte microphone:', error)
    }
  }

  /**
   * Enregistre le résultat du check de santé
   */
  private async recordHealthCheck(
    gymId: string, 
    kioskSlug: string, 
    healthResult: MicrophoneHealthResult
  ): Promise<void> {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          log_type: 'health',
          message: `Microphone health check: ${healthResult.status} (score: ${healthResult.score}/100)`,
          details: {
            gym_id: gymId,
            kiosk_slug: kioskSlug,
            health_result: healthResult,
            timestamp: new Date().toISOString()
          }
        })

    } catch (error) {
      console.error('Erreur enregistrement health check:', error)
    }
  }

  /**
   * Récupère l'historique de santé du microphone
   */
  async getMicrophoneHealthHistory(
    gymId: string, 
    kioskSlug: string, 
    hours: number = 24
  ): Promise<MicrophoneHealthResult[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('system_logs')
        .select('message, details, timestamp')
        .eq('log_type', 'health')
        .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error

      return logs?.map(log => log.details?.health_result).filter(Boolean) || []

    } catch (error) {
      console.error('Erreur récupération historique:', error)
      return []
    }
  }

  /**
   * Test en temps réel du microphone
   */
  async testMicrophoneRealtime(): Promise<MicrophoneMetrics> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia non supporté')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })

      // Analyser le niveau audio
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)
      
      const level = Math.max(...dataArray)
      let quality: MicrophoneMetrics['quality'] = 'excellent'
      
      if (level < 10) quality = 'poor'
      else if (level < 30) quality = 'degraded'
      else if (level < 60) quality = 'good'

      // Nettoyer
      stream.getTracks().forEach(track => track.stop())
      audioContext.close()

      return {
        level,
        quality,
        timestamp: new Date(),
        isActive: true,
        errorCount: 0
      }

    } catch (error: any) {
      return {
        level: 0,
        quality: 'poor',
        timestamp: new Date(),
        isActive: false,
        errorCount: 1
      }
    }
  }
}

// Instance singleton
export const microphoneHealthMonitor = new MicrophoneHealthMonitor()

// Fonctions utilitaires
export const startMicrophoneMonitoring = (gymId: string, kioskSlug: string) => {
  microphoneHealthMonitor.startMonitoring(gymId, kioskSlug)
}

export const stopMicrophoneMonitoring = () => {
  microphoneHealthMonitor.stopMonitoring()
}

export const checkMicrophoneHealth = (gymId: string, kioskSlug: string) => {
  return microphoneHealthMonitor.checkMicrophoneHealth(gymId, kioskSlug)
}

export const getMicrophoneHealthHistory = (gymId: string, kioskSlug: string, hours?: number) => {
  return microphoneHealthMonitor.getMicrophoneHealthHistory(gymId, kioskSlug, hours)
}

export const testMicrophoneRealtime = () => {
  return microphoneHealthMonitor.testMicrophoneRealtime()
}

