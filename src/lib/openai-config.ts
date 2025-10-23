/**
 * 🎙️ CONFIGURATION CENTRALISÉE OPENAI REALTIME
 * 
 * IMPORTANT:
 * - Tous les modèles et configurations audio sont définis ici
 * - Les valeurs par défaut utilisent les derniers modèles stables (2025)
 * - Modifiable via variables d'environnement pour flexibilité
 * 
 * USAGE:
 * ```typescript
 * import { OPENAI_CONFIG } from '@/lib/openai-config'
 * 
 * const sessionConfig = {
 *   model: OPENAI_CONFIG.models.production,
 *   voice: OPENAI_CONFIG.voices.production,
 *   // ...
 * }
 * ```
 * 
 * @version 2.0.0
 * @date 2025-10-22
 */

export const OPENAI_CONFIG = {
  /**
   * 🤖 MODÈLES REALTIME
   * 
   * - production: Optimisé coût/qualité pour usage quotidien
   * - vitrine: Meilleure qualité pour démos commerciales
   * - audio: Modèle spécialisé audio (à tester)
   */
  models: {
    /**
     * Modèle production (kiosques, app mobile)
     * - Mini = optimisé coût
     * - Bonne qualité pour fitness coaching
     * - Latence <800ms
     */
    production: process.env.OPENAI_REALTIME_MODEL_PROD || 'gpt-realtime-mini-2025-10-06',
    
    /**
     * Modèle vitrine (démos commerciales, landing page)
     * - Full = meilleure qualité
     * - Latence <600ms
     * - Impression professionnelle
     */
    vitrine: process.env.OPENAI_REALTIME_MODEL_VITRINE || 'gpt-realtime-2025-08-28',
    
    /**
     * Modèle audio spécialisé (à évaluer)
     * - Potentiellement optimisé pour audio-only
     * - À tester pour coût/qualité
     */
    audio: process.env.OPENAI_REALTIME_MODEL_AUDIO || 'gpt-audio-2025-08-28',
  },

  /**
   * 🎤 VOIX TTS
   * 
   * Voix testées et validées pour le français:
   * - verse: Optimisée français (naturelle, expressive)
   * - alloy: Voix masculine énergique (alternative)
   * - ballad, coral, sage: Autres options (à tester)
   */
  voices: {
    /**
     * Voix production
     * - verse = voix française optimisée
     * - Ton naturel et bienveillant pour coaching
     */
    production: (process.env.OPENAI_VOICE_PROD || 'verse') as OpenAIVoice,
    
    /**
     * Voix vitrine
     * - alloy = voix masculine dynamique
     * - Ton commercial et énergique
     */
    vitrine: (process.env.OPENAI_VOICE_VITRINE || 'alloy') as OpenAIVoice,
    
    /**
     * Voix fallback (si voix principale indisponible)
     */
    fallback: (process.env.OPENAI_VOICE_FALLBACK || 'alloy') as OpenAIVoice,
  },

  /**
   * 🎧 CONFIGURATION AUDIO
   * 
   * Format optimisé pour WebRTC et faible latence
   */
  audio: {
    /**
     * Format d'entrée (microphone)
     * - pcm16 = 16-bit PCM (standard WebRTC)
     * - 16kHz mono
     */
    inputFormat: 'pcm16' as const,
    
    /**
     * Format de sortie (haut-parleurs)
     * - pcm16 = 16-bit PCM (standard WebRTC)
     * - 16kHz mono
     */
    outputFormat: 'pcm16' as const,
    
    /**
     * Taux d'échantillonnage
     * - 16kHz = bon compromis qualité/bande passante
     * - Compatible avec tous les navigateurs modernes
     */
    sampleRate: 16000,
  },

  /**
   * 🎙️ VOICE ACTIVITY DETECTION (VAD)
   * 
   * Configuration server-side VAD pour détection de parole
   */
  vad: {
    /**
     * Type de VAD
     * - server_vad = détection côté serveur OpenAI (recommandé)
     * - Évite la charge CPU client
     */
    type: 'server_vad' as const,
    
    /**
     * Seuil de détection
     * - 0.5 = équilibré (ni trop sensible, ni trop sourd)
     * - Range: 0.0 (très sensible) à 1.0 (très sourd)
     */
    threshold: 0.5,
    
    /**
     * Padding avant la parole (ms)
     * - 300ms = capture le début de mots
     * - Évite de couper le premier phonème
     */
    prefixPaddingMs: 300,
    
    /**
     * Durée de silence pour fin de tour (PRODUCTION)
     * - 500ms = réactif pour coaching fitness
     * - Bon compromis vitesse/confort
     */
    silenceDurationMs: 500,
    
    /**
     * Durée de silence pour fin de tour (DÉMO/VITRINE)
     * - 1200ms = plus tolérant pour hésitations commerciales
     * - Évite interruptions gênantes en démo
     */
    silenceDurationMsDemo: 1200,
    
    /**
     * Autoriser interruptions utilisateur
     * - true = utilisateur peut couper JARVIS (naturel)
     * - false = JARVIS finit toujours sa phrase
     */
    interruptResponse: true,
    
    /**
     * Créer réponse automatiquement après détection
     * - true = LLM génère réponse dès silence détecté
     * - false = requiert trigger manuel (pas recommandé)
     */
    createResponse: true,
  },

  /**
   * 📡 URLS API OPENAI
   */
  api: {
    /**
     * URL création session ephemeral
     */
    sessions: 'https://api.openai.com/v1/realtime/sessions',
    
    /**
     * URL WebRTC realtime (avec query param model)
     */
    realtime: 'https://api.openai.com/v1/realtime',
    
    /**
     * Header beta requis pour API Realtime
     */
    betaHeader: 'realtime=v1',
  },

  /**
   * ⚙️ CONFIGURATION SESSION PAR DÉFAUT
   * 
   * Utilisé comme base pour toutes les sessions
   */
  session: {
    /**
     * Température du LLM
     * - 0.8 = créatif sans être trop aléatoire
     * - Range: 0.0 (déterministe) à 2.0 (très créatif)
     */
    temperature: 0.8,
    
    /**
     * Tokens max de sortie
     * - 4096 = permet réponses détaillées si besoin
     * - JARVIS reste concis naturellement (via instructions)
     */
    maxResponseOutputTokens: 4096,
    
    /**
     * Modèle de transcription (STT intégré)
     * - whisper-1 = modèle OpenAI Whisper standard
     * - Très bon pour le français
     */
    transcriptionModel: 'whisper-1',
  },
} as const

