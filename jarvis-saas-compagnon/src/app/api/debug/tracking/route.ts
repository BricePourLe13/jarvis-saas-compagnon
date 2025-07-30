import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

// 📊 POST: Tracker les erreurs de session JARVIS pour monitoring admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, status, error, gymSlug, memberId, timestamp } = body
    
    if (type === 'voice_session_error') {
      const supabase = createSimpleClient()
      
      // Stocker l'erreur en base pour monitoring admin
      const { data, error: insertError } = await supabase
        .from('jarvis_errors_log')
        .insert({
          error_type: 'voice_session_creation',
          error_status: status,
          error_details: error,
          gym_slug: gymSlug,
          member_id: memberId,
          timestamp: timestamp || new Date().toISOString(),
          metadata: {
            source: 'kiosk',
            api: '/api/voice/session',
            model: 'gpt-4o-mini-realtime-preview-2024-12-17'
          }
        })
      
      if (insertError) {
        console.error('❌ [TRACKING] Erreur stockage error log:', insertError)
        // Continuer même si le stockage échoue
      } else {
        console.log('✅ [TRACKING] Erreur voice session stockée pour admin dashboard')
      }
      
      return NextResponse.json({
        success: true,
        message: 'Error tracked successfully',
        logged: !insertError
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Unknown tracking type'
    }, { status: 400 })
    
  } catch (error) {
    console.error('❌ [TRACKING] Erreur API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Test du système de tracking...')
    
    const supabase = createSimpleClient()
    
    // 1. Vérifier que la table existe
    const { data: tables, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: 'jarvis_session_costs' })
      .single()
    
    if (tablesError) {
      console.log('🔍 [DEBUG] Tentative de query directe...')
      // Fallback: essayer une query directe simple
      const { data: testData, error: testError } = await supabase
        .from('jarvis_session_costs')
        .select('count(*)')
        .limit(1)
      
      if (testError) {
        return NextResponse.json({
          success: false,
          error: 'Table jarvis_session_costs inaccessible',
          details: testError,
          suggestion: 'Vérifiez que la table existe dans Supabase et que les permissions sont correctes'
        }, { status: 500 })
      }
    }
    
    // 2. Compter les sessions existantes
    const { count: totalSessions, error: countError } = await supabase
      .from('jarvis_session_costs')
      .select('*', { count: 'exact', head: true })
    
    // 3. Récupérer quelques sessions récentes
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('jarvis_session_costs')
      .select('session_id, gym_id, total_cost, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5)
    
    // 4. Vérifier les gyms disponibles
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name, franchise_id')
      .limit(3)
    
    return NextResponse.json({
      success: true,
      tracking_system: {
        table_accessible: !countError,
        total_sessions: totalSessions || 0,
        recent_sessions: recentSessions || [],
        available_gyms: gyms || []
      },
      errors: {
        count_error: countError,
        sessions_error: sessionsError,
        gyms_error: gymsError
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🔍 [DEBUG] Erreur test tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test du système de tracking',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 