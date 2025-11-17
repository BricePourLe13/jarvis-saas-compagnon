/**
 * 🧪 API TEST FERMETURE SESSION
 * Endpoint de test pour vérifier la fermeture des sessions
 */

import { logger } from '@/lib/production-logger';
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import { OPENAI_CONFIG } from '@/lib/openai-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseSingleton()
    
    // 1. Créer une session de test
    const testSessionId = `test_${Date.now()}`
    
    const { error: insertError } = await supabase
      .from('openai_realtime_sessions')
      .insert({
        session_id: testSessionId,
        gym_id: '00000000-0000-0000-0000-000000000000', // UUID test
        kiosk_slug: 'test-kiosk',
        ai_model: OPENAI_CONFIG.models.production,
        voice_model: OPENAI_CONFIG.voices.production,
        connection_type: 'webrtc',
        turn_detection_type: 'server_vad',
        member_badge_id: 'test-badge',
        session_started_at: new Date().toISOString(),
        state: 'active',
        last_activity_at: new Date().toISOString(),
        session_metadata: {
          test: true,
          created_by: 'test-api'
        }
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Erreur création session test', details: insertError.message },
        { status: 500 }
      )
    }

    logger.info(`🧪 [TEST] Session test créée: ${testSessionId}`)

    // 2. Tester la fermeture
    const { data, error } = await supabase.rpc('close_realtime_session', {
      p_session_id: testSessionId,
      p_reason: 'test_closure'
    })

    if (error) {
      return NextResponse.json(
        { error: 'Erreur fermeture session test', details: error.message },
        { status: 500 }
      )
    }

    // 3. Vérifier que la session est fermée
    const { data: closedSession } = await supabase
      .from('openai_realtime_sessions')
      .select('session_id, session_ended_at, session_metadata')
      .eq('session_id', testSessionId)
      .single()

    logger.info(`🧪 [TEST] Session fermée:`, closedSession)

    // 4. Nettoyer la session de test
    await supabase
      .from('openai_realtime_sessions')
      .delete()
      .eq('session_id', testSessionId)

    return NextResponse.json({
      success: true,
      message: 'Test de fermeture réussi',
      results: {
        session_created: true,
        closure_function_result: data,
        session_closed: !!closedSession?.session_ended_at,
        end_reason: closedSession?.session_metadata?.end_reason
      }
    })

  } catch (error: any) {
    logger.error('🧪 [TEST] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur test', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de test pour la fermeture des sessions',
    usage: 'POST /api/voice/session/test-close'
  })
}


