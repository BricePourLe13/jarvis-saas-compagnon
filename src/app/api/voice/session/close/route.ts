/**
 * 🏁 API FERMETURE SESSION SIMPLE
 * Ferme proprement une session OpenAI Realtime
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, reason } = body

    console.log(`🔍 [API] Payload reçu:`, body)

    if (!sessionId) {
      console.error(`🚨 [API] SessionId manquant dans le payload`)
      return NextResponse.json(
        { error: 'sessionId requis' }, 
        { status: 400 }
      )
    }

    console.log(`🏁 [API] Fermeture session: ${sessionId} (raison: ${reason})`)

    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log(`🔍 [API] Config Supabase:`, {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + '...',
      serviceKeyPrefix: serviceKey?.substring(0, 10) + '...'
    })

    // Utiliser la fonction SQL pour fermer la session
    const supabase = getSupabaseService()
    // FERMETURE AVEC RELATION FORTE MEMBER_ID
    console.log(`🔍 [API] Fermeture session avec vérification membre...`)
    
    // 1. Vérifier que la session existe et récupérer member_id
    const { data: session, error: sessionError } = await supabase
      .from('openai_realtime_sessions')
      .select('id, member_id, member_badge_id, session_started_at, state')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error(`❌ [API] Session non trouvée: ${sessionId}`)
      return NextResponse.json(
        { error: 'Session non trouvée', session_id: sessionId },
        { status: 404 }
      )
    }

    if (session.state === 'closed') {
      console.log(`⚠️ [API] Session déjà fermée: ${sessionId}`)
      return NextResponse.json({
        success: true,
        message: 'Session déjà fermée',
        already_closed: true,
        session_id: sessionId
      })
    }

    // 2. Fermer la session avec la fonction robuste
    const { data: result, error: rpcError } = await supabase.rpc('close_session_robust', {
      p_session_id: sessionId,
      p_reason: reason || 'user_goodbye'
    })

    console.log(`🔍 [API] Résultat fonction robuste:`, { 
      result, 
      rpcError: rpcError ? {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      } : null 
    })

    // Gérer les erreurs RPC
    if (rpcError) {
      console.error(`🚨 [API] Erreur RPC:`, rpcError)
      return NextResponse.json(
        { 
          error: 'Erreur fonction de fermeture', 
          details: rpcError.message,
          error_code: rpcError.code
        },
        { status: 500 }
      )
    }

    // Analyser le résultat de la fonction
    const functionResult = result as any
    const success = functionResult?.success === true

    if (success) {
      console.log(`✅ [API] Session fermée avec succès: ${sessionId}`)
      return NextResponse.json({ 
        success: true,
        message: functionResult.message || 'Session fermée avec succès',
        session_id: functionResult.session_id || sessionId,
        duration_seconds: functionResult.duration_seconds,
        end_reason: functionResult.end_reason,
        already_closed: functionResult.already_closed || false
      })
    } else {
      console.error(`🚨 [API] Échec fermeture session:`, functionResult)
      
      // Messages d'erreur basés sur le retour de la fonction
      let errorMessage = 'Erreur lors de la fermeture de session'
      let errorDetails = functionResult?.message || 'Fonction de fermeture a échoué'
      let statusCode = 500
      
      switch (functionResult?.error) {
        case 'session_not_found':
          errorMessage = 'Session non trouvée'
          statusCode = 404
          break
        case 'update_failed':
          errorMessage = 'Échec de la mise à jour'
          errorDetails = 'La session n\'a pas pu être fermée'
          break
        case 'sql_exception':
          errorMessage = 'Erreur base de données'
          errorDetails = `SQL Error: ${functionResult.message}`
          break
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          session_id: sessionId,
          error_type: functionResult?.error,
          sql_state: functionResult?.sqlstate
        },
        { status: statusCode }
      )
    }

  } catch (error: any) {
    console.error('🚨 [API] Erreur fermeture session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}