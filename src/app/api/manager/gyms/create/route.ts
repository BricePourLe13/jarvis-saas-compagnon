import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * 🏋️ POST /api/manager/gyms/create
 * 
 * SELF-SERVICE: Gérant créé sa propre salle après acceptation invitation
 * 
 * Body:
 *   - name: string (required)
 *   - address: string (required)
 *   - city: string (required)
 *   - postal_code: string (required)
 *   - phone: string (optional)
 *   - opening_hours: object (optional - defaults provided)
 * 
 * Flow:
 *   1. Vérifie que user est gym_manager
 *   2. Vérifie qu'il n'a pas déjà créé de salle
 *   3. Créé gym (status: pending_approval)
 *   4. Créé kiosk principal (status: provisioning)
 *   5. Retourne code provisioning
 */

// Générer slug unique pour kiosk
function generateKioskSlug(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `kiosk-${timestamp}-${random}`
}

// Générer code provisioning (6 caractères alphanumériques)
function generateProvisioningCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sans O, 0, I, 1 (confusion)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )

    // 1. Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Vérifier que l'utilisateur est gym_manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email, full_name, gym_id')
      .eq('id', user.id)
      .single()

    logger.info('🔍 [MANAGER] User profile fetched', { 
      userId: user.id, 
      userProfile, 
      profileError: profileError?.message 
    }, { component: 'ManagerGymCreate' })

    if (!userProfile || userProfile.role !== 'gym_manager') {
      return NextResponse.json(
        { success: false, error: 'Vous devez être gérant pour créer une salle' },
        { status: 403 }
      )
    }

    // 3. Vérifier qu'il n'a pas déjà créé de salle
    if (userProfile.gym_id) {
      const { data: existingGym } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('id', userProfile.gym_id)
        .single()

      if (existingGym) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Vous gérez déjà la salle "${existingGym.name}"`,
            existing_gym_id: existingGym.id 
          },
          { status: 400 }
        )
      }
    }

    // 4. Récupérer et valider les données
    const body = await request.json()
    const { name, address, city, postal_code, phone, opening_hours } = body

    if (!name || !address || !city || !postal_code) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes (name, address, city, postal_code requis)' },
        { status: 400 }
      )
    }

    // 5. Créer la salle (status: pending_approval)
    const gymData = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      postal_code: postal_code.trim(),
      phone: phone?.trim() || null,
      opening_hours: opening_hours || {
        monday: { open: "06:00", close: "22:00" },
        tuesday: { open: "06:00", close: "22:00" },
        wednesday: { open: "06:00", close: "22:00" },
        thursday: { open: "06:00", close: "22:00" },
        friday: { open: "06:00", close: "22:00" },
        saturday: { open: "08:00", close: "20:00" },
        sunday: { open: "08:00", close: "20:00" }
      },
      features: ['cardio', 'musculation', 'cours-collectifs'], // Défaut
      manager_id: userProfile.id, // Assigné immédiatement
      status: 'pending_approval' // ⚠️ Admin doit approuver
    }

    logger.info('🔧 [MANAGER] Attempting to insert gym', { 
      gymData, 
      authUid: user.id 
    }, { component: 'ManagerGymCreate' })

    // ✅ UTILISER SERVICE ROLE pour bypass RLS (permissions vérifiées manuellement ci-dessus)
    const supabaseAdmin = createAdminClient()

    const { data: gym, error: gymError } = await supabaseAdmin
      .from('gyms')
      .insert(gymData)
      .select()
      .single()

    if (gymError) {
      logger.error('❌ [MANAGER] Erreur création gym', { 
        error: gymError, 
        gymError: JSON.stringify(gymError),
        manager_id: userProfile.id,
        gym_id_was_null: userProfile.gym_id === null
      }, { component: 'ManagerGymCreate' })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la création de la salle',
          details: gymError.message,
          debug: {
            code: gymError.code,
            hint: gymError.hint,
            userHasGymId: userProfile.gym_id !== null
          }
        },
        { status: 500 }
      )
    }

    // 6. Créer un kiosk principal pour la salle
    const kioskSlug = generateKioskSlug()
    const provisioningCode = generateProvisioningCode()
    const provisioningExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h

    const kioskData = {
      gym_id: gym.id,
      slug: kioskSlug,
      name: `${gym.name} - Kiosk Principal`,
      provisioning_code: provisioningCode,
      provisioning_code_expires_at: provisioningExpiresAt.toISOString(),
      status: 'provisioning', // Gérant doit provisionner
      voice_model: 'alloy',
      language: 'fr',
      openai_model: 'gpt-4o-mini-realtime-preview-2024-12-17',
      location_in_gym: 'Entrée principale',
      hardware_info: {
        hardware_version: '1.0'
      }
    }

    const { data: kiosk, error: kioskError } = await supabaseAdmin
      .from('kiosks')
      .insert(kioskData)
      .select()
      .single()

    if (kioskError) {
      // Rollback gym si kiosk fail
      await supabaseAdmin.from('gyms').delete().eq('id', gym.id)
      
      logger.error('Erreur création kiosk (manager)', { error: kioskError, gym_id: gym.id }, { component: 'ManagerGymCreate' })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la création du kiosk',
          details: kioskError.message 
        },
        { status: 500 }
      )
    }

    // 7. Mettre à jour le profil user avec gym_id
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ gym_id: gym.id })
      .eq('id', userProfile.id)

    if (updateUserError) {
      logger.error('Erreur mise à jour user.gym_id', { error: updateUserError, user_id: userProfile.id }, { component: 'ManagerGymCreate' })
      // Non bloquant, on continue
    }

    // 7.5 Mettre à jour l'invitation avec gym_id (si elle existe)
    const { error: updateInvitationError } = await supabaseAdmin
      .from('manager_invitations')
      .update({ gym_id: gym.id })
      .eq('email', userProfile.email)
      .eq('status', 'accepted')
      .is('gym_id', null) // Seulement si pas déjà assignée

    if (updateInvitationError) {
      logger.warn('⚠️ [MANAGER] Erreur mise à jour invitation avec gym_id', { error: updateInvitationError.message }, { component: 'ManagerGymCreate' })
      // Non bloquant
    } else {
      logger.info('✅ [MANAGER] Invitation liée à la gym créée', { email: userProfile.email, gymId: gym.id }, { component: 'ManagerGymCreate' })
    }

    logger.info('Salle créée par gérant (pending approval)', { 
      gym_id: gym.id, 
      gym_name: gym.name, 
      manager_id: userProfile.id,
      manager_email: userProfile.email 
    }, { component: 'ManagerGymCreate' })

    // 8. Réponse avec infos utiles
    return NextResponse.json({
      success: true,
      message: `Salle "${gym.name}" créée avec succès. En attente d'approbation par l'équipe JARVIS.`,
      data: {
        gym_id: gym.id,
        gym_name: gym.name,
        gym_status: gym.status,
        kiosk: {
          id: kiosk.id,
          slug: kiosk.slug,
          provisioning_code: provisioningCode,
          provisioning_code_expires_at: provisioningExpiresAt.toISOString(),
          provisioning_url: `${process.env.NEXT_PUBLIC_APP_URL}/kiosk/${kioskSlug}`
        },
        next_steps: [
          '1. Attendre l\'approbation de votre salle par l\'équipe JARVIS',
          '2. Une fois approuvée, provisionner votre kiosk sur site avec le code fourni',
          '3. Ajouter vos premiers adhérents depuis le dashboard'
        ]
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('Erreur serveur création gym (manager)', { error }, { component: 'ManagerGymCreate' })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}

// Méthodes non autorisées
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}



