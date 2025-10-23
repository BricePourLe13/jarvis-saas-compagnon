/**
 * 📝 JARVIS TOOL: log_member_interaction
 * Enregistrement interactions importantes pour escalation gérant
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { 
      interaction_type, 
      urgency_level, 
      content, 
      equipment_mentioned,
      requires_follow_up = false
    } = await request.json()

    // 📝 RÉCUPÉRER CONTEXTE MEMBRE DEPUIS LA SESSION
    const memberContext = (global as any).currentMemberContext
    if (!memberContext?.member_id) {
      return NextResponse.json(
        { error: 'Contexte membre non disponible. Outil appelé hors session.' },
        { status: 400 }
      )
    }

    const member_id = memberContext.member_id
    const session_id = memberContext.session_id
    console.log(`📝 [TOOL] log_member_interaction - Type: ${interaction_type}, Urgence: ${urgency_level}`)

    if (!interaction_type || !urgency_level || !content) {
      return NextResponse.json(
        { error: 'Paramètres requis: interaction_type, urgency_level, content' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // 🔍 RÉCUPÉRER INFOS MEMBRE ET GYM
    const { data: member, error: memberError } = await supabase
      .from('gym_members_v2')
      .select(`
        id, 
        first_name, 
        last_name, 
        badge_id,
        gym_id,
        gyms!inner(id, name, manager_id)
      `)
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      console.error(`❌ [TOOL] Membre non trouvé: ${member_id}`, memberError)
      return NextResponse.json(
        { error: 'Membre non trouvé' },
        { status: 404 }
      )
    }

    // 🎯 DÉTERMINER PRIORITÉ NOTIFICATION
    const priorityMapping = {
      'low': 1,
      'medium': 2, 
      'high': 3,
      'urgent': 4
    }

    const shouldNotifyImmediately = urgency_level === 'urgent' || urgency_level === 'high'
    
    // 📊 ENREGISTRER INTERACTION
    const interactionData = {
      member_id,
      session_id: session_id || null,
      gym_id: member.gym_id,
      interaction_type,
      urgency_level,
      priority_score: priorityMapping[urgency_level] || 2,
      content,
      equipment_mentioned: equipment_mentioned || null,
      requires_follow_up,
      member_name: `${member.first_name} ${member.last_name}`,
      member_badge_id: member.badge_id,
      gym_name: member.gyms?.name || 'Gym inconnu',
      manager_id: member.gyms?.manager_id || null,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Enregistrer dans jarvis_conversation_logs avec flag spécial
    const { data: logEntry, error: logError } = await supabase
      .from('jarvis_conversation_logs')
      .insert({
        session_id: session_id || `interaction_${Date.now()}`,
        member_id,
        gym_id: member.gym_id,
        speaker: 'system',
        message_text: `[INTERACTION ${interaction_type.toUpperCase()}] ${content}`,
        detected_intent: interaction_type,
        topic_category: 'member_feedback',
        contains_complaint: interaction_type === 'equipment_issue' || interaction_type === 'service_complaint',
        contains_feedback: true,
        urgency_flag: urgency_level,
        requires_staff_attention: shouldNotifyImmediately,
        equipment_mentioned: equipment_mentioned,
        timestamp: new Date().toISOString(),
        metadata: {
          tool_generated: true,
          interaction_type,
          urgency_level,
          requires_follow_up,
          priority_score: priorityMapping[urgency_level]
        }
      })
      .select()
      .single()

    if (logError) {
      console.error(`❌ [TOOL] Erreur enregistrement interaction:`, logError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // 🚨 NOTIFICATION GÉRANT SI URGENCE ÉLEVÉE
    let notificationSent = false
    if (shouldNotifyImmediately && member.gyms?.manager_id) {
      try {
        // Créer notification pour le gérant
        const notificationData = {
          recipient_id: member.gyms.manager_id,
          type: 'urgent_member_interaction',
          title: `${interaction_type === 'equipment_issue' ? '⚠️ Problème équipement' : '🚨 Interaction urgente'}`,
          message: `${member.first_name} ${member.last_name} (${member.badge_id}) - ${content}`,
          data: {
            member_id,
            gym_id: member.gym_id,
            interaction_type,
            urgency_level,
            equipment_mentioned,
            log_entry_id: logEntry.id
          },
          priority: urgency_level,
          is_read: false,
          created_at: new Date().toISOString()
        }

        // Tenter d'insérer la notification (table peut ne pas exister encore)
        await supabase
          .from('manager_notifications')
          .insert(notificationData)
        
        notificationSent = true
        console.log(`🔔 [TOOL] Notification envoyée au gérant pour interaction ${urgency_level}`)
      } catch (notifError) {
        console.log('ℹ️ [TOOL] Table manager_notifications non disponible, notification non envoyée')
      }
    }

    // 📈 MISE À JOUR COMPTEURS MEMBRE
    try {
      await supabase.rpc('increment_member_interaction_count', {
        p_member_id: member_id,
        p_interaction_type: interaction_type
      })
    } catch (rpcError) {
      console.log('ℹ️ [TOOL] RPC increment_member_interaction_count non disponible')
    }

    const responseMessage = generateResponseMessage(interaction_type, urgency_level, member.first_name)

    console.log(`✅ [TOOL] Interaction enregistrée: ${interaction_type} (${urgency_level}) pour ${member.first_name}`)

    return NextResponse.json({
      success: true,
      interaction_logged: {
        id: logEntry.id,
        member_name: `${member.first_name} ${member.last_name}`,
        interaction_type,
        urgency_level,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        logged_at: logEntry.timestamp
      },
      notification_sent: notificationSent,
      follow_up_required: requires_follow_up,
      jarvis_response: responseMessage
    })

  } catch (error: any) {
    console.error('🚨 [TOOL] Erreur log_member_interaction:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Générer réponse appropriée selon le type d'interaction
 */
