/**
 * 🧮 JARVIS OpenAI Cost Tracker
 * Système de tracking et calcul des coûts OpenAI Realtime API
 */

import { createSimpleClient } from './supabase-admin'

// 💰 TARIFS OPENAI GPT-4o MINI REALTIME API 2024 (en USD) - ÉCONOMIQUE !
export const OPENAI_PRICING = {
  // Text tokens - GPT-4o Mini Realtime (75% moins cher !)
  TEXT_INPUT: 0.60 / 1_000_000,     // $0.60 per 1M input tokens
  TEXT_OUTPUT: 2.40 / 1_000_000,    // $2.40 per 1M output tokens
  
  // Audio tokens - GPT-4o Mini Realtime (prix proportionnellement réduits)
  AUDIO_INPUT: 25.00 / 1_000_000,   // $25.00 per 1M tokens (~$0.015/minute)
  AUDIO_OUTPUT: 50.00 / 1_000_000,  // $50.00 per 1M tokens (~$0.06/minute)
  
  // Conversion approximative : 1 minute audio ≈ 1667 tokens
  AUDIO_TOKENS_PER_MINUTE: 1667
} as const

export interface SessionCostBreakdown {
  sessionId: string
  gymId: string
  franchiseId?: string
  timestamp: Date
  
  // Duration
  durationSeconds: number
  
  // Token counts
  textInputTokens: number
  textOutputTokens: number
  audioInputTokens: number
  audioOutputTokens: number
  
  // Costs (in USD)
  textInputCost: number
  textOutputCost: number
  audioInputCost: number
  audioOutputCost: number
  totalCost: number
  
  // Metadata
  userSatisfaction?: number
  errorOccurred: boolean
  endReason: 'user_ended' | 'timeout' | 'error' | 'system_limit'
}

export interface DailyCostSummary {
  date: string
  gymId?: string
  franchiseId?: string
  
  totalSessions: number
  totalDurationMinutes: number
  
  totalTextInputTokens: number
  totalTextOutputTokens: number
  totalAudioInputTokens: number
  totalAudioOutputTokens: number
  
  totalCostUSD: number
  averageSessionCost: number
  averageSatisfaction: number
  
  peakHour: number
  successRate: number
}

/**
 * 🧮 Calculer le coût d'une session JARVIS
 */
export function calculateSessionCost(data: {
  durationSeconds: number
  textInputTokens?: number
  textOutputTokens?: number
  audioInputSeconds?: number
  audioOutputSeconds?: number
}): Pick<SessionCostBreakdown, 'textInputCost' | 'textOutputCost' | 'audioInputCost' | 'audioOutputCost' | 'totalCost' | 'audioInputTokens' | 'audioOutputTokens'> {
  
  // Calcul tokens audio basé sur la durée
  const audioInputTokens = Math.round((data.audioInputSeconds || 0) * OPENAI_PRICING.AUDIO_TOKENS_PER_MINUTE / 60)
  const audioOutputTokens = Math.round((data.audioOutputSeconds || 0) * OPENAI_PRICING.AUDIO_TOKENS_PER_MINUTE / 60)
  
  // Calcul des coûts
  const textInputCost = (data.textInputTokens || 0) * OPENAI_PRICING.TEXT_INPUT
  const textOutputCost = (data.textOutputTokens || 0) * OPENAI_PRICING.TEXT_OUTPUT
  const audioInputCost = audioInputTokens * OPENAI_PRICING.AUDIO_INPUT
  const audioOutputCost = audioOutputTokens * OPENAI_PRICING.AUDIO_OUTPUT
  
  const totalCost = textInputCost + textOutputCost + audioInputCost + audioOutputCost
  
  return {
    textInputCost,
    textOutputCost,
    audioInputCost,
    audioOutputCost,
    audioInputTokens,
    audioOutputTokens,
    totalCost
  }
}

