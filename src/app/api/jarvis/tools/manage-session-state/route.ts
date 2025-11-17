/**
 * 🎯 JARVIS TOOL: manage_session_state
 * Gestion intelligente de l'état de session (terminaison, pause, extension)
 */

import { logger } from '@/lib/production-logger';
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { sessionContextStore } from '@/lib/voice/session-context-store'

export async function POST(request: NextRequest) {
  try {
    const { 
      session_id, // ✅ Reçu depuis function call
      action, 
      reason,
      extend_duration_minutes,
      farewell_message 
    } = await request.json()

    // 📝 RÉCUPÉRER CONTEXTE MEMBRE DEPUIS LE STORE SÉCURISÉ
    const memberContext = session_id ? sessionContextStore.get(session_id) : undefined
    if (!memberContext?.member_id) {
      return NextResponse.json(
        { error: 'Contexte membre non disponible. Outil appelé hors session ou session expirée.' },
        { status: 400 }
      )
    }

    const { member_id, gym_slug } = memberContext
    logger.info(`🎯 [TOOL] manage_session_state - Action: ${action}, Raison: ${reason}`)

    if (!action) {
      return NextResponse.json(
        { error: 'Paramètre requis: action' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // 🔍 RÉCUPÉRER INFOS SESSION ET MEMBRE
    const { data: member, error: memberError } = await supabase
      .from('gym_members_v2')
      .select(`
        id, 
        first_name, 
        last_name, 
        badge_id,
        gym_id,
        member_preferences,
        total_visits
      `)
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      logger.error(`❌ [TOOL] Membre non trouvé: ${member_id}`, memberError)
      return NextResponse.json(
        { error: 'Membre non trouvé' },
        { status: 404 }
      )
    }

    let responseMessage = ''
    let shouldEndSession = false
    let sessionExtended = false

    // 🎯 TRAITEMENT SELON L'ACTION
    switch (action) {
      case 'prepare_goodbye':
        // Préparer une terminaison naturelle
        const goodbyeMessages = [
          `Parfait ${member.first_name} ! J'espère t'avoir aidé aujourd'hui. À bientôt !`,
          `Super séance ${member.first_name} ! Prends soin de toi et à la prochaine !`,
          `C'était un plaisir de t'accompagner ${member.first_name}. Bon entraînement !`,
          `Excellente session ${member.first_name} ! Continue comme ça, à bientôt !`
        ]
        
        responseMessage = farewell_message || goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)]
        shouldEndSession = true
        
        // Log de la terminaison naturelle
        await supabase
          .from('jarvis_conversation_logs')
          .insert({
            session_id,
            member_id,
            gym_id: member.gym_id,
            speaker: 'system',
            message_text: `[SESSION END] Terminaison naturelle: ${reason || 'conversation terminée'}`,
            detected_intent: 'session_end',
            topic_category: 'session_management',
            timestamp: new Date().toISOString(),
            metadata: {
              tool_generated: true,
              end_reason: reason || 'natural_conversation_end',
              farewell_message: responseMessage
            }
          })
        break

      case 'extend_session':
        // Étendre la session pour un membre engagé
        const extensionMinutes = extend_duration_minutes || 5
        
        responseMessage = `Bien sûr ${member.first_name} ! Je reste avec toi encore ${extensionMinutes} minutes. Qu'est-ce que tu veux savoir ?`
        sessionExtended = true
        
        // Mettre à jour la session en base
        await supabase
          .from('openai_realtime_sessions')
          .update({ 
            session_extended_at: new Date().toISOString(),
            extension_duration_minutes: extensionMinutes,
            last_activity_at: new Date().toISOString()
          })
          .eq('session_id', session_id)
        
        // Log de l'extension
        await supabase
          .from('jarvis_conversation_logs')
          .insert({
            session_id,
            member_id,
            gym_id: member.gym_id,
            speaker: 'system',
            message_text: `[SESSION EXTENDED] Durée prolongée de ${extensionMinutes} minutes`,
            detected_intent: 'session_extension',
            topic_category: 'session_management',
            timestamp: new Date().toISOString(),
            metadata: {
              tool_generated: true,
              extension_minutes: extensionMinutes,
              reason: reason || 'member_engagement'
            }
          })
        break

      case 'pause_session':
        // Pause temporaire (membre s'absente)
        responseMessage = `Pas de problème ${member.first_name} ! Je t'attends ici. Reviens quand tu veux !`
        
        // Log de la pause
        await supabase
          .from('jarvis_conversation_logs')
          .insert({
            session_id,
            member_id,
            gym_id: member.gym_id,
            speaker: 'system',
            message_text: `[SESSION PAUSED] Session en pause: ${reason || 'membre absent temporairement'}`,
            detected_intent: 'session_pause',
            topic_category: 'session_management',
            timestamp: new Date().toISOString(),
            metadata: {
              tool_generated: true,
              pause_reason: reason || 'temporary_absence'
            }
          })
        break

      case 'check_engagement':
        // Vérifier l'engagement du membre
        const visitCount = member.total_visits || 0
        const isRegular = visitCount > 50
        const isNewbie = visitCount < 10
        
        if (isNewbie) {
          responseMessage = `${member.first_name}, j'espère que tu te sens à l'aise ! N'hésite pas si tu as des questions.`
        } else if (isRegular) {
          responseMessage = `Toujours un plaisir de te voir ${member.first_name} ! Comment ça se passe ton entraînement ?`
        } else {
          responseMessage = `Salut ${member.first_name} ! Comment puis-je t'aider aujourd'hui ?`
        }
        
        // Log du check d'engagement
        await supabase
          .from('jarvis_conversation_logs')
          .insert({
            session_id,
            member_id,
            gym_id: member.gym_id,
            speaker: 'system',
            message_text: `[ENGAGEMENT CHECK] Vérification engagement membre (${visitCount} visites)`,
            detected_intent: 'engagement_check',
            topic_category: 'session_management',
            timestamp: new Date().toISOString(),
            metadata: {
              tool_generated: true,
              visit_count: visitCount,
              member_type: isNewbie ? 'newbie' : isRegular ? 'regular' : 'occasional'
            }
          })
        break

      default:
        return NextResponse.json(
          { error: `Action non supportée: ${action}` },
          { status: 400 }
        )
    }

    logger.info(`✅ [TOOL] Session state géré: ${action} pour ${member.first_name}`)

    return NextResponse.json({
      success: true,
      action_performed: {
        action,
        member_name: `${member.first_name} ${member.last_name}`,
        reason: reason || 'non spécifié',
        should_end_session: shouldEndSession,
        session_extended: sessionExtended,
        extension_minutes: extend_duration_minutes || 0
      },
      jarvis_response: responseMessage,
      session_control: {
        end_session: shouldEndSession,
        extend_session: sessionExtended,
        pause_session: action === 'pause_session'
      }
    })

  } catch (error: any) {
    logger.error('🚨 [TOOL] Erreur manage_session_state:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}



