import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 🎯 API de fallback pour logging côté client
 * Utilise createServerClient au lieu du service role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      session_id, 
      member_id, 
      gym_id, 
      speaker, 
      transcript, 
      conversation_turn_number, 
      metadata 
    } = body

    if (!session_id || !member_id || !gym_id || !speaker || !transcript) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Utiliser createServerClient (authentification utilisateur)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Insérer dans jarvis_conversation_logs
    const { data, error } = await supabase
      .from('jarvis_conversation_logs')
      .insert({
        session_id,
        member_id,
        gym_id,
        speaker,
        transcript,
        conversation_turn_number,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('❌ [CLIENT API] Error inserting interaction:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ [CLIENT API] Interaction logged:', { session_id, speaker, turn: conversation_turn_number })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('❌ [CLIENT API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
