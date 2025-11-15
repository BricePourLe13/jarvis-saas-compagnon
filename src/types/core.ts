// ===========================================
// 🤖 JARVIS SaaS - Types TypeScript Core
// Architecture Simplifiée : Admin → Gym → Kiosk
// VERSION MVP (sans franchises)
// ===========================================

// ===========================================
// 👥 USER TYPES
// ===========================================

export type UserRole = 'super_admin' | 'gym_manager'

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  reports_frequency: 'daily' | 'weekly' | 'monthly'
}

export interface User {
  id: string
  email: string
  full_name: string
  
  // Role & Access
  role: UserRole
  
  // Scope (pour gym_manager)
  gym_access?: string[]
  
  // Preferences
  dashboard_preferences?: Record<string, unknown>
  notification_settings?: NotificationSettings
  
  // Status
  is_active: boolean
  last_login?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Invitation
  invitation_status?: 'pending' | 'accepted' | 'expired'
  invited_at?: string
}

export interface UserCreateRequest {
  email: string
  full_name: string
  role: UserRole
  gym_access?: string[]
  send_invitation?: boolean
}

export interface UserInvitation {
  email: string
  full_name: string
  role: UserRole
  gym_id?: string
  invited_by: string
  expires_at: string
}

// ===========================================
// 🏋️ GYM TYPES
// ===========================================

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
}

export interface KioskConfig {
  // Provisioning (Liaison Kiosk → Salle)
  provisioning_code?: string
  kiosk_url_slug?: string
  installation_token?: string
  provisioning_expires_at?: string
  
  // Status
  is_provisioned: boolean
  provisioned_at?: string
  last_heartbeat?: string
  
  // Hardware
  rfid_reader_id?: string
  screen_resolution?: string
  browser_info?: Record<string, unknown>
  
  // Configuration
  avatar_style: 'friendly' | 'professional' | 'energetic'
  welcome_message: string
  brand_colors?: BrandColors
  
  // Jarvis runtime config
  jarvis_instructions?: string
  jarvis_model?: string
  jarvis_voice?: string
  config_version?: number
  config_updated_at?: string
  last_published_at?: string
}

export interface OpeningHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  open: string // "06:00"
  close: string // "22:00"
  is_closed: boolean
}

export interface Gym {
  id: string
  
  // Basic Information
  name: string
  
  // Location
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // JARVIS Equipment & Kiosk Linking
  kiosk_config: KioskConfig | null // JSON field
  
  // Management
  manager_id?: string
  
  // Business
  opening_hours: unknown // JSON field
  features: string[] // Array field
  
  // Status
  status: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Legacy (si franchise existait avant)
  legacy_franchise_name?: string
}

export interface GymCreateRequest {
  name: string
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // Manager Information (optional)
  manager_email?: string
  manager_full_name?: string
  send_invitation?: boolean
  
  // Business Info
  opening_hours?: OpeningHours[]
  
  // JARVIS Configuration
  avatar_style?: 'friendly' | 'professional' | 'energetic'
  welcome_message?: string
}

export interface GymUpdateRequest {
  name?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  manager_id?: string
  opening_hours?: OpeningHours[]
  kiosk_config?: Partial<KioskConfig>
  status?: 'active' | 'maintenance' | 'offline'
}

// ===========================================
// 🤖 JARVIS SESSION TYPES
// ===========================================

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface JarvisSession {
  id: string
  gym_id: string
  
  // Member interaction
  member_badge_id?: string
  conversation_transcript: ConversationMessage[]
  
  // AI Analysis
  intent_detected: string[]
  sentiment_score?: number // -1.00 à 1.00
  satisfaction_rating?: number // 1-5
  
  // Technical
  session_duration: number // En secondes
  kiosk_url_slug?: string
  processed_by_ai: boolean
  
  // Metadata
  timestamp: string
  session_metadata?: Record<string, unknown>
}

// ===========================================
// 📊 ANALYTICS TYPES
// ===========================================

export interface AnalyticsDaily {
  id: string
  
  // Scope
  gym_id?: string
  date: string
  
  // Metrics
  total_conversations: number
  total_duration: number // Secondes totales
  average_satisfaction?: number
  unique_members: number
  peak_hour?: number // Heure de pointe (0-23)
  