/**
 * 🎭 TYPES TYPESCRIPT
 */

/**
 * Voix disponibles dans OpenAI Realtime API
 * 
 * Source: https://platform.openai.com/docs/guides/realtime
 * 
 * - alloy: Voix neutre, énergique
 * - ash: Voix masculine mature (nouvelle)
 * - ballad: Voix douce, chaleureuse
 * - coral: Voix féminine expressive
 * - echo: Voix masculine (classique)
 * - sage: Voix mûre, autoritaire
 * - shimmer: Voix douce, calme
 * - verse: Voix optimisée français (recommandée FR)
 */
export type OpenAIVoice = 
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'sage'
  | 'shimmer'
  | 'verse'

/**
 * Modèles Realtime disponibles
 */
export type OpenAIRealtimeModel = 
  | 'gpt-realtime-2025-08-28'           // Full - haute qualité
  | 'gpt-realtime-mini-2025-10-06'      // Mini - optimisé coût
  | 'gpt-audio-2025-08-28'              // Audio spécialisé

/**
 * Types de contexte (production vs vitrine)
 */
export type OpenAIContext = 'production' | 'vitrine' | 'audio'

/**
 * 🔧 HELPER FUNCTIONS
 */

/**
 * Récupérer configuration pour un contexte spécifique
 * 
 * @param context Type de session (production, vitrine, audio)
 * @returns Configuration complète pour ce contexte
 * 
 * @example
 * ```typescript
 * const config = getConfigForContext('production')
 * // config.model = 'gpt-realtime-mini-2025-10-06'
 * // config.voice = 'verse'
 * // config.vad.silenceDurationMs = 500
 * ```
 */
export function getConfigForContext(context: OpenAIContext) {
  const isDemo = context === 'vitrine'
  
  return {
    model: OPENAI_CONFIG.models[context],
    voice: context === 'production' ? OPENAI_CONFIG.voices.production : OPENAI_CONFIG.voices.vitrine,
    input_audio_format: OPENAI_CONFIG.audio.inputFormat,
    output_audio_format: OPENAI_CONFIG.audio.outputFormat,
    turn_detection: {
      type: OPENAI_CONFIG.vad.type,
      threshold: OPENAI_CONFIG.vad.threshold,
      prefix_padding_ms: OPENAI_CONFIG.vad.prefixPaddingMs,
      silence_duration_ms: isDemo ? OPENAI_CONFIG.vad.silenceDurationMsDemo : OPENAI_CONFIG.vad.silenceDurationMs,
      interrupt_response: OPENAI_CONFIG.vad.interruptResponse,
      create_response: OPENAI_CONFIG.vad.createResponse,
    },
    input_audio_transcription: {
      model: OPENAI_CONFIG.session.transcriptionModel,
    },
    temperature: OPENAI_CONFIG.session.temperature,
    max_response_output_tokens: OPENAI_CONFIG.session.maxResponseOutputTokens,
  }
}

