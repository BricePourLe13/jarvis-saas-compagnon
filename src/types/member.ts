// ===========================================
// 🗄️ JARVIS DATABASE - Member Types (v2)
// ===========================================
// Basé sur les nouvelles tables normalisées:
// - gym_members_v2
// - member_fitness_profile
// - member_preferences
// - member_facts
// - member_analytics
// ===========================================

// ===========================================
// 🏃 GYM_MEMBERS_V2 (Core Profile - 15 colonnes)
// ===========================================

export interface GymMemberCore {
  id: string
  gym_id: string
  
  // Identité
  badge_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null // Date ISO string
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  profile_photo_url: string | null
  
  // Abonnement
  membership_type: string // 'standard', 'premium', 'elite', etc.
  member_since: string // Date ISO string
  membership_expires: string | null // Date ISO string
  is_active: boolean
  
  // Métadonnées
  created_at: string
  updated_at: string
}

// ===========================================
// 💪 MEMBER_FITNESS_PROFILE (Module optionnel)
// ===========================================

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type WorkoutStyle = 'strength' | 'cardio' | 'mixed' | 'flexibility' | 'sport'

export interface MemberFitnessProfile {
  member_id: string
  
  // Physical metrics
  height_cm: number | null
  current_weight_kg: number | null
  target_weight_kg: number | null
  body_fat_percentage: number | null
  
  // Fitness level & goals
  fitness_level: FitnessLevel | null
  primary_goals: string[] // ['perte_poids', 'muscle', 'endurance', etc.]
  target_date: string | null // Date ISO string
  
  // Workout preferences
  preferred_workout_times: {
    morning: boolean
    afternoon: boolean
    evening: boolean
  }
  workout_frequency_per_week: number // 0-7
  preferred_workout_duration: number // minutes
  preferred_workout_style: WorkoutStyle | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ===========================================
// 🎨 MEMBER_PREFERENCES (Préférences JARVIS)
// ===========================================

export type CommunicationStyle = 'encouraging' | 'direct' | 'friendly' | 'patient' | 'energetic' | 'calm'
export type FeedbackStyle = 'motivating' | 'technical' | 'gentle' | 'challenging'
export type Language = 'fr' | 'en' | 'es' | 'de' | 'it'

export interface MemberPreferences {
  member_id: string
  
  // Communication style
  communication_style: CommunicationStyle
  feedback_style: FeedbackStyle
  
  // JARVIS configuration
  language: Language
  voice_preference: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ===========================================
// 🧠 MEMBER_FACTS (Mémoire structurée)
// ===========================================

export type FactCategory = 'goal' | 'injury' | 'preference' | 'progress' | 'concern'

export interface MemberFact {
  id: string
  member_id: string
  
  // Classification
  category: FactCategory
  fact_key: string
  fact_value: Record<string, any> // JSONB
  
  // Metadata
  confidence: number // 0.0-1.0
  source_session_id: string | null
  source_quote: string | null
  is_active: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
  expires_at: string | null // NULL = permanent
}

// Exemples de fact_value structures
export interface GoalFact {
  goal_type: 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility'
  target_value: number
  target_unit: string
  deadline: string | null
  progress: number // 0-100%
}

export interface InjuryFact {
  location: string
  severity: 'low' | 'moderate' | 'high'
  since: string // Date ISO
  exercises_to_avoid: string[]
  medical_approval_needed: boolean
}

// ===========================================
// 📊 MEMBER_ANALYTICS (Métriques calculées)
// ===========================================

export type ConversationFrequency = 'daily' | 'weekly' | 'monthly' | 'rare'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type SentimentTrend = 'improving' | 'stable' | 'declining'
export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface MemberAnalytics {
  member_id: string
  
  // Engagement metrics
  total_conversations: number
  total_sessions: number
  avg_session_duration_seconds: number | null
  last_interaction_at: string | null
  conversation_frequency: ConversationFrequency | null
  
  // Patterns
  preferred_days_of_week: number[] | null // [1,3,5] = lundi/mercredi/vendredi
  preferred_time_of_day: TimeOfDay | null
  
  // Sentiment tracking
  avg_sentiment_score: number | null // -1.0 to 1.0
  sentiment_trend: SentimentTrend | null
  
  // Churn prediction
  churn_risk_score: number | null // 0.0-1.0
  churn_risk_level: ChurnRiskLevel | null
  churn_factors: Record<string, any> | null // JSONB
  last_churn_analysis_at: string | null
  
  // Goals
  active_goals_count: number
  goals_achievement_rate: number | null // 0.0-1.0
  
  updated_at: string
}

// ===========================================
// 🚨 MANAGER_ALERTS (Alertes intelligentes)
// ===========================================

export type AlertType = 
  | 'churn_risk'
  | 'equipment_issue'
  | 'member_achievement'
  | 'negative_feedback'
  | 'health_concern'
  | 'goal_milestone'

export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent'
export type AlertStatus = 'pending' | 'in_progress' | 'resolved' | 'dismissed'

export interface ManagerAlert {
  id: string
  gym_id: string
  member_id: string | null
  
