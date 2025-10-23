/**
 * 🛡️ VALIDATION ET SÉCURITÉ
 * 
 * Validation robuste des inputs pour éviter injections et erreurs
 */

import { z } from 'zod'

// 🎯 UUID Validation
export const uuidSchema = z.string().uuid()

// 📧 Email Validation
export const emailSchema = z.string().email()

// 🏷️ Slug Validation (pour kiosk URLs)
export const slugSchema = z.string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug doit contenir uniquement des lettres minuscules, chiffres et tirets')

// 📱 Badge ID Validation
export const badgeSchema = z.string()
  .min(3)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/i, 'Badge ID format invalide')

// 🎤 Voice Model Validation
export const voiceSchema = z.enum([
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'
])

export const modelSchema = z.enum([
  'gpt-realtime-2025-08-28',           // Full - haute qualité
  'gpt-realtime-mini-2025-10-06',      // Mini - optimisé coût
  'gpt-audio-2025-08-28',              // Audio spécialisé
])

// 👤 User Role Validation
export const roleSchema = z.enum([
  'super_admin', 'franchise_owner', 'franchise_admin', 'manager'
])

// 🏋️ Membership Type Validation
export const membershipSchema = z.enum([
  'basic', 'premium', 'vip', 'student', 'senior'
])

// 📊 Pagination Validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

// 🎯 Session ID Validation (OpenAI format)
export const sessionIdSchema = z.string()
  .regex(/^sess_[a-zA-Z0-9]+$/, 'Format session ID OpenAI invalide')

// 🔐 API Key Validation
export const apiKeySchema = z.string()
  .min(20)
  .regex(/^sk-[a-zA-Z0-9]+$/, 'Format clé API OpenAI invalide')

// 📝 Text Content Validation
export const safeTextSchema = z.string()
  .min(1)
  .max(5000)
  .regex(/^[^<>'"&]*$/, 'Caractères dangereux détectés')

// 🌐 URL Validation
export const urlSchema = z.string().url()

// 📞 Phone Validation (format français)
export const phoneSchema = z.string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Format téléphone français invalide')

// 🎛️ Jarvis Settings Validation
export const jarvisSettingsSchema = z.object({
  personality: z.enum(['friendly', 'professional', 'casual', 'energetic']).default('friendly'),
  humor_level: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  response_length: z.enum(['short', 'medium', 'long']).default('short'),
  language_accent: z.enum(['fr_fr', 'fr_ca', 'en_us', 'en_gb']).default('fr_fr'),
  tone_timebased: z.boolean().default(true),
  emotion_bias: z.enum(['neutral', 'positive', 'empathetic']).default('positive'),
  speaking_pace: z.enum(['slow', 'normal', 'fast']).default('normal'),
  opening_preset: z.enum(['standard', 'energetic', 'casual', 'deadpool_clean']).default('standard'),
  strict_end_rule: z.boolean().default(true),
  model: modelSchema.default('gpt-realtime-mini-2025-10-06'),
  voice: voiceSchema.default('verse')
})

// 🏢 Gym Data Validation
export const gymCreateSchema = z.object({
  name: z.string().min(2).max(100),
  franchise_id: uuidSchema,
  address: z.string().min(5).max(200).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  manager_id: uuidSchema.optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
})

export const gymUpdateSchema = gymCreateSchema.partial()

// 👥 Member Data Validation
export const memberCreateSchema = z.object({
  gym_id: uuidSchema,
  badge_id: badgeSchema,
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneSchema.optional(),
  membership_type: membershipSchema.default('basic'),
  member_since: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
  can_use_jarvis: z.boolean().default(true)
})

export const memberUpdateSchema = memberCreateSchema.partial()

// 💬 Conversation Log Validation
export const conversationLogSchema = z.object({
  session_id: z.string().min(1), // Accept any format for now
  gym_id: uuidSchema,
  member_id: uuidSchema.optional(),
  speaker: z.enum(['user', 'jarvis']),
  message_text: safeTextSchema,
  turn_number: z.number().int().min(1),
  timestamp: z.string().datetime().optional()
})

// 🔍 Search/Filter Validation
export const searchFiltersSchema = z.object({
  query: z.string().max(100).optional(),
  status: z.string().optional(),
  role: roleSchema.optional(),
  membership_type: membershipSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
})

// 🛡️ Utility Functions

/**
 * Sanitize HTML/SQL injection attempts
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, '') // Remove dangerous HTML chars
    .replace(/[;--]/g, '') // Remove SQL injection patterns
    .trim()
}

/**
 * Validate and sanitize badge ID
 */
export function validateBadgeId(badgeId: string): string {
  const sanitized = sanitizeInput(badgeId.toUpperCase())
  const result = badgeSchema.safeParse(sanitized)
  
  if (!result.success) {
    throw new Error(`Badge ID invalide: ${result.error.issues[0].message}`)
  }
  
  return result.data
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): string {
  const result = uuidSchema.safeParse(uuid)
  
  if (!result.success) {
    throw new Error('UUID format invalide')
  }
  
  return result.data
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number) {
  const result = paginationSchema.safeParse({ page, limit })
  
  if (!result.success) {
    throw new Error('Paramètres de pagination invalides')
  }
  
  return result.data
}

/**
 * Validate Jarvis settings
 */
export function validateJarvisSettings(settings: any) {
  const result = jarvisSettingsSchema.safeParse(settings)
  
  if (!result.success) {
    throw new Error(`Configuration Jarvis invalide: ${result.error.issues[0].message}`)
  }
  
  return result.data
}

/**
 * Rate limiting - simple in-memory store (for demo)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const window = rateLimitStore.get(identifier)
  
  if (!window || now > window.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  
  if (window.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  
  window.count++
  return { allowed: true, remaining: maxRequests - window.count }
}

export default {
  uuidSchema,
  emailSchema,
  slugSchema,
  badgeSchema,
  voiceSchema,
  modelSchema,
  roleSchema,
  membershipSchema,
  paginationSchema,
  sessionIdSchema,
  apiKeySchema,
  safeTextSchema,
  urlSchema,
  phoneSchema,
  jarvisSettingsSchema,
  gymCreateSchema,
  gymUpdateSchema,
  memberCreateSchema,
  memberUpdateSchema,
  conversationLogSchema,
  searchFiltersSchema,
  sanitizeInput,
  validateBadgeId,
  validateUuid,
  validatePagination,
  validateJarvisSettings,
  checkRateLimit
}
