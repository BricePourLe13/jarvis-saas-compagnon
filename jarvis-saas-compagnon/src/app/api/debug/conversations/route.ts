import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService()
    
    // Récupérer les dernières conversations
    const { data: conversations, error } = await supabase
      .from('jarvis_conversation_logs')
      .select(`
        id,
        session_id,
        speaker,
        message_text,
        timestamp,
        gym_id,
        member_id
      `)
      .order('timestamp', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erreur récupération conversations:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Stats rapides
    const { data: stats } = await supabase
      .from('jarvis_conversation_logs')
      .select('id, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      success: true,
      data: {
        recent_conversations: conversations || [],
        total_today: stats?.length || 0,
        last_conversation: conversations?.[0]?.timestamp || null
      }
    })

  } catch (error: any) {
    console.error('Erreur debug conversations:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
