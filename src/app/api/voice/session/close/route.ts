/**
 * 🏁 API SESSION CLOSE
 * Fin de session : extraction facts + génération summary + embeddings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { extractAndSaveFacts } from '@/lib/member-facts'
import { generateAndSaveSummary, buildTranscriptFromEvents } from '@/lib/conversation-summary'

export async function POST(request: NextRequest) {
  try {
    const { session_id, member_id, gym_id } = await request.json()

    console.log(`🏁 [SESSION CLOSE] Fermeture session: ${session_id}`)

    // Validation
    if (!session_id || !member_id || !gym_id) {
      return NextResponse.json(
        { error: 'session_id, member_id et gym_id requis' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // 🔍 RÉCUPÉRER LES ÉVÉNEMENTS DE LA SESSION
    console.log(`🔍 [SESSION CLOSE] Récupération événements...`)
    const { data: events, error: eventsError } = await supabase
      .from('conversation_events')
      .select('*')
      .eq('session_id', session_id)
      .order('timestamp', { ascending: true })

    if (eventsError) {
      console.error(`❌ [SESSION CLOSE] Erreur récupération événements:`, eventsError)
      return NextResponse.json(
        { error: 'Erreur récupération événements', details: eventsError.message },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      console.warn(`⚠️ [SESSION CLOSE] Aucun événement trouvé pour session ${session_id}`)
      return NextResponse.json({
        success: true,
        message: 'Session fermée mais aucun événement à traiter',
        facts_count: 0,
        summary_id: null
      })
    }

    console.log(`✅ [SESSION CLOSE] ${events.length} événements récupérés`)

    // 📝 CONSTRUIRE LE TRANSCRIPT
    const transcript = buildTranscriptFromEvents(events as any[])
    
    if (!transcript || transcript.trim().length === 0) {
      console.warn(`⚠️ [SESSION CLOSE] Transcript vide pour session ${session_id}`)
      return NextResponse.json({
        success: true,
        message: 'Session fermée mais transcript vide',
        facts_count: 0,
        summary_id: null
      })
    }

    console.log(`✅ [SESSION CLOSE] Transcript construit (${transcript.length} chars)`)

    // 🧠 EXTRACTION DES FACTS (background - ne pas bloquer)
    let factsCount = 0
    try {
      console.log(`🧠 [SESSION CLOSE] Extraction facts...`)
      factsCount = await extractAndSaveFacts(member_id, session_id, transcript)
      console.log(`✅ [SESSION CLOSE] ${factsCount} facts extraits et sauvegardés`)
    } catch (factsError: any) {
      console.error(`⚠️ [SESSION CLOSE] Erreur extraction facts:`, factsError)
      // Continue même si facts extraction échoue
    }

    // 📊 GÉNÉRATION SUMMARY + EMBEDDING (background - ne pas bloquer)
    let summaryId: string | null = null
    try {
      console.log(`📊 [SESSION CLOSE] Génération summary + embedding...`)
      summaryId = await generateAndSaveSummary({
        sessionId: session_id,
        memberId: member_id,
        gymId: gym_id,
        events: events as any[]
      })
      console.log(`✅ [SESSION CLOSE] Summary généré: ${summaryId}`)
    } catch (summaryError: any) {
      console.error(`⚠️ [SESSION CLOSE] Erreur génération summary:`, summaryError)
      // Continue même si summary génération échoue
    }

    // 🔄 METTRE À JOUR LE STATUT DE LA SESSION
    try {
      const { error: updateError } = await supabase
        .from('openai_realtime_sessions')
        .update({
          state: 'closed',
          session_ended_at: new Date().toISOString(),
          end_reason: 'normal_closure'
        })
        .eq('session_id', session_id)

      if (updateError) {
        console.error(`⚠️ [SESSION CLOSE] Erreur mise à jour session:`, updateError)
      }
    } catch (updateError: any) {
      console.error(`⚠️ [SESSION CLOSE] Erreur mise à jour session:`, updateError)
    }

    // 📈 OPTIONNEL : Trigger analytics calculation (background job)
    // Ce serait fait via pg_cron ou Upstash QStash
    // Pour l'instant on skip pour éviter timeout

    // ✅ RETOURNER RÉSULTAT
    return NextResponse.json({
      success: true,
      message: 'Session fermée et traitée avec succès',
      results: {
        facts_count: factsCount,
        summary_id: summaryId,
        events_count: events.length,
        transcript_length: transcript.length
      }
    })

  } catch (error: any) {
    console.error('🚨 [SESSION CLOSE] Erreur serveur:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// HEAD pour pre-warming
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