/**
 * 💾 Enregistrer les métriques d'une session
 */
export async function trackSessionCost(data: Omit<SessionCostBreakdown, 'textInputCost' | 'textOutputCost' | 'audioInputCost' | 'audioOutputCost' | 'totalCost'> & {
  audioInputSeconds?: number
  audioOutputSeconds?: number
}): Promise<SessionCostBreakdown> {
  
  // Calculer les coûts
  const costs = calculateSessionCost({
    durationSeconds: data.durationSeconds,
    textInputTokens: data.textInputTokens,
    textOutputTokens: data.textOutputTokens,
    audioInputSeconds: data.audioInputSeconds,
    audioOutputSeconds: data.audioOutputSeconds
  })
  
  const sessionCost: SessionCostBreakdown = {
    ...data,
    audioInputTokens: costs.audioInputTokens,
    audioOutputTokens: costs.audioOutputTokens,
    ...costs
  }
  
  // Sauvegarder en base de données
  const supabase = createSimpleClient()
  
  const { error } = await supabase
    .from('jarvis_session_costs')
    .insert([{
      session_id: sessionCost.sessionId,
      gym_id: sessionCost.gymId,
      franchise_id: sessionCost.franchiseId,
      timestamp: sessionCost.timestamp.toISOString(),
      duration_seconds: sessionCost.durationSeconds,
      text_input_tokens: sessionCost.textInputTokens,
      text_output_tokens: sessionCost.textOutputTokens,
      audio_input_tokens: sessionCost.audioInputTokens,
      audio_output_tokens: sessionCost.audioOutputTokens,
      text_input_cost: sessionCost.textInputCost,
      text_output_cost: sessionCost.textOutputCost,
      audio_input_cost: sessionCost.audioInputCost,
      audio_output_cost: sessionCost.audioOutputCost,
      total_cost: sessionCost.totalCost,
      user_satisfaction: sessionCost.userSatisfaction,
      error_occurred: sessionCost.errorOccurred,
      end_reason: sessionCost.endReason
      // ✅ Système unifié - Utilise la vue jarvis_unified_costs
    }])
    .select()
  
  if (error) {
    console.error('❌ [COST TRACKER] Erreur sauvegarde:', error)
    throw error
  }
  
  console.log(`💰 [COST TRACKER] Session ${sessionCost.sessionId}: $${sessionCost.totalCost.toFixed(4)}`)
  
  return sessionCost
}

/**
 * 📊 Récupérer le résumé des coûts quotidiens
 */