/**
 * Construire URL WebRTC avec modèle
 * 
 * @param context Type de session
 * @returns URL complète pour connexion WebRTC
 * 
 * @example
 * ```typescript
 * const url = getRealtimeURL('production')
 * // 'https://api.openai.com/v1/realtime?model=gpt-realtime-mini-2025-10-06'
 * ```
 */
export function getRealtimeURL(context: OpenAIContext): string {
  const model = OPENAI_CONFIG.models[context]
  return `${OPENAI_CONFIG.api.realtime}?model=${model}`
}

/**
 * Vérifier si un modèle est disponible
 * 
 * @param model Nom du modèle à vérifier
 * @returns true si modèle valide
 */
export function isValidModel(model: string): model is OpenAIRealtimeModel {
  const validModels: OpenAIRealtimeModel[] = [
    'gpt-realtime-2025-08-28',
    'gpt-realtime-mini-2025-10-06',
    'gpt-audio-2025-08-28',
  ]
  return validModels.includes(model as OpenAIRealtimeModel)
}

/**
 * Vérifier si une voix est disponible
 * 
 * @param voice Nom de la voix à vérifier
 * @returns true si voix valide
 */
export function isValidVoice(voice: string): voice is OpenAIVoice {
  const validVoices: OpenAIVoice[] = [
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'
  ]
  return validVoices.includes(voice as OpenAIVoice)
}

/**
 * 📊 MONITORING HELPERS
 */

/**
 * Extraire version du modèle pour analytics
 * 
 * @param model Nom complet du modèle
 * @returns Version formatée (ex: "2025-10", "2025-08")
 * 
 * @example
 * ```typescript
 * getModelVersion('gpt-realtime-mini-2025-10-06') // '2025-10'
 * getModelVersion('gpt-realtime-2025-08-28')      // '2025-08'
 * ```
 */
export function getModelVersion(model: string): string {
  const match = model.match(/(\d{4})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : 'unknown'
}

/**
 * Déterminer le tier du modèle pour analytics
 * 
 * @param model Nom complet du modèle
 * @returns Tier ('mini', 'full', 'audio', 'unknown')
 */
export function getModelTier(model: string): 'mini' | 'full' | 'audio' | 'unknown' {
  if (model.includes('mini')) return 'mini'
  if (model.includes('audio')) return 'audio'
  if (model.includes('realtime')) return 'full'
  return 'unknown'
}

/**
 * 🔒 VALIDATION RUNTIME
 * 
 * Vérifier configuration au démarrage
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifier modèles
  if (!isValidModel(OPENAI_CONFIG.models.production)) {
    errors.push(`Invalid production model: ${OPENAI_CONFIG.models.production}`)
  }
  if (!isValidModel(OPENAI_CONFIG.models.vitrine)) {
    errors.push(`Invalid vitrine model: ${OPENAI_CONFIG.models.vitrine}`)
  }
  if (!isValidModel(OPENAI_CONFIG.models.audio)) {
    errors.push(`Invalid audio model: ${OPENAI_CONFIG.models.audio}`)
  }

  // Vérifier voix
  if (!isValidVoice(OPENAI_CONFIG.voices.production)) {
    errors.push(`Invalid production voice: ${OPENAI_CONFIG.voices.production}`)
  }
  if (!isValidVoice(OPENAI_CONFIG.voices.vitrine)) {
    errors.push(`Invalid vitrine voice: ${OPENAI_CONFIG.voices.vitrine}`)
  }
  if (!isValidVoice(OPENAI_CONFIG.voices.fallback)) {
    errors.push(`Invalid fallback voice: ${OPENAI_CONFIG.voices.fallback}`)
  }

  // Vérifier VAD
  if (OPENAI_CONFIG.vad.threshold < 0 || OPENAI_CONFIG.vad.threshold > 1) {
    errors.push(`Invalid VAD threshold: ${OPENAI_CONFIG.vad.threshold} (must be 0-1)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// 🚀 Validation au chargement du module (dev only)
if (process.env.NODE_ENV === 'development') {
  const validation = validateConfig()
  if (!validation.valid) {
    console.warn('⚠️ OPENAI_CONFIG validation errors:', validation.errors)
  } else {
    console.log('✅ OPENAI_CONFIG validated successfully')
    console.log('📋 Models:', OPENAI_CONFIG.models)
    console.log('🎤 Voices:', OPENAI_CONFIG.voices)
  }
}

