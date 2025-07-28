import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-simple'

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Test du système de tracking...')
    
    const supabase = createClient()
    
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