export async function getDailyCostSummary(
  date: string, 
  filters?: { gymId?: string; franchiseId?: string }
): Promise<DailyCostSummary | null> {
  
  const supabase = createSimpleClient()
  
  let query = supabase
    .from('jarvis_session_costs')
    .select('*')
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
    console.error('❌ [COST TRACKER] Erreur récupération:', error)
    return null
  }
  
  if (!sessions || sessions.length === 0) {
    return {
      date,
      gymId: filters?.gymId,
      franchiseId: filters?.franchiseId,
      totalSessions: 0,
      totalDurationMinutes: 0,
      totalTextInputTokens: 0,
      totalTextOutputTokens: 0,
      totalAudioInputTokens: 0,
      totalAudioOutputTokens: 0,
      totalCostUSD: 0,
      averageSessionCost: 0,
      averageSatisfaction: 0,
      peakHour: 0,
      successRate: 0
    }
  }
  
  // Calculs d'agrégation
  const totalSessions = sessions.length
  const totalDurationMinutes = sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60
  const totalCostUSD = sessions.reduce((sum, s) => sum + s.total_cost, 0)
  const averageSessionCost = totalCostUSD / totalSessions
  
  const satisfactionScores = sessions.filter(s => s.user_satisfaction !== null).map(s => s.user_satisfaction!)
  const averageSatisfaction = satisfactionScores.length > 0 
    ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
    : 0
  
  const successfulSessions = sessions.filter(s => !s.error_occurred).length
  const successRate = (successfulSessions / totalSessions) * 100
  
  // Heure de pointe (approximation basée sur les timestamps)
  const hourCounts = sessions.reduce((acc, session) => {
    const hour = new Date(session.timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const peakHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
    count > hourCounts[max] ? parseInt(hour) : max, 0
  )
  
  return {
    date,
    gymId: filters?.gymId,
    franchiseId: filters?.franchiseId,
    totalSessions,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    totalTextInputTokens: sessions.reduce((sum, s) => sum + s.text_input_tokens, 0),
    totalTextOutputTokens: sessions.reduce((sum, s) => sum + s.text_output_tokens, 0),
    totalAudioInputTokens: sessions.reduce((sum, s) => sum + s.audio_input_tokens, 0),
    totalAudioOutputTokens: sessions.reduce((sum, s) => sum + s.audio_output_tokens, 0),
    totalCostUSD,
    averageSessionCost,
    averageSatisfaction,
    peakHour,
    successRate
  }
}

/**
 * 🎯 Récupérer les métriques en temps réel pour le dashboard
 */
export async function getRealTimeMetrics(filters?: { gymId?: string; franchiseId?: string }) {
  const today = new Date().toISOString().split('T')[0]
  
  const [todaySummary, yesterdaySummary] = await Promise.all([
    getDailyCostSummary(today, filters),
    getDailyCostSummary(
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      filters
    )
  ])
  
  if (!todaySummary || !yesterdaySummary) {
    return null
  }
  
  // Calcul des variations par rapport à hier
  const sessionChange = yesterdaySummary.totalSessions > 0 
    ? ((todaySummary.totalSessions - yesterdaySummary.totalSessions) / yesterdaySummary.totalSessions) * 100
    : 0
  
  const costChange = yesterdaySummary.totalCostUSD > 0
    ? ((todaySummary.totalCostUSD - yesterdaySummary.totalCostUSD) / yesterdaySummary.totalCostUSD) * 100
    : 0
  
  const durationChange = yesterdaySummary.totalDurationMinutes > 0
    ? ((todaySummary.totalDurationMinutes - yesterdaySummary.totalDurationMinutes) / yesterdaySummary.totalDurationMinutes) * 100
    : 0
  
  const satisfactionChange = yesterdaySummary.averageSatisfaction > 0
    ? ((todaySummary.averageSatisfaction - yesterdaySummary.averageSatisfaction) / yesterdaySummary.averageSatisfaction) * 100
    : 0
  
  return {
    today: todaySummary,
    yesterday: yesterdaySummary,
    changes: {
      sessions: Math.round(sessionChange),
      cost: Math.round(costChange),
      duration: Math.round(durationChange),
      satisfaction: Math.round(satisfactionChange)
    }
  }
}

/**
 * 🔄 Convertir USD en EUR (taux approximatif)
 */
export function convertUSDToEUR(usdAmount: number, exchangeRate: number = 0.85): number {
  return usdAmount * exchangeRate
}

/**
 * 💱 Formater le montant en devise
 */
export function formatCurrency(
  amount: number | undefined | null, 
  currency: 'USD' | 'EUR' = 'EUR',
  isReal: boolean = false
): string {
  const symbol = currency === 'EUR' ? '€' : '$'
  const safeAmount = amount || 0
  const formatted = `${symbol}${safeAmount.toFixed(2)}`
  
  // ✅ Ajouter une indication visuelle pour les estimations
  return isReal ? formatted : `~${formatted}`
} 

/**
 * 🏢 Métriques temps réel pour une franchise spécifique
 */
export async function getRealTimeMetricsByFranchise(franchiseId: string) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  try {
    // Métriques d'aujourd'hui
    const todayMetrics = await getDailyCostSummary(today, { franchiseId })
    // Métriques d'hier pour comparaison
    const yesterdayMetrics = await getDailyCostSummary(yesterday, { franchiseId })
    
    if (!todayMetrics || !yesterdayMetrics) {
      return null
    }
    
    // Calculs des changements
    const sessionChange = yesterdayMetrics.totalSessions === 0 ? 0 : 
      Math.round(((todayMetrics.totalSessions - yesterdayMetrics.totalSessions) / yesterdayMetrics.totalSessions) * 100)
    
    const costChange = yesterdayMetrics.totalCostUSD === 0 ? 0 :
      Math.round(((todayMetrics.totalCostUSD - yesterdayMetrics.totalCostUSD) / yesterdayMetrics.totalCostUSD) * 100)
    
    const durationChange = yesterdayMetrics.totalDurationMinutes === 0 ? 0 :
      Math.round(((todayMetrics.totalDurationMinutes - yesterdayMetrics.totalDurationMinutes) / yesterdayMetrics.totalDurationMinutes) * 100)
    
    const satisfactionChange = yesterdayMetrics.averageSatisfaction === 0 ? 0 :
      Math.round(((todayMetrics.averageSatisfaction - yesterdayMetrics.averageSatisfaction) / yesterdayMetrics.averageSatisfaction) * 100)
    
    return {
      franchiseId,
      today: todayMetrics,
      yesterday: yesterdayMetrics,
      changes: {
        sessions: sessionChange,
        cost: costChange,
        duration: durationChange,
        satisfaction: satisfactionChange
      }
    }
  } catch (error) {
    console.error('❌ [COST TRACKER] Erreur métriques franchise:', error)
    return null
  }
}