  // Alert
  alert_type: AlertType
  priority: AlertPriority
  title: string
  description: string | null
  
  // Action
  recommended_actions: Array<{
    action: string
    reason: string
  }> | null
  status: AlertStatus
  
  // Resolution
  resolved_by: string | null // user_id
  resolved_at: string | null
  resolution_notes: string | null
  
  created_at: string
}

// ===========================================
// 📈 INSIGHTS_REPORTS (Rapports automatiques)
// ===========================================

export type ReportType =
  | 'daily_summary'
  | 'weekly_digest'
  | 'monthly_analysis'
  | 'churn_forecast'
  | 'member_satisfaction'

export interface InsightsReport {
  id: string
  gym_id: string
  
  // Report
  report_type: ReportType
  title: string
  summary: string | null
  insights: Record<string, any> | null // JSONB
  metrics: Record<string, any> | null // JSONB
  recommendations: Array<{
    title: string
    description: string
    priority: AlertPriority
  }> | null
  
  // Period
  generated_at: string
  period_start: string | null // Date ISO
  period_end: string | null // Date ISO
}

// ===========================================
// 💬 CONVERSATION_SUMMARY (RAG System)
// ===========================================

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed'

export interface ConversationSummary {
  id: string
  session_id: string
  member_id: string
  gym_id: string
  
  // Summary
  summary_text: string
  key_topics: string[] | null
  sentiment: SentimentType | null
  sentiment_score: number | null // -1.0 to 1.0
  
  // RAG: pgvector embeddings (1536D - OpenAI text-embedding-3-small)
  embedding: number[] | null // vector(1536)
  
  // Metadata
  session_duration_seconds: number | null
  turn_count: number | null
  
  created_at: string
}

// ===========================================
// 📝 CONVERSATION_EVENT (Événements bruts)
// ===========================================

export type ConversationEventType =
  | 'user_speech_start'
  | 'user_speech_end'
  | 'user_transcript'
  | 'ai_speech_start'
  | 'ai_speech_end'
  | 'ai_transcript'
  | 'tool_call'
  | 'tool_result'
  | 'error'

export interface ConversationEvent {
  id: string
  session_id: string
  member_id: string | null
  gym_id: string | null
  
  // Event
  event_type: ConversationEventType
  
  // Data
  transcript: string | null
  tool_name: string | null
  tool_args: Record<string, any> | null // JSONB
  tool_result: Record<string, any> | null // JSONB
  
  // Metadata
  turn_number: number | null
  audio_duration_ms: number | null
  confidence_score: number | null
  
  timestamp: string
}

// ===========================================
// 🔗 TYPES COMPOSÉS (avec JOIN)
// ===========================================

/**
 * Type complet incluant core + modules optionnels
 * Utilisé pour récupérer un profil membre complet avec JOIN Supabase
 */
export interface GymMemberComplete extends GymMemberCore {
  fitness_profile?: MemberFitnessProfile
  preferences?: MemberPreferences
  analytics?: MemberAnalytics
  facts?: MemberFact[]
}

/**
 * Type pour contexte agent JARVIS
 * Inclut toutes les données nécessaires pour personnaliser les conversations
 */
export interface JarvisContext {
  member: GymMemberComplete
  recent_facts: MemberFact[]
  conversation_history: ConversationSummary[]
  active_alerts: ManagerAlert[]
}

// ===========================================
// 📥 INPUT TYPES (pour création/mise à jour)
// ===========================================

export type CreateGymMember = Omit<GymMemberCore, 'id' | 'created_at' | 'updated_at'>
export type UpdateGymMember = Partial<Omit<GymMemberCore, 'id' | 'gym_id' | 'badge_id' | 'created_at' | 'updated_at'>>

export type CreateMemberFitnessProfile = Omit<MemberFitnessProfile, 'created_at' | 'updated_at'>
export type UpdateMemberFitnessProfile = Partial<Omit<MemberFitnessProfile, 'member_id' | 'created_at' | 'updated_at'>>

export type CreateMemberPreferences = Omit<MemberPreferences, 'created_at' | 'updated_at'>
export type UpdateMemberPreferences = Partial<Omit<MemberPreferences, 'member_id' | 'created_at' | 'updated_at'>>

export type CreateMemberFact = Omit<MemberFact, 'id' | 'created_at' | 'updated_at'>
export type UpdateMemberFact = Partial<Omit<MemberFact, 'id' | 'member_id' | 'created_at' | 'updated_at'>>

