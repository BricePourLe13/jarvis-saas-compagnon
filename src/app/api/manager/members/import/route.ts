import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/production-logger'

/**
 * 📥 POST /api/manager/members/import
 * Import en masse d'adhérents pour une gym
 */
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

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // 2. Récupérer profile et gym_id
    const { data: profile } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'gym_manager' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Pour super_admin, il faudrait passer gym_id dans le body, mais ici on simplifie pour le manager
    const targetGymId = profile.gym_id
    
    if (!targetGymId && profile.role === 'gym_manager') {
       return NextResponse.json({ error: 'Aucune salle associée à votre compte' }, { status: 400 })
    }

    // 3. Données
    const body = await request.json()
    const { members } = body

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ error: 'Données invalides (array expected)' }, { status: 400 })
    }

    // 4. Insertion en masse
    // On force le gym_id du token pour sécurité (sauf si super admin, mais restons simples)
    const cleanMembers = members.map((m: any) => ({
      ...m,
      gym_id: targetGymId // Force security override
    }))

    // Utilisation de ignoreDuplicates: true pour ne pas crasher sur les doublons de badge
    const { data, error } = await supabase
      .from('gym_members_v2')
      .insert(cleanMembers)
      .select()
      // .upsert(cleanMembers, { onConflict: 'gym_id, badge_id', ignoreDuplicates: true }) // Optionnel si on veut update
      
    // Note: insert simple renvoie une erreur si contrainte violée sur tout le batch avec Supabase standard sans ignoreDuplicates.
    // Pour gérer les erreurs individuelles finement, il faudrait insérer 1 par 1 ou utiliser upsert.
    // Ici on va utiliser upsert avec ignoreDuplicates pour skipper les existants silencieusement
    // OU upsert sans ignore pour écraser.
    // LE MIEUX : Upsert pour mettre à jour les fiches existantes.
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('gym_members_v2')
      .upsert(cleanMembers, { 
        onConflict: 'gym_id, badge_id',
        ignoreDuplicates: false // On met à jour si existe
      })
      .select()

    if (upsertError) {
      logger.error('Erreur import membres', { error: upsertError }, { component: 'MembersImport' })
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      inserted: upsertData?.length || 0, 
      failed: 0 // Avec upsert, tout passe ou tout casse (sauf si batching partiel, mais ici global)
    })

  } catch (error: any) {
    logger.error('Erreur serveur import membres', { error }, { component: 'MembersImport' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

