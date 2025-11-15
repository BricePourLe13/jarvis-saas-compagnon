/**
 * Realtime WebRTC Client (GA)
 * 
 * Client unifié pour connexion WebRTC à l'API OpenAI Realtime
 * Supporte vitrine et kiosk avec la même base
 */

import { AudioProcessor } from './audio-processor';
import { EventRouter } from './event-router';
import type {
  RealtimeSessionConfig,
  RealtimeEvent,
  ConnectionStatus,
  AudioState
} from '../types';

export interface RealtimeWebRTCClientOptions {
  ephemeralToken: string;
  model?: string;
  sessionConfig?: RealtimeSessionConfig;
  autoConnect?: boolean;
  debug?: boolean;
}

export class RealtimeWebRTCClient {
  // WebRTC
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  // État
  private ephemeralToken: string;
  private model: string;
  private sessionConfig: RealtimeSessionConfig | null = null;
  private status: ConnectionStatus = 'disconnected';
  private sessionId: string | null = null;
  
  // Event handling
  public readonly events: EventRouter;
  
  // Audio state
  private audioState: AudioState = {
    isListening: false,
    isPlaying: false,
    isFinal: false,
    transcript: ''
  };
  
  private debug: boolean;

  constructor(options: RealtimeWebRTCClientOptions) {
    this.ephemeralToken = options.ephemeralToken;
    this.model = options.model || 'gpt-realtime';
    this.sessionConfig = options.sessionConfig || null;
    this.debug = options.debug ?? false;
    this.events = new EventRouter({ debug: this.debug });
    
    if (options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connexion WebRTC à OpenAI Realtime API (GA)
   */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      console.warn('[RealtimeWebRTCClient] Already connected or connecting');
      return;
    }

    this.log('🚀 Connecting to OpenAI Realtime API...');
    this.status = 'connecting';

    try {
      // 1. Initialiser audio context
      await this.initAudioContext();
      
      // 2. Créer peer connection
      this.pc = new RTCPeerConnection();
      
      // 3. Setup audio output (remote track)
      this.setupRemoteAudio();
      
      // 4. Setup audio input (local track)
      await this.setupLocalAudio();
      
      // 5. Setup data channel pour événements
      this.setupDataChannel();
      
      // 6. Create offer et get SDP answer
      await this.setupWebRTC();
      
      this.log('✅ Connected successfully');
      
    } catch (error) {
      this.log('❌ Connection failed:', error);
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Déconnexion propre
   */
  async disconnect(): Promise<void> {
    this.log('🔌 Disconnecting...');
    
    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.status = 'disconnected';
    this.sessionId = null;
    this.log('✅ Disconnected');
  }

  /**
   * Envoie un message texte (conversation.item.create)
   */
  sendText(text: string): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    }));
    
    // Trigger response
    this.dc.send(JSON.stringify({
      type: 'response.create'
    }));
  }

  /**
   * Configure la session (envoie session.update)
   */
  updateSession(config: RealtimeSessionConfig): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    
    this.log('📡 Updating session config...');
    
    this.dc.send(JSON.stringify({
      type: 'session.update',
      session: config
    }));
    
    this.sessionConfig = config;
  }

  /**
   * Getters pour l'état
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getAudioState(): AudioState {
    return { ...this.audioState };
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.dc?.readyState === 'open';
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async initAudioContext(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });
    
    await this.audioContext.resume();
    this.log('✅ Audio context initialized');
  }

  private setupRemoteAudio(): void {
    if (!this.pc) return;
    
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    
    this.pc.ontrack = (event) => {
      this.log('🎵 Remote track received');
      if (this.audioElement) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
  }

  private async setupLocalAudio(): Promise<void> {
    if (!this.pc) return;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });
      
      this.localStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.localStream!);
      });
      
      this.log('✅ Local audio configured');
    } catch (error) {
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  private setupDataChannel(): void {
    if (!this.pc) return;
    
    this.dc = this.pc.createDataChannel('oai-events');
    
    this.dc.onopen = () => {
      this.log('✅ Data channel open');
      this.status = 'connected';
      
      // Envoyer session.update si config fournie
      if (this.sessionConfig) {
        this.updateSession(this.sessionConfig);
      }
    };
    
    this.dc.onmessage = (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleServerEvent(realtimeEvent);
      } catch (error) {
        this.log('❌ Failed to parse server event:', error);
      }
    };
    
    this.dc.onerror = (error) => {
      this.log('❌ Data channel error:', error);
      this.status = 'error';
    };
    
    this.dc.onclose = () => {
      this.log('🔌 Data channel closed');
      this.status = 'disconnected';
    };
  }

  private async setupWebRTC(): Promise<void> {
    if (!this.pc) return;
    
    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    // Send SDP to OpenAI
    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${this.ephemeralToken}`,
        'Content-Type': 'application/sdp'
      }
    });
    
    if (!sdpResponse.ok) {
      throw new Error(`WebRTC setup failed: ${sdpResponse.status}`);
    }
    
    const answerSDP = await sdpResponse.text();
    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: answerSDP
    };
    
    await this.pc.setRemoteDescription(answer);
    this.log('✅ WebRTC setup complete');
  }

  private async handleServerEvent(event: RealtimeEvent): Promise<void> {
    // Update internal state
    switch (event.type) {
      case 'session.created':
        this.sessionId = (event as any).session?.id || null;
        break;
      
      case 'input_audio_buffer.speech_started':
        this.audioState.isListening = true;
        this.status = 'listening';
        break;
      
      case 'input_audio_buffer.speech_stopped':
        this.audioState.isListening = false;
        break;
      
      case 'response.created':
        this.audioState.isPlaying = true;
        this.status = 'speaking';
        break;
      
      case 'response.output_audio_transcript.delta':
        this.audioState.transcript += (event as any).transcript || '';
        break;
      
      case 'response.done':
        this.audioState.isPlaying = false;
        this.audioState.isFinal = true;
        this.status = 'connected';
        break;
    }
    
    // Route to event handlers
    await this.events.route(event);
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[RealtimeWebRTCClient]', ...args);
    }
  }
}



 * Realtime WebRTC Client (GA)
 * 
 * Client unifié pour connexion WebRTC à l'API OpenAI Realtime
 * Supporte vitrine et kiosk avec la même base
 */