/**
 * 🏋️ Métriques temps réel pour un gym spécifique
 */
export async function getRealTimeMetricsByGym(gymId: string) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  try {
    // Métriques d'aujourd'hui
    const todayMetrics = await getDailyCostSummary(today, { gymId })
    // Métriques d'hier pour comparaison
    const yesterdayMetrics = await getDailyCostSummary(yesterday, { gymId })
    
    if (!todayMetrics || !yesterdayMetrics) {
      return null
    }
    
    // Calculs des changements
    const sessionChange = yesterdayMetrics.totalSessions === 0 ? 0 : 
      Math.round(((todayMetrics.totalSessions - yesterdayMetrics.totalSessions) / yesterdayMetrics.totalSessions) * 100)
    
    const costChange = yesterdayMetrics.totalCostUSD === 0 ? 0 :
      Math.round(((todayMetrics.totalCostUSD - yesterdayMetrics.totalCostUSD) / yesterdayMetrics.totalCostUSD) * 100)
    
    const durationChange = yesterdayMetrics.totalDurationMinutes === 0 ? 0 :
      Math.round(((todayMetrics.totalDurationMinutes - yesterdayMetrics.totalDurationMinutes) / yesterdayMetrics.totalDurationMinutes) * 100)
    
    const satisfactionChange = yesterdayMetrics.averageSatisfaction === 0 ? 0 :
      Math.round(((todayMetrics.averageSatisfaction - yesterdayMetrics.averageSatisfaction) / yesterdayMetrics.averageSatisfaction) * 100)
    
    return {
      gymId,
      today: todayMetrics,
      yesterday: yesterdayMetrics,
      changes: {
        sessions: sessionChange,
        cost: costChange,
        duration: durationChange,
        satisfaction: satisfactionChange
      }
    }
  } catch (error) {
    console.error('❌ [COST TRACKER] Erreur métriques gym:', error)
    return null
  }
}

/**
 * 📊 Métriques de supervision kiosk avancées
 */
