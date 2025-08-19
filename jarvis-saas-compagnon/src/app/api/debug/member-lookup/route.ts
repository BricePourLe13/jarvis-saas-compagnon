import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const badgeId = searchParams.get('badgeId') || 'BADGE_001'
    const slug = searchParams.get('slug') || 'gym-yatblc8h'
    
    const supabase = getSupabaseService()
    
    console.log(`🔍 DEBUG: Recherche ${badgeId} pour ${slug}`)
    
    // 1. Vérifier les gyms
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
      .limit(5)
    
    console.log('🏢 Gyms trouvées:', gyms?.length, gymsError)
    
    // 2. Chercher par slug
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, kiosk_config')
      .eq('kiosk_config->kiosk_url_slug', slug)
      .single()
    
    console.log('🎯 Gym par slug:', gym?.id, gymError)
    
    // 3. Vérifier les membres
    const { data: members, error: membersError } = await supabase
      .from('gym_members')
      .select('badge_id, first_name, last_name, gym_id')
      .in('badge_id', ['BADGE_001', 'BADGE_002', 'BADGE_003'])
      .limit(10)
    
    console.log('👥 Membres trouvés:', members?.length, membersError)
    
    // 4. Test direct sans can_use_jarvis
    let member = null
    let memberError = null
    
    if (gym?.id) {
      const result = await supabase
        .from('gym_members')
        .select(`
          id,
          badge_id,
          first_name,
          last_name,
          email,
          phone,
          membership_type,
          member_since,
          member_preferences,
          total_visits,
          last_visit,
          is_active
        `)
        .eq('badge_id', badgeId)
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .single()
      
      member = result.data
      memberError = result.error
    }
    
    return NextResponse.json({
      debug: {
        badgeId,
        slug,
        gymsFound: gyms?.length,
        gymFound: !!gym,
        gymId: gym?.id,
        membersTotal: members?.length,
        memberFound: !!member,
        memberData: member
      },
      errors: {
        gyms: gymsError,
        gym: gymError,
        members: membersError,
        member: memberError
      },
      data: {
        gyms: gyms?.slice(0, 2), // Limiter pour debug
        gym,
        members,
        member
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur debug:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
