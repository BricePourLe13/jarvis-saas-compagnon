import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface MemberLookupParams {
  params: Promise<{
    slug: string
    badgeId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: MemberLookupParams
) {
  try {
    const { slug, badgeId } = await params
    
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

    console.log(`🔍 Recherche membre avec badge ${badgeId} pour salle ${slug}`)

    // 2. Trouver la salle par slug
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('kiosk_config->kiosk_url_slug', slug)
      .single()

    if (gymError || !gym) {
      console.error('Salle introuvable:', gymError)
      return NextResponse.json({
        found: false,
        error: 'Salle introuvable'
      }, { status: 404 })
    }

    // 3. Chercher le membre par badge dans cette salle
    const { data: member, error: memberError } = await supabase
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
        is_active,
        can_use_jarvis
      `)
      .eq('badge_id', badgeId)
      .eq('gym_id', gym.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      console.warn(`Badge ${badgeId} non trouvé:`, memberError)
      
      // ⚠️ FALLBACK temporaire vers simulation
      // TODO: Retirer ce fallback une fois la base remplie
      const simulatedMembers = [
        {
          id: 'member_001',
          badge_id: 'BADGE_001',
          first_name: 'Pierre',
          last_name: 'Martin',
          email: 'pierre.martin@email.com',
          membership_type: 'Premium',
          member_preferences: {
            language: 'fr',
            goals: ['Perte de poids', 'Renforcement musculaire'],
            favorite_activities: ['Cardio', 'Musculation']
          },
          total_visits: 156,
          last_visit: '2024-01-20T09:30:00Z'
        },
        {
          id: 'member_002',
          badge_id: 'BADGE_002', 
          first_name: 'Sophie',
          last_name: 'Dubois',
          email: 'sophie.dubois@email.com',
          membership_type: 'Standard',
          member_preferences: {
            language: 'fr',
            goals: ['Flexibilité', 'Bien-être'],
            favorite_activities: ['Yoga', 'Pilates']
          },
          total_visits: 87,
          last_visit: '2024-01-19T18:45:00Z'
        },
        {
          id: 'member_003',
          badge_id: 'BADGE_003',
          first_name: 'Alex', 
          last_name: 'Chen',
          email: 'alex.chen@email.com',
          membership_type: 'Elite',
          member_preferences: {
            language: 'en',
            goals: ['Performance', 'Gain musculaire'],
            favorite_activities: ['CrossFit', 'Haltérophilie']
          },
          total_visits: 342,
          last_visit: '2024-01-21T07:15:00Z'
        }
      ]
      
      const simulatedMember = simulatedMembers.find(m => m.badge_id === badgeId)
      
      if (simulatedMember) {
        console.log(`📋 FALLBACK: Utilisation données simulées pour ${simulatedMember.first_name}`)
        return NextResponse.json({
          found: true,
          member: simulatedMember,
          context: {
            source: 'simulation',
            gym_name: gym.name,
            visit_count_today: 1
          }
        })
      }
      
      return NextResponse.json({
        found: false,
        error: 'Badge non reconnu'
      }, { status: 404 })
    }

    // 4. Enregistrer la visite et mettre à jour les stats
    try {
      // Utiliser la fonction SQL créée précédemment
      const { data: visitResult } = await supabase
        .rpc('log_member_visit', {
          p_badge_id: badgeId,
          p_gym_slug: slug
        })

      console.log(`✅ Visite enregistrée pour ${member.first_name} ${member.last_name}`)
    } catch (visitError) {
      console.warn('Erreur enregistrement visite:', visitError)
      // Ne pas faire échouer la requête pour cette erreur
    }

    // 5. Calculer contexte additionnel
    const lastVisitDaysAgo = member.last_visit 
      ? Math.floor((Date.now() - new Date(member.last_visit).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // 6. Retourner les données complètes
    return NextResponse.json({
      found: true,
      member: {
        id: member.id,
        gym_id: gym.id,
        badge_id: member.badge_id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone,
        membership_type: member.membership_type,
        member_since: member.member_since,
        member_preferences: member.member_preferences,
        total_visits: member.total_visits,
        last_visit: member.last_visit,
        is_active: member.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      context: {
        source: 'database',
        gym_name: gym.name,
        last_visit_days_ago: lastVisitDaysAgo,
        visit_count_today: 1, // TODO: Calculer le vrai nombre
        can_use_jarvis: member.can_use_jarvis
      }
    })

  } catch (error) {
    console.error('Erreur lookup membre:', error)
    return NextResponse.json({
      found: false,
      error: 'Erreur serveur lors de la recherche membre'
    }, { status: 500 })
  }
}

// POST endpoint pour créer un nouveau membre (si le badge n'existe pas)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; badgeId: string }> }
) {
  try {
    const { slug, badgeId } = await params
    const body = await request.json()
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

    // Valider le kiosk
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('kiosk_config->>kiosk_url_slug', slug)
      .single()

    if (gymError || !gym) {
      return NextResponse.json(
        { error: 'Kiosk non trouvé' },
        { status: 404 }
      )
    }

    // Créer le nouveau membre
    const { data: newMember, error: createError } = await supabase
      .from('gym_members')
      .insert({
        gym_id: gym.id,
        badge_id: badgeId,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        membership_type: body.membership_type || 'standard',
        member_preferences: body.member_preferences || {
          language: 'fr',
          goals: [],
          dietary_restrictions: [],
          favorite_activities: [],
          notification_preferences: {
            email: true,
            sms: false
          }
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('[KIOSK] Erreur création membre:', createError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du membre' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: newMember
    })

  } catch (error) {
    console.error('[KIOSK] Erreur POST membre:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 