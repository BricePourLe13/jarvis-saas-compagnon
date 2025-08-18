/**
 * 💬 API LOGGING INTERACTIONS JARVIS
 * Endpoint pour logger les conversations en temps réel
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { simpleLogger } from '@/lib/jarvis-simple-logger'

interface LogInteractionRequest {
  session_id: string
  member_id?: string
  speaker: 'user' | 'jarvis'
  message_text: string
  member_badge_id?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body: LogInteractionRequest = await request.json()

    console.log('📝 [API LOG] Nouvelle interaction pour:', slug)

    // 1. Initialiser Supabase
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

    // 2. Récupérer la salle par slug
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('kiosk_config->kiosk_url_slug', slug)
      .single()

    if (gymError || !gym) {
      console.error('❌ [API LOG] Salle introuvable:', gymError)
      return NextResponse.json({
        success: false,
        error: 'Salle introuvable'
      }, { status: 404 })
    }

    // 3. Si on a un badge_id, récupérer le member_id
    let memberId = body.member_id
    if (!memberId && body.member_badge_id) {
      const { data: member } = await supabase
        .from('gym_members')
        .select('id')
        .eq('badge_id', body.member_badge_id)
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .single()
      
      memberId = member?.id
    }

    // 4. Logger l'interaction
    const success = await simpleLogger.logMessage({
      session_id: body.session_id,
      member_id: memberId,
      gym_id: gym.id,
      speaker: body.speaker,
      message_text: body.message_text,
      turn_number: 0, // Sera calculé automatiquement
      timestamp: new Date()
    })

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du logging'
      }, { status: 500 })
    }

    // 5. Si c'est un message utilisateur, analyser pour enrichir le profil
    if (body.speaker === 'user' && memberId) {
      await enrichMemberProfile(supabase, memberId, body.message_text)
    }

    return NextResponse.json({
      success: true,
      logged: true,
      gym_id: gym.id,
      member_id: memberId
    })

  } catch (error) {
    console.error('💥 [API LOG] Exception:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * 🧠 Enrichir le profil membre basé sur la conversation
 */
async function enrichMemberProfile(supabase: any, memberId: string, message: string) {
  try {
    const lower = message.toLowerCase()
    const updates: any = {}

    // Détecter des objectifs mentionnés
    const detectedGoals = []
    if (lower.includes('perdre du poids') || lower.includes('maigrir')) {
      detectedGoals.push('lose_weight')
    }
    if (lower.includes('muscle') || lower.includes('prendre du muscle')) {
      detectedGoals.push('build_muscle')
    }
    if (lower.includes('endurance') || lower.includes('cardio')) {
      detectedGoals.push('endurance')
    }

    // Détecter des préférences d'activités
    const detectedActivities = []
    if (lower.includes('musculation') || lower.includes('poids')) {
      detectedActivities.push('strength_training')
    }
    if (lower.includes('course') || lower.includes('tapis')) {
      detectedActivities.push('running')
    }
    if (lower.includes('vélo') || lower.includes('spinning')) {
      detectedActivities.push('cycling')
    }

    // Détecter style de communication préféré
    let communicationStyle = null
    if (lower.includes('motivez-moi') || lower.includes('encouragez-moi')) {
      communicationStyle = 'motivational'
    } else if (lower.includes('simple') || lower.includes('direct')) {
      communicationStyle = 'direct'
    }

    // Mettre à jour le profil si on a détecté quelque chose
    if (detectedGoals.length > 0) {
      // Récupérer les objectifs actuels
      const { data: currentMember } = await supabase
        .from('gym_members')
        .select('fitness_goals')
        .eq('id', memberId)
        .single()

      if (currentMember) {
        const currentGoals = currentMember.fitness_goals || []
        const mergedGoals = [...new Set([...currentGoals, ...detectedGoals])]
        updates.fitness_goals = mergedGoals
      }
    }

    if (detectedActivities.length > 0) {
      // Récupérer les activités actuelles
      const { data: currentMember } = await supabase
        .from('gym_members')
        .select('favorite_equipment')
        .eq('id', memberId)
        .single()

      if (currentMember) {
        const currentActivities = currentMember.favorite_equipment || []
        const mergedActivities = [...new Set([...currentActivities, ...detectedActivities])]
        updates.favorite_equipment = mergedActivities
      }
    }

    if (communicationStyle) {
      updates.communication_style = communicationStyle
    }

    // Appliquer les mises à jour
    if (Object.keys(updates).length > 0) {
      updates.last_profile_update = new Date().toISOString()
      
      const { error } = await supabase
        .from('gym_members')
        .update(updates)
        .eq('id', memberId)

      if (error) {
        console.error('❌ [ENRICHMENT] Erreur mise à jour profil:', error)
      } else {
        console.log('✅ [ENRICHMENT] Profil enrichi:', updates)
      }
    }

  } catch (error) {
    console.error('💥 [ENRICHMENT] Exception:', error)
  }
}

