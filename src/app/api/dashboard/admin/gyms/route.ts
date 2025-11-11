import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    console.log('[API] Creating gym with data:', { name, address, city, postal_code, phone, email })
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
      return NextResponse.json({ error: `Erreur création salle: ${gymError.message}` }, { status: 500 })
    }
    
    console.log('[API] Gym created successfully:', newGym.id)

    // 5. Gérer le gérant
    let manager_id: string | null = null

    if (manager_option === 'new') {
      // Créer invitation directement (plus simple et plus fiable)
      try {
        console.log('[API] Creating invitation for:', manager_email)
        const token = randomBytes(32).toString('hex')
        
        // Utiliser service client pour bypass RLS (évite récursion)
        const serviceSupabase = createServiceClient()
        
        // Créer l'invitation en BDD
        const { data: invitation, error: invitationError } = await serviceSupabase
          .from('manager_invitations')
          .insert({
            email: manager_email,
            full_name: manager_name,
            gym_id: newGym.id,
            token,
            created_by: session.user.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()

        if (invitationError) {
          console.error('[API] Error creating invitation:', invitationError)
          throw new Error(`Invitation error: ${invitationError.message}`)
        }
        
        console.log('[API] Invitation created successfully')

        if (invitation) {
          // Envoyer l'email via Resend
          const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://jarvis-group.net'}/auth/invitation/${token}`
          
          try {
            await resend.emails.send({
              from: 'JARVIS <onboarding@resend.dev>',
              to: [manager_email],
              subject: `Invitation à gérer ${newGym.name} avec JARVIS`,
              html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #000; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #000; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🤖 Bienvenue sur JARVIS</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>${manager_name}</strong>,</p>
      <p>Vous avez été invité(e) à rejoindre JARVIS en tant que <strong>Gérant de salle</strong> pour :</p>
      <div class="info-box">
        <h3 style="margin: 0 0 10px 0;">🏋️ ${newGym.name}</h3>
        <p style="margin: 0; color: #666;">${newGym.city}</p>
      </div>
      <p>Cliquez sur le bouton ci-dessous pour créer votre compte :</p>
      <div style="text-align: center;">
        <a href="${invitationUrl}" class="button">Créer mon compte gérant</a>
      </div>
      <p style="font-size: 13px; color: #666;">Lien : <a href="${invitationUrl}">${invitationUrl}</a></p>
    </div>
  </div>
</body>
</html>
              `
            })
            console.log('[API] Invitation email sent to:', manager_email)
          } catch (emailError) {
            console.error('[API] Error sending email:', emailError)
            // Continue quand même, l'invitation est en BDD
          }
        }
      } catch (inviteError) {
        console.error('[API] Error creating invitation:', inviteError)
        // Continue quand même, on peut créer l'invitation manuellement plus tard
      }
    } else if (manager_option === 'existing' && existing_manager_id) {
      console.log('[API] Assigning existing manager:', existing_manager_id)
      // Assigner gérant existant à cette salle
      // D'abord récupérer gym_access actuel
      const { data: currentUser } = await supabase
        .from('users')
        .select('gym_access')
        .eq('id', existing_manager_id)
        .single()
      
      const currentAccess = currentUser?.gym_access || []
      const newAccess = [...currentAccess, newGym.id]
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          gym_id: newGym.id,
          gym_access: newAccess
        })
        .eq('id', existing_manager_id)

      if (updateError) {
        console.error('[API] Error assigning manager:', updateError)
      } else {
        manager_id = existing_manager_id
        console.log('[API] Manager assigned successfully')
      }
    }

    // 6. Provisionner les kiosks
    console.log('[API] Provisioning', kiosk_count, 'kiosks')
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

      if (kioskError) {
        console.error('[API] Error provisioning kiosk:', kioskError)
      } else if (newKiosk) {
        kiosks.push({
          id: newKiosk.id,
          name: newKiosk.name,
          provision_code: provisionCode,
          provision_url: `${process.env.NEXT_PUBLIC_APP_URL}/kiosk/provision/${provisionCode}`
        })
        console.log('[API] Kiosk provisioned:', newKiosk.id)
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