export async function getKioskSupervisionMetrics(gymId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const supabase = createSimpleClient()
    
    // Sessions des 7 derniers jours
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: weekSessions, error } = await supabase
      .from('jarvis_session_costs')
      .select('*')
      .eq('gym_id', gymId)
      .gte('timestamp', lastWeek + 'T00:00:00.000Z')
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('❌ [KIOSK SUPERVISION] Erreur:', error)
      return null
    }
    
    const sessions = weekSessions || []
    const todaySessions = sessions.filter(s => s.timestamp.startsWith(today))
    
    // Calculs avancés
    const totalSessions = sessions.length
    const todaySessionsCount = todaySessions.length
    const avgDurationMinutes = totalSessions > 0 ? sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / (totalSessions * 60) : 0
    const totalCostWeek = sessions.reduce((sum, s) => sum + s.total_cost, 0)
    
    // Sessions par heure (aujourd'hui)
    const sessionsByHour = Array(24).fill(0)
    todaySessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours()
      sessionsByHour[hour]++
    })
    
    // Heures de pointe
    const peakHour = sessionsByHour.indexOf(Math.max(...sessionsByHour))
    
    // 🔧 Taux de succès amélioré (sessions sans erreur ET terminées correctement)
    const successfulSessions = sessions.filter(s => 
      (s.error_count === 0 || s.error_count === null) && 
      !s.error_occurred && 
      s.duration_seconds > 0
    ).length
    const successRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 95 // 95% par défaut si pas de données
    
    // Satisfaction moyenne
    const satisfactionScores = sessions.filter(s => s.user_satisfaction !== null)
    const avgSatisfaction = satisfactionScores.length > 0 ? 
      satisfactionScores.reduce((sum, s) => sum + s.user_satisfaction!, 0) / satisfactionScores.length : 0
    
    // Sessions en cours (sessions de moins de 30 minutes sans fin)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const activeSessions = todaySessions.filter(s => 
      s.timestamp > thirtyMinutesAgo && s.status === 'active'
    ).length

    // Dernière activité
    const lastActivity = sessions.length > 0 ? new Date(sessions[0].timestamp) : null
    const lastActivityMinutesAgo = lastActivity ? 
      Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60)) : null
    
    return {
      gymId,
      activeSessions,
      lastActivityMinutesAgo,
      overview: {
        totalSessionsWeek: totalSessions,
        todaySessions: todaySessionsCount,
        activeSessions,
        avgDurationMinutes: Math.round(avgDurationMinutes),
        totalCostWeekUSD: totalCostWeek,
        peakHour,
        successRate: Math.round(successRate),
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10
      },
      hourlyDistribution: sessionsByHour,
      weeklyTrend: await getWeeklyTrend(gymId),
      performance: {
        responseTime: await getAvgResponseTime(gymId),
        errorRate: totalSessions > 0 ? Math.max(0, Math.round((1 - successRate / 100) * 100)) : 0, // ✅ Éviter les valeurs négatives
        popularQuestions: await getPopularQuestions(gymId)
      }
    }
  } catch (error) {
    console.error('❌ [KIOSK SUPERVISION] Erreur complète:', error)
    return null
  }
}

/**
 * 📈 Tendance hebdomadaire
 */
async function getWeeklyTrend(gymId: string) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const metrics = await getDailyCostSummary(date, { gymId })
    days.push({
      date,
      sessions: metrics?.totalSessions || 0,
      cost: metrics?.totalCostUSD || 0
    })
  }
  return days
}

/**
 * ⚡ Temps de réponse moyen
 */
async function getAvgResponseTime(gymId: string): Promise<number> {
  // Simulation - à implémenter avec de vraies métriques de performance
  return Math.round(120 + Math.random() * 80) // 120-200ms simulé
}

/**
 * ❓ Questions populaires
 */
async function getPopularQuestions(gymId: string): Promise<string[]> {
  // Simulation - à implémenter avec analyse des transcripts
  return [
    "Quels sont mes objectifs ?",
    "Comment utiliser cette machine ?", 
    "Quel programme pour moi ?",
    "Horaires de la salle",
    "Tarifs et abonnements"
  ]
} 
