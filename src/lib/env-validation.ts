/**
 * ========================================
 * VALIDATION DES VARIABLES D'ENVIRONNEMENT
 * ========================================
 * Ce fichier valide TOUTES les env vars au démarrage de l'application.
 * Si une variable obligatoire manque → crash immédiat avec message clair.
 *
 * USAGE:
 * ```typescript
 * import { env } from '@/lib/env-validation'
 * 
 * const apiKey = env.OPENAI_API_KEY  // ✅ Typé, validé, garanti présent
 * ```
 */

import { z } from 'zod'

// ========================================
// 1. DÉFINITION DU SCHEMA ZOD
// ========================================

const envSchema = z.object({
  // ===== NEXT.JS =====
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL doit être une URL valide'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ===== SUPABASE =====
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY est obligatoire'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY est obligatoire'),

  // ===== OPENAI =====
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY est obligatoire'),
  OPENAI_ORG_ID: z.string().optional(),

  // ===== RESEND =====
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY est obligatoire'),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // ===== SENTRY =====
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // ===== UPSTASH QSTASH =====
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // ===== HCAPTCHA =====
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),

  // ===== RATE LIMITING =====
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_VOICE_MAX: z.coerce.number().positive().default(30),

  // ===== FEATURE FLAGS =====
  NEXT_PUBLIC_DEBUG_MODE: z.coerce.boolean().default(false),
  NEXT_PUBLIC_VERBOSE_LOGS: z.coerce.boolean().default(false),
  NEXT_PUBLIC_SENTRY_ENABLED: z.coerce.boolean().default(false),
})

// ========================================
// 2. TYPE INFERENCE (TypeScript strict)
// ========================================

export type Env = z.infer<typeof envSchema>

// ========================================
// 3. VALIDATION AU DÉMARRAGE
// ========================================

function validateEnv(): Env {
  try {
    // Parse et valide les env vars
    const parsed = envSchema.parse(process.env)
    
    // Log succès en développement
    if (parsed.NODE_ENV === 'development' && parsed.NEXT_PUBLIC_VERBOSE_LOGS) {
      console.log('✅ [ENV] Toutes les variables d\'environnement sont valides')
    }
    
    return parsed
  } catch (error) {
    // Format l'erreur de manière lisible
    if (error instanceof z.ZodError) {
      console.error('❌ [ENV] Variables d\'environnement invalides:')
      
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      
      console.error('\n💡 Consultez le fichier .env.example pour la configuration complète.')
      
      throw new Error('Configuration environnement invalide. Impossible de démarrer.')
    }
    
    throw error
  }
}

// ========================================
// 4. EXPORT SINGLETON
// ========================================

/**
 * Variables d'environnement validées et typées.
 * 
 * @example
 * ```typescript
 * import { env } from '@/lib/env-validation'
 * 
 * const supabase = createClient(
 *   env.NEXT_PUBLIC_SUPABASE_URL,  // ✅ Typé et validé
 *   env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 * )
 * ```
 */
export const env = validateEnv()

// ========================================
// 5. HELPER FUNCTIONS
// ========================================

/**
 * Vérifie si on est en mode développement
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Vérifie si on est en mode production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Vérifie si on est en mode test
 */
export const isTest = env.NODE_ENV === 'test'

/**
 * Vérifie si Sentry est activé
 */
export const isSentryEnabled = 
  env.NEXT_PUBLIC_SENTRY_ENABLED && 
  !!env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Vérifie si le mode debug est activé
 */
export const isDebugMode = env.NEXT_PUBLIC_DEBUG_MODE

/**
 * Vérifie si les logs verbeux sont activés
 */
export const isVerbose = env.NEXT_PUBLIC_VERBOSE_LOGS
