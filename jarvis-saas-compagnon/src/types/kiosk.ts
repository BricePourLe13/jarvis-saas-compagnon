// ===========================================
// 🤖 JARVIS KIOSK - Types TypeScript
// ===========================================

// ===========================================
// 🎫 GYM MEMBERS
// ===========================================

export interface MemberPreferences {
  language: 'fr' | 'en' | 'es'
  goals: string[]
  dietary_restrictions: string[]
  favorite_activities: string[]
  notification_preferences: {
    email: boolean
    sms: boolean
  }
}

export interface GymMember {
  id: string
  gym_id: string
  
  // Badge RFID
  badge_id: string
  
  // Informations personnelles
  first_name: string
  last_name: string
  email?: string
  phone?: string
  
  // Membership
  membership_type: string
  member_since: string
  membership_expires?: string
  
  // Contexte JARVIS
  member_preferences: MemberPreferences
  
  // Stats
  total_visits: number
  last_visit?: string
  member_notes?: string
  
  // Status
  is_active: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ===========================================
// 🤖 KIOSK CONFIG
// ===========================================

export interface KioskConfig {
  // Provisioning
  provisioning_code?: string | null
  kiosk_url_slug?: string | null
  installation_token?: string | null
  provisioning_expires_at?: string | null
  is_provisioned: boolean
  provisioned_at?: string | null
  
  // Hardware
  last_heartbeat?: string | null
  rfid_reader_id?: string | null
  screen_resolution?: string | null
  browser_info?: Record<string, unknown>
  
  // UI & Avatar
  avatar_style: 'friendly' | 'professional' | 'energetic'
  welcome_message: string
  language_default: 'fr' | 'en' | 'es'
  languages_available: ('fr' | 'en' | 'es')[]
  
  // Branding (hérité de la franchise)
  brand_colors?: {
    primary: string
    secondary: string
    accent: string
  }
}

// ===========================================
// 🗣️ JARVIS SESSIONS
// ===========================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  audio_duration?: number
}

export interface JarvisSessionExtended {
  id: string
  gym_id: string
  member_id?: string
  
  // Conversation
  member_badge_id?: string
  conversation_transcript: ConversationMessage[]
  language: 'fr' | 'en' | 'es'
  
  // AI Analysis
  intent_detected: string[]
  sentiment_score?: number // -1.00 à 1.00
  satisfaction_score?: number // 1-5
  conversation_summary?: string
  
  // Technical
  session_duration: number // en secondes
  kiosk_url_slug?: string
  processed_by_ai: boolean
  
  // Metadata
  timestamp: string
  session_metadata: Record<string, unknown>
}

// ===========================================
// 🎯 KIOSK STATE & INTERFACE
// ===========================================

export interface KioskState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'scanning' | 'authenticated' | 'loading'
  isOnline: boolean
  currentMember?: GymMember | null
  currentSession?: JarvisSessionExtended | null
  audioEnabled: boolean
  rfidEnabled: boolean
  lastActivity: number
  sessionDuration: number
  hardware: HardwareStatus
}

export interface KioskProps {
  gymSlug: string
  gymData?: {
    id: string
    name: string
    franchise_name: string
    kiosk_config: KioskConfig
  }
}

// ===========================================
// 🎨 AVATAR ANIMATIONS
// ===========================================

export interface AvatarAnimation {
  type: 'idle' | 'listening' | 'thinking' | 'speaking'
  duration?: number
  intensity?: 'low' | 'medium' | 'high'
}

export interface AvatarState {
  currentAnimation: AvatarAnimation
  visualLevel: number // 0-100 for audio visualization
  isVisible: boolean
}

// ===========================================
// 🔊 AUDIO & VOICE
// ===========================================

export interface VoiceSettings {
  language: 'fr' | 'en' | 'es'
  voice: string // OpenAI voice ID
  speed: number
  pitch: number
  volume: number
}

export interface AudioState {
  isRecording: boolean
  isPlaying: boolean
  micPermission: 'granted' | 'denied' | 'prompt'
  audioLevel: number // 0-100
  error?: string
}

// ===========================================
// 📱 RFID & HARDWARE
// ===========================================

export interface RFIDEvent {
  badge_id: string
  reader_id?: string
  timestamp: string
  signal_strength?: number
}

export interface HardwareStatus {
  rfid_reader: 'connected' | 'disconnected' | 'error'
  microphone: 'available' | 'unavailable' | 'permission_denied'
  speakers: 'available' | 'unavailable'
  network: 'online' | 'offline' | 'slow'
}

// ===========================================
// 🌐 API RESPONSES
// ===========================================

export interface KioskValidationResponse {
  valid?: boolean
  gym?: {
    id: string
    name: string
    franchise_name: string
    kiosk_config: KioskConfig
  }
  kiosk?: {
    id: string
    name: string
    status: string
    location: string
    version: string
  }
  error?: string
}

// Interface étendue pour données gym dans kiosk
export interface ExtendedGymData {
  name: string
  slug: string
  location: string
  status: string
  opening_hours: string
  phone: string
}

// Interface pour réponse validation kiosk étendue
export interface ExtendedKioskValidationResponse {
  gym: ExtendedGymData
  kiosk: {
    id: string
    name: string
    status: string
    location: string
    version: string
  }
}

export interface MemberLookupResponse {
  found: boolean
  member?: GymMember
  context?: {
    last_session?: JarvisSessionExtended
    visit_count_today: number
    last_visit_days_ago?: number
  }
  error?: string
}

export interface SessionCreateResponse {
  success: boolean
  session_id?: string
  error?: string
}

// ===========================================
// 🎭 UI COMPONENTS
// ===========================================

export interface KioskButtonProps {
  variant: 'primary' | 'secondary' | 'danger'
  size: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  icon?: React.ComponentType
  children: React.ReactNode
  onClick?: () => void
}

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error'
  label: string
  details?: string
}

// ===========================================
// 📊 ANALYTICS (pour plus tard)
// ===========================================

export interface KioskAnalytics {
  daily_sessions: number
  average_session_duration: number
  top_member_requests: string[]
  satisfaction_average: number
  language_distribution: Record<string, number>
  peak_hours: number[]
} 