/**
 * 🎙️ TYPES COMMUNS - VOICE REALTIME SYSTEM
 * 
 * Types partagés entre kiosk et vitrine pour le système vocal
 * 
 * @version 1.0.0
 * @date 2025-01-XX
 */

/**
 * Statut de la connexion vocale
 */
export type VoiceStatus = 
  | 'idle' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'speaking' 
  | 'error' 
  | 'reconnecting'

/**
 * Session OpenAI Realtime
 */
export interface VoiceSession {
  /** Client secret pour authentification WebRTC */
  client_secret: { value: string } | string
  /** ID de session OpenAI */
  session_id: string
  /** Date d'expiration */
  expires_at: string
}

/**
 * Factory pour créer des sessions vocales
 * 
 * Permet de séparer la logique de création de session (kiosk vs vitrine)
 * du code WebRTC commun
 */
export interface VoiceSessionFactory {
  /**
   * Créer une nouvelle session vocale
   * 
   * @returns Session OpenAI Realtime avec credentials
   * @throws Error si la création échoue
   */
  createSession(): Promise<VoiceSession>
}

/**
 * État audio pour le hook kiosk
 * 
 * Note: Différent de AudioState dans types/kiosk.ts
 * Ce type est spécifique au système vocal Realtime
 */
export interface VoiceAudioState {
  /** L'utilisateur est en train de parler */
  isListening: boolean
  /** JARVIS est en train de répondre */
  isPlaying: boolean
  /** Volume audio (0-100) */
  volume: number
  /** Transcription actuelle */
  transcript: string
  /** Transcription finale (non modifiable) */
  isFinal: boolean
}

/**
 * Configuration audio pour getUserMedia
 */
export interface AudioConfig {
  /** Taux d'échantillonnage (Hz) - Standard OpenAI: 16000 */
  sampleRate?: number
  /** Annulation d'écho */
  echoCancellation?: boolean
  /** Suppression de bruit */
  noiseSuppression?: boolean
  /** Contrôle automatique du gain */
  autoGainControl?: boolean
  /** Nombre de canaux (1 = mono, 2 = stéréo) */
  channelCount?: number
  /** Latence cible (secondes) */
  latency?: number
  /** Volume (0.0 - 1.0) */
  volume?: number
}

/**
 * Événement de function call OpenAI
 */
export interface FunctionCallEvent {
  /** ID de l'appel */
  call_id: string
  /** Nom de la fonction */
  name: string
  /** Arguments (JSON string) */
  arguments: string
}

/**
 * Configuration du core Realtime
 */
export interface VoiceRealtimeCoreConfig {
  /** Factory pour créer la session (spécifique au contexte) */
  sessionFactory: VoiceSessionFactory
  
  /** Configuration audio */
  audioConfig?: AudioConfig
  
  /** Callback changement de statut */
  onStatusChange?: (status: VoiceStatus) => void
  
  /** Callback mise à jour transcription */
  onTranscriptUpdate?: (transcript: string, isFinal?: boolean) => void
  
  /** Callback erreur */
  onError?: (error: Error) => void
  
  /** Callback changement état audio (pour kiosk) */
  onAudioStateChange?: (state: VoiceAudioState) => void
  
  /** Callback function call détecté */
  onFunctionCall?: (call: FunctionCallEvent, dataChannel: RTCDataChannel) => void
  
  /** Callback session créée */
  onSessionCreated?: (sessionId: string) => void
  
  /** Contexte (pour logging différencié) */
  context?: 'kiosk' | 'vitrine'
}

/**
 * Retour du hook core Realtime
 */
export interface VoiceRealtimeCoreReturn {
  /** État de connexion */
  isConnected: boolean
  
  /** Statut actuel */
  status: VoiceStatus
  
  /** Connexion à OpenAI Realtime */
  connect: () => Promise<void>
  
  /** Déconnexion */
  disconnect: () => Promise<void>
  
  /** Obtenir le data channel (pour function calls) */
  getDataChannel: () => RTCDataChannel | null
  
  /** Obtenir la peer connection (pour debugging) */
  getPeerConnection: () => RTCPeerConnection | null
  
  /** Obtenir l'ID de session */
  getSessionId: () => string | null
}

