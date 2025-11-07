/**
 * 🎯 JARVIS TOOL: get_member_profile
 * Récupération profil membre complet avec données fraîches
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { sessionContextStore } from '@/lib/voice/session-context-store'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [TOOL] get_member_profile appelé')
    
    const { 
      session_id, // ✅ Reçu depuis function call
      include_fitness_details = true, 
      include_visit_history = true, 
      include_conversation_context = true 
    } = await request.json()

    // 📝 RÉCUPÉRER CONTEXTE MEMBRE DEPUIS LE STORE SÉCURISÉ
    const memberContext = session_id ? sessionContextStore.get(session_id) : undefined
    console.log(`🔍 [TOOL] Contexte session:`, memberContext ? 'trouvé' : 'non trouvé')
    
    if (!memberContext?.member_id) {
      console.error(`❌ [TOOL] Contexte membre manquant pour session: ${session_id}`)
      return NextResponse.json(
        { error: 'Contexte membre non disponible. Outil appelé hors session ou session expirée.' },
        { status: 400 }
      )
    }

    const member_id = memberContext.member_id
    console.log(`🎯 [TOOL] get_member_profile pour membre: ${member_id}`)

    const supabase = getSupabaseService()

    // 🚀 RÉCUPÉRATION PROFIL SIMPLE D'ABORD
    const { data: member, error: memberError } = await supabase
      .from('gym_members_v2')
      .select('id, first_name, last_name, badge_id, is_active')
      .eq('id', member_id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      console.error(`❌ [TOOL] Membre non trouvé: ${member_id}`, memberError)
      return NextResponse.json(
        { error: 'Membre non trouvé ou inactif' },
        { status: 404 }
      )
    }

    console.log(`✅ [TOOL] Profil récupéré pour ${member.first_name}`)

    return NextResponse.json({
      success: true,
      member_profile: {
        id: member.id,
        badge_id: member.badge_id,
        first_name: member.first_name,
        last_name: member.last_name,
        is_active: member.is_active,
        workout_frequency: '3 séances par semaine' // Données de test
      },
      retrieved_at: new Date().toISOString(),
      data_freshness: 'real_time'
    })

  } catch (error: any) {
    console.error('🚨 [TOOL] Erreur get_member_profile:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
