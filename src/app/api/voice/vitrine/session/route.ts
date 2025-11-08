/**
 * API Route : Créer une session Realtime pour JARVIS Vitrine (Landing Page)
 * 
 * POST /api/voice/vitrine/session
 * 
 * - Génère un ephemeral token OpenAI
 * - Rate limit par IP (3 sessions/jour max)
 * - Pas d'auth requise
 * - 5 minutes max de conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealtimeSessionFactory } from '@/lib/voice/core/realtime-session-factory';
import { VITRINE_CONFIG, getVitrineSessionConfig, checkVitrineRateLimit } from '@/lib/voice/contexts/vitrine-config';
import { vitrineIPLimiter } from '@/lib/vitrine-ip-limiter';

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. RATE LIMITING par IP
    // ============================================
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (clientIP === 'unknown') {
      return NextResponse.json(
        { error: 'Unable to identify client' },
        { status: 403 }
      );
    }

    // Check rate limit
    const limitResult = await vitrineIPLimiter.checkLimit(clientIP, userAgent);
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Limite quotidienne atteinte', 
          message: limitResult.message,
          remainingCredits: 0
        },
        { status: 429 }
      );
    }

    // ============================================
    // 2. CRÉER EPHEMERAL TOKEN (GA)
    // ============================================
    const factory = new RealtimeSessionFactory();
    
    const sessionResult = await factory.createSession({
      model: VITRINE_CONFIG.model,
      voice: VITRINE_CONFIG.voice,
      sessionId: `vitrine_${Date.now()}_${clientIP.replace(/\./g, '_')}`
    });

    if (!sessionResult.success || !sessionResult.session) {
      console.error('❌ [VITRINE] Failed to create session:', sessionResult.error);
      return NextResponse.json(
        { error: 'Échec création session OpenAI', details: sessionResult.error },
        { status: 500 }
      );
    }

    // ============================================
    // 3. PRÉPARER CONFIG SESSION.UPDATE
    // ============================================
    const sessionUpdateConfig = getVitrineSessionConfig();

    // ============================================
    // 4. LOG & RESPONSE
    // ============================================
    console.log('✅ [VITRINE] Session créée:', {
      sessionId: sessionResult.session.session_id,
      clientIP,
      remainingCredits: limitResult.remainingCredits
    });

    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionResult.session.session_id,
        client_secret: sessionResult.session.client_secret,
        model: sessionResult.session.model,
        voice: sessionResult.session.voice,
        expires_at: sessionResult.session.expires_at
      },
      sessionUpdateConfig, // Config à envoyer via session.update côté client
      remainingCredits: limitResult.remainingCredits,
      maxDuration: VITRINE_CONFIG.maxDurationSeconds
    });

  } catch (error) {
    console.error('❌ [VITRINE] Erreur globale:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
