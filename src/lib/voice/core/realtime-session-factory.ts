/**
 * Realtime Session Factory
 * 
 * Génère des ephemeral tokens pour les sessions WebRTC/WebSocket
 * À utiliser UNIQUEMENT côté serveur (API routes)
 */

import type {
  EphemeralTokenRequest,
  EphemeralTokenResponse,
  VoiceModel,
  VoiceOption,
  SessionFactoryResponse
} from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/realtime/client_secrets';

export class RealtimeSessionFactory {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required for RealtimeSessionFactory');
    }
  }

  /**
   * Crée un ephemeral token pour une session Realtime (GA)
   */
  async createEphemeralToken(
    model: VoiceModel = 'gpt-realtime',
    voice: VoiceOption = 'cedar'
  ): Promise<EphemeralTokenResponse> {
    const request: EphemeralTokenRequest = {
      session: {
        type: 'realtime',
        model,
        audio: {
          output: { voice }
        }
      }
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create ephemeral token: ${response.status} ${error}`);
    }

    const data = await response.json();
    return {
      value: data.value,
      expires_at: data.expires_at
    };
  }

  /**
   * Crée une session complète prête à l'emploi
   * Retourne le token + la config session.update à envoyer côté client
   */
  async createSession(config: {
    model?: VoiceModel;
    voice?: VoiceOption;
    sessionId?: string;
  }): Promise<SessionFactoryResponse> {
    try {
      const model = config.model || 'gpt-realtime';
      const voice = config.voice || 'cedar';

      // Créer ephemeral token
      const token = await this.createEphemeralToken(model, voice);

      return {
        success: true,
        session: {
          session_id: config.sessionId || `sess_${Date.now()}`,
          client_secret: token.value,
          model,
          voice,
          expires_at: token.expires_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Valide qu'une clé API OpenAI fonctionne
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.createEphemeralToken();
      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
}

/**
 * Helper pour créer une factory avec retry logic
 */
export async function createSessionWithRetry(
  config: {
    model?: VoiceModel;
    voice?: VoiceOption;
    sessionId?: string;
  },
  maxRetries: number = 3
): Promise<SessionFactoryResponse> {
  const factory = new RealtimeSessionFactory();
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await factory.createSession(config);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`
  };
}

