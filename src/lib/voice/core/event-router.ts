/**
 * Event Router for OpenAI Realtime API
 * 
 * Gère le routing et le handling des événements serveur
 */

import type {
  RealtimeEvent,
  RealtimeEventType,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  AudioDeltaEvent,
  TranscriptDeltaEvent,
  ResponseDoneEvent,
  ErrorEvent
} from '../types';

export type EventHandler<T = RealtimeEvent> = (event: T) => void | Promise<void>;

export class EventRouter {
  private handlers: Map<RealtimeEventType | 'any', EventHandler[]> = new Map();
  private debugMode: boolean = false;

  constructor(options?: { debug?: boolean }) {
    this.debugMode = options?.debug ?? false;
  }

  /**
   * Enregistre un handler pour un type d'événement spécifique
   */
  on<T extends RealtimeEvent = RealtimeEvent>(
    eventType: RealtimeEventType,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler as EventHandler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Enregistre un handler pour TOUS les événements
   */
  onAny(handler: EventHandler): () => void {
    if (!this.handlers.has('any')) {
      this.handlers.set('any', []);
    }
    
    this.handlers.get('any')!.push(handler);
    
    return () => {
      const handlers = this.handlers.get('any');
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Route un événement vers les handlers appropriés
   */
  async route(event: RealtimeEvent): Promise<void> {
    if (this.debugMode) {
      console.log('[EventRouter] 📨', event.type, event);
    }

    // Execute handlers spécifiques au type
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventRouter] Error in handler for ${event.type}:`, error);
        }
      }
    }

    // Execute handlers "any"
    const anyHandlers = this.handlers.get('any');
    if (anyHandlers) {
      for (const handler of anyHandlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error('[EventRouter] Error in "any" handler:', error);
        }
      }
    }
  }

  /**
   * Supprime tous les handlers
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Supprime les handlers d'un type spécifique
   */
  clearType(eventType: RealtimeEventType | 'any'): void {
    this.handlers.delete(eventType);
  }

  /**
   * Active/désactive le mode debug
   */
  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Helpers typés pour les événements communs
   */
  onSessionCreated(handler: EventHandler<SessionCreatedEvent>): () => void {
    return this.on('session.created', handler);
  }

  onSessionUpdated(handler: EventHandler<SessionUpdatedEvent>): () => void {
    return this.on('session.updated', handler);
  }

  onSpeechStarted(handler: EventHandler): () => void {
    return this.on('input_audio_buffer.speech_started', handler);
  }

  onSpeechStopped(handler: EventHandler): () => void {
    return this.on('input_audio_buffer.speech_stopped', handler);
  }

  onAudioDelta(handler: EventHandler<AudioDeltaEvent>): () => void {
    return this.on('response.output_audio.delta', handler);
  }

  onTranscriptDelta(handler: EventHandler<TranscriptDeltaEvent>): () => void {
    return this.on('response.output_audio_transcript.delta', handler);
  }

  onResponseDone(handler: EventHandler<ResponseDoneEvent>): () => void {
    return this.on('response.done', handler);
  }

  onError(handler: EventHandler<ErrorEvent>): () => void {
    return this.on('error', handler);
  }
}

/**
 * Helper pour créer un event router configuré avec des handlers standards
 */
export function createStandardEventRouter(options: {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onListening?: () => void;
  onSpeaking?: () => void;
  onTranscript?: (text: string) => void;
  onAudio?: (base64: string) => void;
  onError?: (error: string) => void;
  debug?: boolean;
}): EventRouter {
  const router = new EventRouter({ debug: options.debug });

  // Session
  if (options.onConnect) {
    router.onSessionCreated(() => options.onConnect!());
  }

  // Audio input
  if (options.onListening) {
    router.onSpeechStarted(() => options.onListening!());
  }

  // Audio output
  if (options.onAudio) {
    router.onAudioDelta((event) => {
      options.onAudio!(event.delta);
    });
  }

  if (options.onSpeaking) {
    router.on('response.created', () => options.onSpeaking!());
  }

  // Transcription
  if (options.onTranscript) {
    router.onTranscriptDelta((event) => {
      options.onTranscript!(event.transcript);
    });
  }

  // Response done
  if (options.onDisconnect) {
    router.onResponseDone(() => options.onDisconnect!());
  }

  // Errors
  if (options.onError) {
    router.onError((event) => {
      options.onError!(event.error.message);
    });
  }

  return router;
}



