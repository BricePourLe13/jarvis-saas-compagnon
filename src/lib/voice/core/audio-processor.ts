/**
 * Audio Processing Utilities
 * 
 * Encode/Decode PCM16 audio for OpenAI Realtime API
 */

export class AudioProcessor {
  /**
   * Convertit Float32Array (Web Audio API) vers PCM16 Int16Array
   */
  static float32ToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp entre -1 et 1
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit signed integer
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    
    return pcm16;
  }

  /**
   * Convertit PCM16 Int16Array vers Float32Array (Web Audio API)
   */
  static pcm16ToFloat32(pcm16: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      // Normalize de [-32768, 32767] vers [-1.0, 1.0]
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
    }
    
    return float32;
  }

  /**
   * Convertit ArrayBuffer/Int16Array vers Base64 (pour envoi WebSocket)
   */
  static arrayBufferToBase64(buffer: ArrayBuffer | Int16Array): string {
    const bytes = buffer instanceof Int16Array 
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : new Uint8Array(buffer);
    
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks pour éviter stack overflow
    
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    
    return btoa(binary);
  }

  /**
   * Convertit Base64 vers ArrayBuffer (depuis WebSocket)
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  /**
   * Convertit Base64 vers Int16Array (PCM16)
   */
  static base64ToPCM16(base64: string): Int16Array {
    const buffer = this.base64ToArrayBuffer(base64);
    return new Int16Array(buffer);
  }

  /**
   * Crée un AudioBuffer depuis PCM16 Base64
   */
  static async createAudioBufferFromBase64(
    base64: string,
    audioContext: AudioContext,
    sampleRate: number = 24000
  ): Promise<AudioBuffer> {
    const pcm16 = this.base64ToPCM16(base64);
    const float32 = this.pcm16ToFloat32(pcm16);
    
    const audioBuffer = audioContext.createBuffer(
      1, // mono
      float32.length,
      sampleRate
    );
    
    audioBuffer.getChannelData(0).set(float32);
    
    return audioBuffer;
  }

  /**
   * Joue un AudioBuffer
   */
  static playAudioBuffer(
    audioBuffer: AudioBuffer,
    audioContext: AudioContext,
    onEnded?: () => void
  ): AudioBufferSourceNode {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    if (onEnded) {
      source.onended = onEnded;
    }
    
    source.start(0);
    return source;
  }

  /**
   * Encode et joue directement du Base64 audio
   */
  static async playBase64Audio(
    base64: string,
    audioContext: AudioContext,
    sampleRate: number = 24000,
    onEnded?: () => void
  ): Promise<AudioBufferSourceNode> {
    const audioBuffer = await this.createAudioBufferFromBase64(
      base64,
      audioContext,
      sampleRate
    );
    
    return this.playAudioBuffer(audioBuffer, audioContext, onEnded);
  }

  /**
   * Calcule le volume RMS (Root Mean Square) d'un Float32Array
   * Utile pour détection de silence ou visualisation
   */
  static calculateRMS(float32Array: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < float32Array.length; i++) {
      sum += float32Array[i] * float32Array[i];
    }
    return Math.sqrt(sum / float32Array.length);
  }

  /**
   * Détecte si un buffer audio est silencieux
   */
  static isSilent(float32Array: Float32Array, threshold: number = 0.01): boolean {
    const rms = this.calculateRMS(float32Array);
    return rms < threshold;
  }
}