import { AudioProcessor } from './audio-processor';
import { EventRouter } from './event-router';
import type {
  RealtimeSessionConfig,
  RealtimeEvent,
  ConnectionStatus,
  AudioState
} from '../types';

export interface RealtimeWebRTCClientOptions {
  ephemeralToken: string;
  model?: string;
  sessionConfig?: RealtimeSessionConfig;
  autoConnect?: boolean;
  debug?: boolean;
}

export class RealtimeWebRTCClient {
  // WebRTC
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  // État
  private ephemeralToken: string;
  private model: string;
  private sessionConfig: RealtimeSessionConfig | null = null;
  private status: ConnectionStatus = 'disconnected';
  private sessionId: string | null = null;
  
  // Event handling
  public readonly events: EventRouter;
  
  // Audio state
  private audioState: AudioState = {
    isListening: false,
    isPlaying: false,
    isFinal: false,
    transcript: ''
  };
  
  private debug: boolean;

  constructor(options: RealtimeWebRTCClientOptions) {
    this.ephemeralToken = options.ephemeralToken;
    this.model = options.model || 'gpt-realtime';
    this.sessionConfig = options.sessionConfig || null;
    this.debug = options.debug ?? false;
    this.events = new EventRouter({ debug: this.debug });
    
    if (options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connexion WebRTC à OpenAI Realtime API (GA)
   */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      console.warn('[RealtimeWebRTCClient] Already connected or connecting');
      return;
    }

    this.log('🚀 Connecting to OpenAI Realtime API...');
    this.status = 'connecting';

    try {
      // 1. Initialiser audio context
      await this.initAudioContext();
      
      // 2. Créer peer connection
      this.pc = new RTCPeerConnection();
      
      // 3. Setup audio output (remote track)
      this.setupRemoteAudio();
      
      // 4. Setup audio input (local track)
      await this.setupLocalAudio();
      
      // 5. Setup data channel pour événements
      this.setupDataChannel();
      
      // 6. Create offer et get SDP answer
      await this.setupWebRTC();
      
      this.log('✅ Connected successfully');
      
    } catch (error) {
      this.log('❌ Connection failed:', error);
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Déconnexion propre
   */
  async disconnect(): Promise<void> {
    this.log('🔌 Disconnecting...');
    
    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.status = 'disconnected';
    this.sessionId = null;
    this.log('✅ Disconnected');
  }

  /**
   * Envoie un message texte (conversation.item.create)
   */
  sendText(text: string): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    }));
    
    // Trigger response
    this.dc.send(JSON.stringify({
      type: 'response.create'
    }));
  }

  /**
   * Configure la session (envoie session.update)
   */
  updateSession(config: RealtimeSessionConfig): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    
    this.log('📡 Updating session config...');
    
    this.dc.send(JSON.stringify({
      type: 'session.update',
      session: config
    }));
    
    this.sessionConfig = config;
  }

  /**
   * Getters pour l'état
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getAudioState(): AudioState {
    return { ...this.audioState };
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.dc?.readyState === 'open';
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async initAudioContext(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000
    });
    
    await this.audioContext.resume();
    this.log('✅ Audio context initialized');
  }

  private setupRemoteAudio(): void {
    if (!this.pc) return;
    
    this.audioElement = document.createElement('audio');
    this.audioElement.autoplay = true;
    
    this.pc.ontrack = (event) => {
      this.log('🎵 Remote track received');
      if (this.audioElement) {
        this.audioElement.srcObject = event.streams[0];
      }
    };
  }

  private async setupLocalAudio(): Promise<void> {
    if (!this.pc) return;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });
      
      this.localStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.localStream!);
      });
      
      this.log('✅ Local audio configured');
    } catch (error) {
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  private setupDataChannel(): void {
    if (!this.pc) return;
    
    this.dc = this.pc.createDataChannel('oai-events');
    
    this.dc.onopen = () => {
      this.log('✅ Data channel open');
      this.status = 'connected';
      
      // Envoyer session.update si config fournie
      if (this.sessionConfig) {
        this.updateSession(this.sessionConfig);
      }
    };
    
    this.dc.onmessage = (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        this.handleServerEvent(realtimeEvent);
      } catch (error) {
        this.log('❌ Failed to parse server event:', error);
      }
    };
    
    this.dc.onerror = (error) => {
      this.log('❌ Data channel error:', error);
      this.status = 'error';
    };
    
    this.dc.onclose = () => {
      this.log('🔌 Data channel closed');
      this.status = 'disconnected';
    };
  }

  private async setupWebRTC(): Promise<void> {
    if (!this.pc) return;
    
    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    // Send SDP to OpenAI
    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${this.ephemeralToken}`,
        'Content-Type': 'application/sdp'
      }
    });
    
    if (!sdpResponse.ok) {
      throw new Error(`WebRTC setup failed: ${sdpResponse.status}`);
    }
    
    const answerSDP = await sdpResponse.text();
    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: answerSDP
    };
    
    await this.pc.setRemoteDescription(answer);
    this.log('✅ WebRTC setup complete');
  }

  private async handleServerEvent(event: RealtimeEvent): Promise<void> {
    // Update internal state
    switch (event.type) {
      case 'session.created':
        this.sessionId = (event as any).session?.id || null;
        break;
      
      case 'input_audio_buffer.speech_started':
        this.audioState.isListening = true;
        this.status = 'listening';
        break;
      
      case 'input_audio_buffer.speech_stopped':
        this.audioState.isListening = false;
        break;
      
      case 'response.created':
        this.audioState.isPlaying = true;
        this.status = 'speaking';
        break;
      
      case 'response.output_audio_transcript.delta':
        this.audioState.transcript += (event as any).transcript || '';
        break;
      
      case 'response.done':
        this.audioState.isPlaying = false;
        this.audioState.isFinal = true;
        this.status = 'connected';
        break;
    }
    
    // Route to event handlers
    await this.events.route(event);
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[RealtimeWebRTCClient]', ...args);
    }
  }
}



