import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/gyms
 * Liste toutes les salles avec leurs stats
 * Réservé aux super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 1. Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profil utilisateur introuvable' }, { status: 404 })
    }

    // 3. Vérifier permissions super_admin
    if (userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé - Super admin requis' }, { status: 403 })
    }

    // 4. Récupérer toutes les salles (MVP)
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        city,
        address,
        postal_code,
        status,
        legacy_franchise_name,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (gymsError) {
      console.error('[API] Error fetching gyms:', gymsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des salles' }, { status: 500 })
    }

    // 5. Pour chaque gym, récupérer le nombre de kiosks et membres
    const gymsWithStats = await Promise.all(
      (gyms || []).map(async (gym: any) => {
        // Compter les kiosks
        const { count: kiosksCount } = await supabase
          .from('kiosks')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)

        // Compter les membres
        const { count: membersCount } = await supabase
          .from('gym_members')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)

        return {
          id: gym.id,
          name: gym.name,
          city: gym.city,
          address: gym.address,
          postal_code: gym.postal_code,
          status: gym.status,
          legacy_franchise_name: gym.legacy_franchise_name,
          total_kiosks: kiosksCount || 0,
          total_members: membersCount || 0,
          created_at: gym.created_at
        }
      })
    )

    // 6. Calculer métriques globales
    const metrics = {
      totalGyms: gymsWithStats.length,
      activeGyms: gymsWithStats.filter(g => g.status === 'active').length,
      suspendedGyms: gymsWithStats.filter(g => g.status === 'suspended').length,
      totalMembers: gymsWithStats.reduce((sum, g) => sum + g.total_members, 0)
    }

    return NextResponse.json({
      gyms: gymsWithStats,
      metrics
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/gyms:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/admin/gyms
 * Créer une nouvelle salle (avec invitation gérant + provisioning kiosks)
 * Réservé aux super_admin
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // 1. Vérifier l'auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Vérifier permissions super_admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé - Super admin requis' }, { status: 403 })
    }

    // 3. Parser body
    const body = await request.json()
    const {
      name,
      address,
      city,
      postal_code,
      phone,
      email,
      manager_option,
      manager_email,
      manager_name,
      manager_phone,
      existing_manager_id,
      kiosk_count
    } = body

    // 4. Créer la salle
    const { data: newGym, error: gymError } = await supabase
      .from('gyms')
      .insert({
        name,
        address,
        city,
        postal_code,
        phone,
        contact_email: email,
        status: 'active'
      })
      .select()
      .single()

    if (gymError) {
      console.error('[API] Error creating gym:', gymError)
      return NextResponse.json({ error: 'Erreur lors de la création de la salle' }, { status: 500 })
    }

    // 5. Gérer le gérant
    let manager_id: string | null = null

    if (manager_option === 'new') {
      // Envoyer invitation via API dédiée
      try {
        const invitationRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/invitations/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            email: manager_email,
            full_name: manager_name,
            gym_id: newGym.id
          })
        })

        if (!invitationRes.ok) {
          console.error('[API] Error sending manager invitation')
          // Continue quand même, on peut renvoyer l'invitation plus tard
        }
      } catch (inviteError) {
        console.error('[API] Error sending manager invitation:', inviteError)
        // Continue quand même
      }
    } else if (manager_option === 'existing' && existing_manager_id) {
      // Assigner gérant existant à cette salle
      const { error: updateError } = await supabase
        .from('users')
        .update({
          gym_id: newGym.id,
          gym_access: supabase.rpc('array_append', { 
            array: 'gym_access', 
            value: newGym.id 
          })
        })
        .eq('id', existing_manager_id)

      if (!updateError) {
        manager_id = existing_manager_id
      }
    }

    // 6. Provisionner les kiosks
    const kiosks = []
    for (let i = 0; i < kiosk_count; i++) {
      const provisionCode = randomBytes(16).toString('hex')
      
      const { data: newKiosk, error: kioskError } = await supabase
        .from('kiosks')
        .insert({
          gym_id: newGym.id,
          name: `Kiosk ${i + 1}`,
          provision_code: provisionCode,
          status: 'provisioning'
        })
        .select()
        .single()

      if (!kioskError && newKiosk) {
        kiosks.push({
          id: newKiosk.id,
          name: newKiosk.name,
          provision_code: provisionCode,
          provision_url: `${process.env.NEXT_PUBLIC_APP_URL}/kiosk/provision/${provisionCode}`
        })
      }
    }

    // 7. Log action (audit trail)
    await supabase
      .from('system_logs')
      .insert({
        event_type: 'gym_created',
        user_id: session.user.id,
        resource_type: 'gym',
        resource_id: newGym.id,
        metadata: {
          gym_name: name,
          manager_email: manager_email || null,
          kiosk_count
        }
      })

    return NextResponse.json({
      success: true,
      gym: newGym,
      manager_id,
      kiosks
    })

  } catch (error) {
    console.error('[API] Unexpected error in POST /api/dashboard/admin/gyms:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