function generateResponseMessage(interactionType: string, urgencyLevel: string, memberName: string): string {
  const responses = {
    equipment_issue: {
      urgent: `J'ai immédiatement signalé ce problème d'équipement à l'équipe, ${memberName}. Ils vont s'en occuper en priorité !`,
      high: `J'ai transmis ce problème d'équipement à l'équipe, ${memberName}. Ils vont regarder ça rapidement.`,
      medium: `Merci de m'avoir signalé ce problème, ${memberName}. J'ai noté ça pour l'équipe.`,
      low: `C'est noté ${memberName}, je transmets cette information à l'équipe.`
    },
    service_complaint: {
      urgent: `Je comprends ta frustration ${memberName}. J'ai alerté le gérant immédiatement pour qu'il puisse te contacter.`,
      high: `Merci de m'avoir fait part de ça ${memberName}. J'ai transmis ton retour au gérant.`,
      medium: `J'ai bien noté ton retour ${memberName}, l'équipe va en prendre connaissance.`,
      low: `Merci pour ce retour ${memberName}, c'est important pour nous améliorer.`
    },
    suggestion: {
      urgent: `Excellente suggestion ${memberName} ! Je la transmets immédiatement à l'équipe.`,
      high: `Super idée ${memberName} ! Je fais remonter ça à l'équipe.`,
      medium: `Merci pour cette suggestion ${memberName}, je la note pour l'équipe.`,
      low: `C'est une bonne idée ${memberName}, je la transmets à l'équipe.`
    },
    facility_feedback: {
      urgent: `Merci pour ce retour important ${memberName}. L'équipe va regarder ça en priorité.`,
      high: `Merci ${memberName}, j'ai transmis ton retour à l'équipe.`,
      medium: `C'est noté ${memberName}, merci pour ce retour constructif.`,
      low: `Merci ${memberName}, tous les retours sont précieux pour nous.`
    }
  }

  return responses[interactionType]?.[urgencyLevel] || 
         `Merci ${memberName}, j'ai bien noté ton message et je le transmets à l'équipe.`
}
