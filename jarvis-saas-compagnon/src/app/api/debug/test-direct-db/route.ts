import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🔬 [TEST DIRECT DB] Données reçues:', data)
    
    const supabase = getSupabaseService()
    console.log('🔬 [TEST DIRECT DB] Client Supabase obtenu')

    // Test 1: Insérer directement
    const insertData = {
      session_id: data.session_id,
      gym_id: data.gym_id,
      member_id: data.member_id,
      speaker: data.speaker,
      message_text: data.message_text,
      timestamp: new Date().toISOString(),
      conversation_turn_number: 1, // Nom correct de la colonne
      // Données d'analyse de base
      detected_intent: 'test',
      sentiment_score: 0.5,
      response_time_ms: 100,
      confidence_score: 0.9
    }

    console.log('🔬 [TEST DIRECT DB] Données à insérer:', insertData)

    const { data: result, error } = await supabase
      .from('jarvis_conversation_logs')
      .insert([insertData])
      .select()

    if (error) {
      console.error('❌ [TEST DIRECT DB] Erreur insertion:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('✅ [TEST DIRECT DB] Insertion réussie:', result)

    // Test 2: Vérifier que c'est bien là
    const { data: verification, error: verifyError } = await supabase
      .from('jarvis_conversation_logs')
      .select('*')
      .eq('session_id', data.session_id)

    if (verifyError) {
      console.error('❌ [TEST DIRECT DB] Erreur vérification:', verifyError)
    } else {
      console.log('🔍 [TEST DIRECT DB] Vérification:', verification)
    }

    return NextResponse.json({
      success: true,
      message: 'Test direct BDD réussi',
      inserted: result,
      verified: verification
    })

  } catch (error: any) {
    console.error('💥 [TEST DIRECT DB] Exception:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
