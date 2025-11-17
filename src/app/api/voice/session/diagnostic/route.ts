/**
 * 🔍 DIAGNOSTIC COMPLET - API SESSION CLOSE
 * Endpoint pour diagnostiquer les problèmes de fermeture de session
 */

import { logger } from '@/lib/production-logger';
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET() {
  try {
    logger.info('🔍 [DIAGNOSTIC] Démarrage diagnostic complet...')

    // 1. Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      urlValid: supabaseUrl?.includes('supabase.co'),
      serviceKeyValid: serviceKey?.startsWith('eyJ') || serviceKey?.startsWith('sbp_'),
      nodeEnv: process.env.NODE_ENV
    }

    logger.info('🔍 [DIAGNOSTIC] Variables d\'environnement:', envCheck)

    // 2. Tester la connexion Supabase
    let supabaseTest = { connected: false, error: null }
    try {
      const supabase = getSupabaseService()
      const { data, error } = await supabase
        .from('openai_realtime_sessions')
        .select('count')
        .limit(1)
        .single()
      
      supabaseTest = {
        connected: !error,
        error: error?.message || null
      }
    } catch (err: any) {
      supabaseTest = {
        connected: false,
        error: err.message
      }
    }

    logger.info('🔍 [DIAGNOSTIC] Test connexion Supabase:', supabaseTest)

    // 3. Vérifier l'existence de la fonction RPC
    let rpcCheck = { exists: false, error: null }
    try {
      const supabase = getSupabaseService()
      const { data, error } = await supabase.rpc('close_realtime_session', {
        p_session_id: 'diagnostic_test_nonexistent',
        p_reason: 'diagnostic'
      })
      
      rpcCheck = {
        exists: true, // Si pas d'erreur de fonction inexistante
        error: null
      }
    } catch (err: any) {
      rpcCheck = {
        exists: !err.message.includes('function') && !err.message.includes('does not exist'),
        error: err.message
      }
    }

    logger.info('🔍 [DIAGNOSTIC] Test fonction RPC:', rpcCheck)

    // 4. Lister les sessions actives récentes
    let sessionsCheck = { count: 0, recent: [], error: null }
    try {
      const supabase = getSupabaseService()
      const { data, error } = await supabase
        .from('openai_realtime_sessions')
        .select('session_id, state, session_started_at, session_ended_at')
        .order('session_started_at', { ascending: false })
        .limit(5)
      
      sessionsCheck = {
        count: data?.length || 0,
        recent: data || [],
        error: error?.message || null
      }
    } catch (err: any) {
      sessionsCheck = {
        count: 0,
        recent: [],
        error: err.message
      }
    }

    logger.info('🔍 [DIAGNOSTIC] Sessions récentes:', sessionsCheck)

    // 5. Test complet avec session réelle si possible
    let fullTest = { success: false, steps: [], error: null }
    try {
      const supabase = getSupabaseService()
      
      // Créer une session test
      const testSessionId = `diagnostic_${Date.now()}`
      const { error: insertError } = await supabase
        .from('openai_realtime_sessions')
        .insert({
          session_id: testSessionId,
          gym_id: '42f6adf0-f222-4018-bb19-4f60e2a351f4',
          kiosk_slug: 'diagnostic-test',
          state: 'active'
        })

      if (insertError) throw insertError
      fullTest.steps.push('✅ Session test créée')

      // Tester la fermeture
      const { data: closeResult, error: closeError } = await supabase.rpc('close_realtime_session', {
        p_session_id: testSessionId,
        p_reason: 'diagnostic_test'
      })

      if (closeError) throw closeError
      fullTest.steps.push(`✅ RPC appelé, résultat: ${closeResult}`)

      // Vérifier la fermeture
      const { data: closedSession, error: checkError } = await supabase
        .from('openai_realtime_sessions')
        .select('session_ended_at, end_reason, state')
        .eq('session_id', testSessionId)
        .single()

      if (checkError) throw checkError
      fullTest.steps.push(`✅ Session fermée: ${!!closedSession.session_ended_at}`)

      // Nettoyer
      await supabase
        .from('openai_realtime_sessions')
        .delete()
        .eq('session_id', testSessionId)
      
      fullTest.steps.push('✅ Session test nettoyée')
      fullTest.success = true

    } catch (err: any) {
      fullTest.error = err.message
    }

    logger.info('🔍 [DIAGNOSTIC] Test complet:', fullTest)

    return NextResponse.json({
      success: true,
      diagnostic: {
        environment: envCheck,
        supabase_connection: supabaseTest,
        rpc_function: rpcCheck,
        recent_sessions: sessionsCheck,
        full_test: fullTest
      },
      recommendations: generateRecommendations(envCheck, supabaseTest, rpcCheck, fullTest)
    })

  } catch (error: any) {
    logger.error('🚨 [DIAGNOSTIC] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur diagnostic', details: error.message },
      { status: 500 }
    )
  }
}

function generateRecommendations(envCheck: any, supabaseTest: any, rpcCheck: any, fullTest: any) {
  const recommendations = []

  if (!envCheck.hasUrl || !envCheck.hasServiceKey) {
    recommendations.push('🚨 Variables d\'environnement manquantes - Vérifiez .env.local')
  }

  if (!supabaseTest.connected) {
    recommendations.push('🚨 Connexion Supabase échouée - Vérifiez les clés et l\'URL')
  }

  if (!rpcCheck.exists) {
    recommendations.push('🚨 Fonction RPC inexistante - Exécutez la migration SQL')
  }

  if (!fullTest.success && fullTest.error) {
    recommendations.push(`🚨 Test complet échoué: ${fullTest.error}`)
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Tous les tests passent - Le problème pourrait être dans le payload ou l\'authentification')
  }

  return recommendations
}

