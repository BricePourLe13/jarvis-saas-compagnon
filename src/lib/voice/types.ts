/**
 * Types partagés pour le système vocal Realtime
 */

// ============================================
// SESSION TYPES
// ============================================

export type VoiceModel = 'gpt-realtime' | 'gpt-realtime-mini';

export type VoiceOption = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse' | 'cedar' | 'marin';

export type OutputModality = 'audio' | 'text';

export type AudioFormat = 'audio/pcm' | 'audio/pcmu' | 'audio/pcma';

export type SessionContext = 'kiosk';

// ============================================
// SESSION CONFIGURATION
// ============================================

export interface RealtimeSessionConfig {
  type: 'realtime';
  model: VoiceModel;
  instructions: string;
  output_modalities: OutputModality[];
  audio: {
    input: {
      format: {
        type: AudioFormat;
        rate: number;
      };
      transcription?: {
        model: string;
      };
      turn_detection: {
        type: 'server_vad';
        threshold: number;
        silence_duration_ms: number;
        prefix_padding_ms: number;
        create_response: boolean;
        interrupt_response?: boolean;
      };
    };
    output: {
      voice: VoiceOption;
      format: {
        type: AudioFormat;
        rate?: number;
      };
    };
  };
  tools?: RealtimeTool[];
  tool_choice?: 'auto' | 'none' | 'required';
}

// ============================================
// EPHEMERAL TOKEN
// ============================================

export interface EphemeralTokenRequest {
  session: {
    type: 'realtime';
    model: VoiceModel;
    audio: {
      output: { voice: VoiceOption };
    };
  };
}

export interface EphemeralTokenResponse {
  value: string;
  expires_at: number;
}

// ============================================
// REALTIME EVENTS (GA)
// ============================================

export type RealtimeEventType =
  // Session
  | 'session.created'
  | 'session.updated'
  // Input Audio
  | 'input_audio_buffer.speech_started'
  | 'input_audio_buffer.speech_stopped'
  | 'input_audio_buffer.committed'
  // Conversation
  | 'conversation.item.added'
  | 'conversation.item.done'
  | 'conversation.item.input_audio_transcription.completed'
  // Response
  | 'response.created'
  | 'response.output_item.added'
  | 'response.content_part.added'
  | 'response.output_audio.delta'
  | 'response.output_audio.done'
  | 'response.output_audio_transcript.delta'
  | 'response.output_audio_transcript.done'
  | 'response.output_text.delta'
  | 'response.output_text.done'
  | 'response.content_part.done'
  | 'response.output_item.done'
  | 'response.done'
  // Function calling
  | 'response.function_call_arguments.delta'
  | 'response.function_call_arguments.done'
  // Errors
  | 'error'
  | 'rate_limits.updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  event_id?: string;
  [key: string]: unknown;
}

export interface SessionCreatedEvent extends RealtimeEvent {
  type: 'session.created';
  session: {
    id: string;
    model: string;
    voice?: string;
  };
}

export interface SessionUpdatedEvent extends RealtimeEvent {
  type: 'session.updated';
  session: RealtimeSessionConfig;
}

export interface AudioDeltaEvent extends RealtimeEvent {
  type: 'response.output_audio.delta';
  delta: string; // Base64-encoded PCM16
}

export interface TranscriptDeltaEvent extends RealtimeEvent {
  type: 'response.output_audio_transcript.delta';
  transcript: string;
}

export interface ResponseDoneEvent extends RealtimeEvent {
  type: 'response.done';
  response: {
    id: string;
    status: 'completed' | 'failed' | 'cancelled';
    output: unknown[];
  };
}

export interface ErrorEvent extends RealtimeEvent {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}

// ============================================
// AUDIO STATE
// ============================================

export interface AudioState {
  isListening: boolean;
  isPlaying: boolean;
  isFinal: boolean;
  transcript: string;
}

// ============================================
// CONNECTION STATE
// ============================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  sessionId: string | null;
  error: string | null;
  reconnectAttempts: number;
}

// ============================================
// TOOLS (Function Calling)
// ============================================

export interface RealtimeTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================
// CONTEXT CONFIG
// ============================================

export interface KioskContext {
  context: 'kiosk';
  memberId: string;
  memberName: string;
  gymId: string;
  gymName: string;
}

export type RealtimeContext = KioskContext;

// ============================================
// SESSION FACTORY RESPONSE
// ============================================

export interface SessionFactoryResponse {
  success: boolean;
  session?: {
    session_id: string;
    client_secret: string;
    model: VoiceModel;
    voice: VoiceOption;
    expires_at: number;
  };
  sessionUpdateConfig?: RealtimeSessionConfig;
  error?: string;
  remainingCredits?: number;
}


