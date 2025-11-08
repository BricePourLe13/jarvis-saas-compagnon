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
     * - gpt-realtime-2025-08-28 = Modèle GA officiel (doc actualisée nov 2025)
     * - Format GA (pas de header OpenAI-Beta)
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
     * - shimmer = voix féminine énergique et claire
     * - Ton commercial et engageant
     */
    vitrine: (process.env.OPENAI_VOICE_VITRINE || 'shimmer') as OpenAIVoice,
    
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
   * 📡 URLS API OPENAI (FORMAT GA 2025)
   */
  api: {
    /**
     * URL création client secrets (ephemeral tokens) - FORMAT GA
     * Doc ligne 336: "POST /v1/realtime/client_secrets"
     * https://platform.openai.com/docs/api-reference/realtime-sessions/create-realtime-client-secret
     */
    clientSecrets: 'https://api.openai.com/v1/realtime/client_secrets',
    
    /**
     * URL WebRTC calls (FORMAT GA - changé de /realtime vers /realtime/calls)
     * Doc ligne 368-370: "New URL for WebRTC SDP data"
     * https://platform.openai.com/docs/guides/realtime-webrtc#connecting-using-the-unified-interface
     */
    realtimeCalls: 'https://api.openai.com/v1/realtime/calls',
    
    /**
     * ❌ DEPRECATED - Ne plus utiliser le header Beta pour modèles GA
     * (Nécessaire uniquement si utilisation modèles beta avec OpenAI-Beta: realtime=v1)
     */
    betaHeader: 'realtime=v1', // ❌ Ne pas utiliser pour gpt-realtime-2025-08-28
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
    modalities: ['audio'], // ✅ Speech-to-speech : ['audio'] uniquement (doc ligne 1202-1203)
    turn_detection: {
      type: OPENAI_CONFIG.vad.type,
      threshold: isDemo ? 0.3 : OPENAI_CONFIG.vad.threshold, // ✅ Plus sensible pour vitrine (0.3 vs 0.5)
      prefix_padding_ms: OPENAI_CONFIG.vad.prefixPaddingMs,
      silence_duration_ms: isDemo ? OPENAI_CONFIG.vad.silenceDurationMsDemo : OPENAI_CONFIG.vad.silenceDurationMs,
      interrupt_response: OPENAI_CONFIG.vad.interruptResponse,
      create_response: OPENAI_CONFIG.vad.createResponse,
    },
    input_audio_transcription: {
      model: OPENAI_CONFIG.session.transcriptionModel,
      language: 'fr', // ✅ Forcer français (évite détection automatique incorrecte)
    },
    temperature: OPENAI_CONFIG.session.temperature,
    max_response_output_tokens: OPENAI_CONFIG.session.maxResponseOutputTokens,
  }
}

/**
 * 🔑 Créer config MINIMALE pour ephemeral token
 * 
 * L'endpoint /v1/realtime/client_secrets N'ACCEPTE QUE la config minimale.
 * Les instructions, tools, etc. doivent être envoyés APRÈS via session.update.
 * 
 * @param context Type de session (production, vitrine, audio)
 * @returns Configuration minimale pour créer l'ephemeral token
 * 
 * @example
 * ```typescript
 * const minimalConfig = getMinimalSessionConfig('vitrine')
 * // { type: "realtime", model: "gpt-realtime-2025-08-28", audio: { output: { voice: "alloy" } } }
 * ```
 * 
 * Doc référence: https://platform.openai.com/docs/guides/realtime-webrtc (ligne 634-644)
 * Structure acceptée par /client_secrets :
 * ```
 * {
 *   type: "realtime",
 *   model: "gpt-realtime",
 *   audio: {
 *     output: { voice: "marin" }
 *   }
 * }
 * ```
 */
export function getMinimalSessionConfig(context: OpenAIContext) {
  return {
    type: "realtime" as const,
    model: OPENAI_CONFIG.models[context],
    audio: {
      output: {
        voice: context === 'production' ? OPENAI_CONFIG.voices.production : OPENAI_CONFIG.voices.vitrine
      }
    }
  }
}

/**
 * 🎛️ Créer config COMPLÈTE pour session.update
 * 
 * Cette config est envoyée APRÈS la connexion WebRTC via le data channel
 * avec un événement `session.update`.
 * 
 * @param config Configuration retournée par getConfigForContext()
 * @param instructions Instructions système pour le LLM
 * @param tools Fonctions disponibles (optionnel)
 * @returns Configuration complète pour session.update
 * 
 * @example
 * ```typescript
 * const baseConfig = getConfigForContext('vitrine')
 * const sessionUpdate = getFullSessionUpdate(baseConfig, instructions, tools)
 * 
 * // Envoyer via WebRTC data channel :
 * dataChannel.send(JSON.stringify({
 *   type: 'session.update',
 *   session: sessionUpdate
 * }))
 * ```
 * 
 * Doc référence: https://platform.openai.com/docs/guides/realtime-webrtc
 */
export function getFullSessionUpdate(
  config: ReturnType<typeof getConfigForContext>,
  instructions: string,
  tools?: any[],
  voice?: OpenAIVoice
) {
  // ✅ Structure session.update selon doc OpenAI
  // https://platform.openai.com/docs/guides/realtime-webrtc
  return {
    type: "realtime" as const,
    output_modalities: ['audio'] as const,
    audio: {
      input: {
        format: {
          type: "audio/pcm" as const,
          rate: 24000,  // ✅ REQUIS pour input
        },
        turn_detection: config.turn_detection,
      },
      output: {
        format: {
          type: "audio/pcm" as const,
          rate: 24000,  // ✅ REQUIS selon erreur OpenAI
        },
        voice: voice || config.voice
      },
    },
    instructions,
    tools: tools || [],
    tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
  }
}

/**
 * Construire URL WebRTC pour format GA
 * 
 * @param context Type de session
 * @returns URL pour connexion WebRTC (format GA - /realtime/calls)
 * 
 * @example
 * ```typescript
 * const url = getRealtimeURL('production')
 * // 'https://api.openai.com/v1/realtime/calls'
 * ```
 * 
 * ⚠️ FORMAT GA : L'URL est maintenant /realtime/calls (pas de query param model)
 * Le modèle est spécifié dans le sessionConfig lors de la création de session
 * Doc: https://platform.openai.com/docs/guides/realtime-webrtc#connecting-using-the-unified-interface
 */
export function getRealtimeURL(context: OpenAIContext): string {
  // ✅ FORMAT GA : Utiliser /realtime/calls sans query param
  return OPENAI_CONFIG.api.realtimeCalls
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

