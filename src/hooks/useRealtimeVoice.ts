/**
 * Hook React Unifié pour OpenAI Realtime API (GA)
 * 
 * Usage:
 * 
 * // Vitrine
 * const voice = useRealtimeVoice({ context: 'vitrine' })
 * 
 * // Kiosk
 * const voice = useRealtimeVoice({ 
 *   context: 'kiosk',
 *   memberId: '123',
 *   gymId: '456'
 * })
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { RealtimeWebRTCClient } from '@/lib/voice/core/realtime-webrtc-client';
import type {
  ConnectionStatus,
  AudioState,
  RealtimeSessionConfig
} from '@/lib/voice/types';

// ============================================
// TYPES
// ============================================

interface UseRealtimeVoiceOptionsVitrine {
  context: 'vitrine';
  autoConnect?: boolean;
  debug?: boolean;
}

interface UseRealtimeVoiceOptionsKiosk {
  context: 'kiosk';
  memberId: string;
  gymId: string;
  autoConnect?: boolean;
  debug?: boolean;
}

type UseRealtimeVoiceOptions = UseRealtimeVoiceOptionsVitrine | UseRealtimeVoiceOptionsKiosk;

interface UseRealtimeVoiceReturn {
  // État
  status: ConnectionStatus;
  audioState: AudioState;
  error: string | null;
  isConnected: boolean;
  sessionId: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendText: (text: string) => void;
  
  // Metadata
  remainingCredits?: number;
  maxDuration?: number;
}

// ============================================
// HOOK
// ============================================

export function useRealtimeVoice(options: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isPlaying: false,
    isFinal: false,
    transcript: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>(undefined);
  const [maxDuration, setMaxDuration] = useState<number | undefined>(undefined);
  
  const clientRef = useRef<RealtimeWebRTCClient | null>(null);
  const sessionConfigRef = useRef<RealtimeSessionConfig | null>(null);

  // ============================================
  // CONNEXION
  // ============================================
  const connect = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      // 1. Créer session sur le serveur
      const endpoint = options.context === 'vitrine'
        ? '/api/voice/vitrine/session'
        : '/api/voice/kiosk/session';
      
      const body = options.context === 'kiosk'
        ? { memberId: options.memberId, gymId: options.gymId }
        : {};

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.session) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Store session config for later
      sessionConfigRef.current = data.sessionUpdateConfig;
      setSessionId(data.session.session_id);
      setRemainingCredits(data.remainingCredits);
      setMaxDuration(data.maxDuration);

      // 2. Créer WebRTC client
      const client = new RealtimeWebRTCClient({
        ephemeralToken: data.session.client_secret,
        model: data.session.model,
        sessionConfig: data.sessionUpdateConfig,
        autoConnect: false,
        debug: options.debug ?? false
      });

      // 3. Setup event handlers
      client.events.onSessionCreated(() => {
        console.log('✅ Session created');
      });

      client.events.onSessionUpdated(() => {
        console.log('✅ Session configured');
        setStatus('connected');
      });

      client.events.onSpeechStarted(() => {
        setStatus('listening');
        setAudioState(prev => ({ ...prev, isListening: true }));
      });

      client.events.onSpeechStopped(() => {
        setAudioState(prev => ({ ...prev, isListening: false }));
      });

      client.events.on('response.created', () => {
        setStatus('speaking');
        setAudioState(prev => ({ ...prev, isPlaying: true, transcript: '' }));
      });

      client.events.onTranscriptDelta((event) => {
        setAudioState(prev => ({
          ...prev,
          transcript: prev.transcript + event.transcript
        }));
      });

      client.events.onResponseDone(() => {
        setStatus('connected');
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false,
          isFinal: true
        }));
      });

      client.events.onError((event) => {
        console.error('❌ Realtime error:', event.error);
        setError(event.error.message);
        setStatus('error');
      });

      clientRef.current = client;

      // 4. Connect
      await client.connect();

    } catch (err) {
      console.error('❌ Connection error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  }, [options]);

  // ============================================
  // DÉCONNEXION
  // ============================================
  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    setStatus('disconnected');
    setSessionId(null);
    setAudioState({
      isListening: false,
      isPlaying: false,
      isFinal: false,
      transcript: ''
    });
  }, []);

  // ============================================
  // ENVOYER TEXTE
  // ============================================
  const sendText = useCallback((text: string) => {
    if (!clientRef.current) {
      console.warn('Client not connected');
      return;
    }
    
    clientRef.current.sendText(text);
  }, []);

  // ============================================
  // AUTO-CONNECT
  // ============================================
  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [options.autoConnect, connect]);

  // ============================================
  // RETURN
  // ============================================
  return {
    status,
    audioState,
    error,
    isConnected: status === 'connected' && clientRef.current?.isConnected() === true,
    sessionId,
    remainingCredits,
    maxDuration,
    connect,
    disconnect,
    sendText
  };
}



 * Hook React Unifié pour OpenAI Realtime API (GA)
 * 
 * Usage:
 * 
 * // Vitrine
 * const voice = useRealtimeVoice({ context: 'vitrine' })
 * 
 * // Kiosk
 * const voice = useRealtimeVoice({ 
 *   context: 'kiosk',
 *   memberId: '123',
 *   gymId: '456'
 * })
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { RealtimeWebRTCClient } from '@/lib/voice/core/realtime-webrtc-client';
import type {
  ConnectionStatus,
  AudioState,
  RealtimeSessionConfig
} from '@/lib/voice/types';

// ============================================
// TYPES
// ============================================

interface UseRealtimeVoiceOptionsVitrine {
  context: 'vitrine';
  autoConnect?: boolean;
  debug?: boolean;
}

interface UseRealtimeVoiceOptionsKiosk {
  context: 'kiosk';
  memberId: string;
  gymId: string;
  autoConnect?: boolean;
  debug?: boolean;
}

type UseRealtimeVoiceOptions = UseRealtimeVoiceOptionsVitrine | UseRealtimeVoiceOptionsKiosk;

interface UseRealtimeVoiceReturn {
  // État
  status: ConnectionStatus;
  audioState: AudioState;
  error: string | null;
  isConnected: boolean;
  sessionId: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendText: (text: string) => void;
  
  // Metadata
  remainingCredits?: number;
  maxDuration?: number;
}

// ============================================
// HOOK
// ============================================

export function useRealtimeVoice(options: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isPlaying: false,
    isFinal: false,
    transcript: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>(undefined);
  const [maxDuration, setMaxDuration] = useState<number | undefined>(undefined);
  
  const clientRef = useRef<RealtimeWebRTCClient | null>(null);
  const sessionConfigRef = useRef<RealtimeSessionConfig | null>(null);

  // ============================================
  // CONNEXION
  // ============================================
  const connect = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      // 1. Créer session sur le serveur
      const endpoint = options.context === 'vitrine'
        ? '/api/voice/vitrine/session'
        : '/api/voice/kiosk/session';
      
      const body = options.context === 'kiosk'
        ? { memberId: options.memberId, gymId: options.gymId }
        : {};

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.session) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Store session config for later
      sessionConfigRef.current = data.sessionUpdateConfig;
      setSessionId(data.session.session_id);
      setRemainingCredits(data.remainingCredits);
      setMaxDuration(data.maxDuration);

      // 2. Créer WebRTC client
      const client = new RealtimeWebRTCClient({
        ephemeralToken: data.session.client_secret,
        model: data.session.model,
        sessionConfig: data.sessionUpdateConfig,
        autoConnect: false,
        debug: options.debug ?? false
      });

      // 3. Setup event handlers
      client.events.onSessionCreated(() => {
        console.log('✅ Session created');
      });

      client.events.onSessionUpdated(() => {
        console.log('✅ Session configured');
        setStatus('connected');
      });

      client.events.onSpeechStarted(() => {
        setStatus('listening');
        setAudioState(prev => ({ ...prev, isListening: true }));
      });

      client.events.onSpeechStopped(() => {
        setAudioState(prev => ({ ...prev, isListening: false }));
      });

      client.events.on('response.created', () => {
        setStatus('speaking');
        setAudioState(prev => ({ ...prev, isPlaying: true, transcript: '' }));
      });

      client.events.onTranscriptDelta((event) => {
        setAudioState(prev => ({
          ...prev,
          transcript: prev.transcript + event.transcript
        }));
      });

      client.events.onResponseDone(() => {
        setStatus('connected');
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false,
          isFinal: true
        }));
      });

      client.events.onError((event) => {
        console.error('❌ Realtime error:', event.error);
        setError(event.error.message);
        setStatus('error');
      });

      clientRef.current = client;

      // 4. Connect
      await client.connect();

    } catch (err) {
      console.error('❌ Connection error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  }, [options]);

  // ============================================
  // DÉCONNEXION
  // ============================================
  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    setStatus('disconnected');
    setSessionId(null);
    setAudioState({
      isListening: false,
      isPlaying: false,
      isFinal: false,
      transcript: ''
    });
  }, []);

  // ============================================
  // ENVOYER TEXTE
  // ============================================
  const sendText = useCallback((text: string) => {
    if (!clientRef.current) {
      console.warn('Client not connected');
      return;
    }
    
    clientRef.current.sendText(text);
  }, []);

  // ============================================
  // AUTO-CONNECT
  // ============================================
  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [options.autoConnect, connect]);

  // ============================================
  // RETURN
  // ============================================
  return {
    status,
    audioState,
    error,
    isConnected: status === 'connected' && clientRef.current?.isConnected() === true,
    sessionId,
    remainingCredits,
    maxDuration,
    connect,
    disconnect,
    sendText
  };
}



