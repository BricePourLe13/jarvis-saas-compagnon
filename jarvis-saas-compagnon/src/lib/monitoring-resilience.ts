/**
 * 🛡️ MONITORING RESILIENCE LAYER - Gestion d'erreurs Enterprise
 * 
 * Couche de résilience pour le monitoring qui gère:
 * - Retry automatique avec backoff exponentiel
 * - Fallback vers buffer local
 * - Queue de retry pour événements ratés
 * - Métriques de santé du système
 */

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

interface BufferedEvent {
  id: string
  sessionId: string
  eventType: 'session_start' | 'audio_event' | 'session_end'
  data: any
  timestamp: Date
  retryCount: number
  lastError?: string
}

interface HealthMetrics {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  bufferedEvents: number
  retryQueueSize: number
  lastSuccessAt?: Date
  lastFailureAt?: Date
  errorRate: number
}

/**
 * 🛡️ Service de résilience pour monitoring
 */
export class MonitoringResilienceService {
  private static instance: MonitoringResilienceService
  
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }

  private eventBuffer: Map<string, BufferedEvent> = new Map()
  private retryQueue: BufferedEvent[] = []
  private healthMetrics: HealthMetrics = {
    totalEvents: 0,
    successfulEvents: 0,
    failedEvents: 0,
    bufferedEvents: 0,
    retryQueueSize: 0,
    errorRate: 0
  }

  private retryTimer?: NodeJS.Timeout
  private isProcessingQueue = false

  static getInstance(): MonitoringResilienceService {
    if (!MonitoringResilienceService.instance) {
      MonitoringResilienceService.instance = new MonitoringResilienceService()
    }
    return MonitoringResilienceService.instance
  }

  /**
   * 🔄 Exécuter opération avec retry automatique
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries = this.retryConfig.maxRetries
  ): Promise<T | null> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [RESILIENCE] ${context} - Tentative ${attempt + 1}/${maxRetries + 1}`)
        
        const result = await operation()
        
        if (attempt > 0) {
          console.log(`✅ [RESILIENCE] ${context} - Succès après ${attempt} retry(s)`)
        }
        
        this.updateMetrics('success')
        return result

      } catch (error) {
        lastError = error as Error
        console.log(`❌ [RESILIENCE] ${context} - Tentative ${attempt + 1} échouée:`, error.message)

        if (attempt < maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
            this.retryConfig.maxDelay
          )
          
          console.log(`⏱️ [RESILIENCE] Retry dans ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    console.error(`💥 [RESILIENCE] ${context} - Échec définitif après ${maxRetries + 1} tentatives`)
    this.updateMetrics('failure', lastError?.message)
    
    return null
  }

  /**
   * 📦 Buffer événement en cas d'échec
   */
  async bufferEvent(sessionId: string, eventType: BufferedEvent['eventType'], data: any): Promise<void> {
    const event: BufferedEvent = {
      id: `${sessionId}_${eventType}_${Date.now()}`,
      sessionId,
      eventType,
      data,
      timestamp: new Date(),
      retryCount: 0
    }

    this.eventBuffer.set(event.id, event)
    this.retryQueue.push(event)
    
    this.updateMetrics('buffered')
    
    console.log(`📦 [RESILIENCE] Événement bufferisé:`, {
      id: event.id,
      type: eventType,
      bufferSize: this.eventBuffer.size
    })

    // Démarrer traitement queue si pas déjà en cours
    this.scheduleQueueProcessing()
  }

  /**
   * 🔄 Traiter queue de retry
   */
  private async processRetryQueue(): Promise<void> {
    if (this.isProcessingQueue || this.retryQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(`🔄 [RESILIENCE] Traitement queue retry: ${this.retryQueue.length} événements`)

    const eventsToProcess = [...this.retryQueue]
    this.retryQueue = []

    for (const event of eventsToProcess) {
      if (event.retryCount >= this.retryConfig.maxRetries) {
        console.log(`💀 [RESILIENCE] Événement abandonné:`, event.id)
        this.eventBuffer.delete(event.id)
        continue
      }

      try {
        // Simuler retry de l'événement
        await this.retryEvent(event)
        
        // Succès - supprimer du buffer
        this.eventBuffer.delete(event.id)
        this.updateMetrics('success')
        
      } catch (error) {
        // Échec - remettre en queue avec compteur incrémenté
        event.retryCount++
        event.lastError = (error as Error).message
        
        if (event.retryCount < this.retryConfig.maxRetries) {
          this.retryQueue.push(event)
        } else {
          console.log(`💀 [RESILIENCE] Événement définitivement abandonné:`, event.id)
          this.eventBuffer.delete(event.id)
        }
        
        this.updateMetrics('failure', (error as Error).message)
      }
    }

    this.updateQueueMetrics()
    this.isProcessingQueue = false

    // Reprogrammer si il reste des événements
    if (this.retryQueue.length > 0) {
      this.scheduleQueueProcessing()
    }
  }

  /**
   * 🔄 Retry un événement spécifique
   */
  private async retryEvent(event: BufferedEvent): Promise<void> {
    console.log(`🔄 [RESILIENCE] Retry événement:`, event.id, `(tentative ${event.retryCount + 1})`)

    // Ici on délègue au service approprié selon le type
    switch (event.eventType) {
      case 'session_start':
        // Retry startSession
        const { openaiRealtimeInstrumentation } = await import('./openai-realtime-instrumentation')
        await openaiRealtimeInstrumentation.startSession(
          event.sessionId,
          event.data.gymId,
          event.data.metadata
        )
        break

      case 'audio_event':
        // Retry recordAudioEvent
        const { openaiRealtimeInstrumentation: instrumentation } = await import('./openai-realtime-instrumentation')
        await instrumentation.recordAudioEvent(event.sessionId, event.data)
        break

      case 'session_end':
        // Retry endSession
        const { openaiRealtimeInstrumentation: endInstrumentation } = await import('./openai-realtime-instrumentation')
        await endInstrumentation.endSession(event.sessionId, event.data)
        break

      default:
        throw new Error(`Type d'événement non supporté: ${event.eventType}`)
    }
  }

  /**
   * ⏰ Programmer traitement queue
   */
  private scheduleQueueProcessing(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }

    this.retryTimer = setTimeout(() => {
      this.processRetryQueue().catch(console.error)
    }, this.retryConfig.baseDelay)
  }

  /**
   * 📊 Mettre à jour métriques
   */
  private updateMetrics(type: 'success' | 'failure' | 'buffered', error?: string): void {
    this.healthMetrics.totalEvents++

    switch (type) {
      case 'success':
        this.healthMetrics.successfulEvents++
        this.healthMetrics.lastSuccessAt = new Date()
        break
      case 'failure':
        this.healthMetrics.failedEvents++
        this.healthMetrics.lastFailureAt = new Date()
        break
      case 'buffered':
        this.healthMetrics.bufferedEvents++
        break
    }

    this.updateQueueMetrics()
    this.calculateErrorRate()
  }

  /**
   * 📊 Mettre à jour métriques de queue
   */
  private updateQueueMetrics(): void {
    this.healthMetrics.retryQueueSize = this.retryQueue.length
    this.healthMetrics.bufferedEvents = this.eventBuffer.size
  }

  /**
   * 📊 Calculer taux d'erreur
   */
  private calculateErrorRate(): void {
    if (this.healthMetrics.totalEvents === 0) {
      this.healthMetrics.errorRate = 0
      return
    }

    this.healthMetrics.errorRate = 
      (this.healthMetrics.failedEvents / this.healthMetrics.totalEvents) * 100
  }

  /**
   * 💤 Utilitaire sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 📊 Obtenir métriques de santé
   */
  getHealthMetrics(): HealthMetrics {
    this.updateQueueMetrics()
    this.calculateErrorRate()
    return { ...this.healthMetrics }
  }

  /**
   * 🧹 Nettoyer métriques et buffer
   */
  cleanup(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
    
    this.eventBuffer.clear()
    this.retryQueue = []
    this.healthMetrics = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      bufferedEvents: 0,
      retryQueueSize: 0,
      errorRate: 0
    }
    
    console.log('🧹 [RESILIENCE] Nettoyage effectué')
  }

  /**
   * 🔍 Debug info
   */
  getDebugInfo(): any {
    return {
      health: this.getHealthMetrics(),
      bufferSize: this.eventBuffer.size,
      queueSize: this.retryQueue.length,
      isProcessing: this.isProcessingQueue,
      bufferedEvents: Array.from(this.eventBuffer.values()).map(e => ({
        id: e.id,
        type: e.eventType,
        retryCount: e.retryCount,
        lastError: e.lastError
      }))
    }
  }
}

/**
 * 🎯 Instance singleton
 */
export const monitoringResilience = MonitoringResilienceService.getInstance()

/**
 * 🔧 Wrapper de résilience pour instrumentation
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: () => Promise<void>
): Promise<T | null> {
  const result = await monitoringResilience.executeWithRetry(operation, context)
  
  if (result === null && fallback) {
    try {
      await fallback()
    } catch (error) {
      console.error(`❌ [RESILIENCE] Fallback échoué pour ${context}:`, error)
    }
  }
  
  return result
}