  // AI Insights
  top_intents: string[]
  sentiment_distribution?: Record<string, number>
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_conversations: number
  average_satisfaction: number
  unique_members: number
  trending_topics: string[]
  satisfaction_trend: number // Pourcentage de changement
}

export interface GymPerformanceMetrics {
  gym_id: string
  gym_name: string
  daily_conversations: number
  satisfaction_score: number
  member_engagement: number
  status: 'excellent' | 'good' | 'needs_attention'
}

// ===========================================
// 🎯 API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface KioskProvisioningInfo {
  provisioning_code: string
  kiosk_url: string
  installation_token: string
  expires_at: string
  setup_instructions: string
}

// ===========================================
// 🔧 UTILITY TYPES
// ===========================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: unknown, item: T) => React.ReactNode
}

export interface FilterOptions {
  status?: string[]
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

// ===========================================
// 🎨 UI COMPONENT TYPES
// ===========================================

export interface GymCardProps {
  gym: Gym
  metrics?: GymPerformanceMetrics
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  showKioskStatus?: boolean
}

export interface ProvisioningModalProps {
  gym: Gym
  provisioningInfo: KioskProvisioningInfo
  isOpen: boolean
  onClose: () => void
}

// ===========================================
// 🔍 SEARCH & FILTER TYPES
// ===========================================

export interface GymFilters {
  status?: 'active' | 'maintenance' | 'offline'
  manager_id?: string
  is_provisioned?: boolean
  search?: string
}

export interface SessionFilters {
  gym_id?: string
  date_range?: {
    start: string
    end: string
  }
  min_satisfaction?: number
  has_badge?: boolean
  intents?: string[]
}

// ===========================================
// 📱 FORM TYPES
// ===========================================

export interface GymFormData {
  name: string
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // Manager
  create_manager: boolean
  manager_email: string
  manager_full_name: string
  send_invitation: boolean
  
  // Configuration
  avatar_style: 'friendly' | 'professional' | 'energetic'
  welcome_message: string
  
  // Hours
  opening_hours: OpeningHours[]
}

// ===========================================
// ✅ ALL TYPES EXPORTED
// ===========================================



// 🤖 JARVIS SaaS - Types TypeScript Core
// Architecture Simplifiée : Admin → Gym → Kiosk
// VERSION MVP (sans franchises)
// ===========================================

// ===========================================
// 👥 USER TYPES
// ===========================================

export type UserRole = 'super_admin' | 'gym_manager'

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  reports_frequency: 'daily' | 'weekly' | 'monthly'
}

export interface User {
  id: string
  email: string
  full_name: string
  
  // Role & Access
  role: UserRole
  
  // Scope (pour gym_manager)
  gym_access?: string[]
  
  // Preferences
  dashboard_preferences?: Record<string, unknown>
  notification_settings?: NotificationSettings
  
  // Status
  is_active: boolean
  last_login?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Invitation
  invitation_status?: 'pending' | 'accepted' | 'expired'
  invited_at?: string
}

export interface UserCreateRequest {
  email: string
  full_name: string
  role: UserRole
  gym_access?: string[]
  send_invitation?: boolean
}

export interface UserInvitation {
  email: string
  full_name: string
  role: UserRole
  gym_id?: string
  invited_by: string
  expires_at: string
}

// ===========================================
// 🏋️ GYM TYPES
// ===========================================

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
}

export interface KioskConfig {
  // Provisioning (Liaison Kiosk → Salle)
  provisioning_code?: string
  kiosk_url_slug?: string
  installation_token?: string
  provisioning_expires_at?: string
  
  // Status
  is_provisioned: boolean
  provisioned_at?: string
  last_heartbeat?: string
  
  // Hardware
  rfid_reader_id?: string
  screen_resolution?: string
  browser_info?: Record<string, unknown>
  
  // Configuration
  avatar_style: 'friendly' | 'professional' | 'energetic'
  welcome_message: string
  brand_colors?: BrandColors
  
  // Jarvis runtime config
  jarvis_instructions?: string
  jarvis_model?: string
  jarvis_voice?: string
  config_version?: number
  config_updated_at?: string
  last_published_at?: string
}

export interface OpeningHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  open: string // "06:00"
  close: string // "22:00"
  is_closed: boolean
}

export interface Gym {
  id: string
  
  // Basic Information
  name: string
  
  // Location
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // JARVIS Equipment & Kiosk Linking
  kiosk_config: KioskConfig | null // JSON field
  
  // Management
  manager_id?: string
  
  // Business
  opening_hours: unknown // JSON field
  features: string[] // Array field
  
  // Status
  status: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Legacy (si franchise existait avant)
  legacy_franchise_name?: string
}

export interface GymCreateRequest {
  name: string
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // Manager Information (optional)
  manager_email?: string
  manager_full_name?: string
  send_invitation?: boolean
  
  // Business Info
  opening_hours?: OpeningHours[]
  
  // JARVIS Configuration
  avatar_style?: 'friendly' | 'professional' | 'energetic'
  welcome_message?: string
}

export interface GymUpdateRequest {
  name?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  manager_id?: string
  opening_hours?: OpeningHours[]
  kiosk_config?: Partial<KioskConfig>
  status?: 'active' | 'maintenance' | 'offline'
}

// ===========================================
// 🤖 JARVIS SESSION TYPES
// ===========================================

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface JarvisSession {
  id: string
  gym_id: string
  
  // Member interaction
  member_badge_id?: string
  conversation_transcript: ConversationMessage[]
  
  // AI Analysis
  intent_detected: string[]
  sentiment_score?: number // -1.00 à 1.00
  satisfaction_rating?: number // 1-5
  
  // Technical
  session_duration: number // En secondes
  kiosk_url_slug?: string
  processed_by_ai: boolean
  
  // Metadata
  timestamp: string
  session_metadata?: Record<string, unknown>
}

// ===========================================
// 📊 ANALYTICS TYPES
// ===========================================

export interface AnalyticsDaily {
  id: string
  
  // Scope
  gym_id?: string
  date: string
  
  // Metrics
  total_conversations: number
  total_duration: number // Secondes totales
  average_satisfaction?: number
  unique_members: number
  peak_hour?: number // Heure de pointe (0-23)
  
  // AI Insights
  top_intents: string[]
  sentiment_distribution?: Record<string, number>
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_conversations: number
  average_satisfaction: number
  unique_members: number
  trending_topics: string[]
  satisfaction_trend: number // Pourcentage de changement
}

export interface GymPerformanceMetrics {
  gym_id: string
  gym_name: string
  daily_conversations: number
  satisfaction_score: number
  member_engagement: number
  status: 'excellent' | 'good' | 'needs_attention'
}

// ===========================================
// 🎯 API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface KioskProvisioningInfo {
  provisioning_code: string
  kiosk_url: string
  installation_token: string
  expires_at: string
  setup_instructions: string
}

// ===========================================
// 🔧 UTILITY TYPES
// ===========================================

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: unknown, item: T) => React.ReactNode
}

export interface FilterOptions {
  status?: string[]
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

// ===========================================
// 🎨 UI COMPONENT TYPES
// ===========================================

export interface GymCardProps {
  gym: Gym
  metrics?: GymPerformanceMetrics
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  showKioskStatus?: boolean
}

export interface ProvisioningModalProps {
  gym: Gym
  provisioningInfo: KioskProvisioningInfo
  isOpen: boolean
  onClose: () => void
}

// ===========================================
// 🔍 SEARCH & FILTER TYPES
// ===========================================

export interface GymFilters {
  status?: 'active' | 'maintenance' | 'offline'
  manager_id?: string
  is_provisioned?: boolean
  search?: string
}

export interface SessionFilters {
  gym_id?: string
  date_range?: {
    start: string
    end: string
  }
  min_satisfaction?: number
  has_badge?: boolean
  intents?: string[]
}

// ===========================================
// 📱 FORM TYPES
// ===========================================

export interface GymFormData {
  name: string
  address: string
  city: string
  postal_code: string
  phone?: string
  
  // Manager
  create_manager: boolean
  manager_email: string
  manager_full_name: string
  send_invitation: boolean
  
  // Configuration
  avatar_style: 'friendly' | 'professional' | 'energetic'
  welcome_message: string
  
  // Hours
  opening_hours: OpeningHours[]
}

// ===========================================
// ✅ ALL TYPES EXPORTED
// ===========================================



