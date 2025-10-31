import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/admin/users
 * Liste tous les utilisateurs avec leurs rôles
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

    // 4. Récupérer tous les utilisateurs avec leurs organisations
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        name,
        is_mfa_enabled,
        franchise_id,
        gym_id,
        last_sign_in_at,
        created_at,
        franchises(id, name),
        gyms(id, name)
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('[API] Error fetching users:', usersError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des utilisateurs' }, { status: 500 })
    }

    // 5. Formatter les utilisateurs
    const formattedUsers = (users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      is_mfa_enabled: user.is_mfa_enabled,
      franchise_id: user.franchise_id,
      franchise_name: user.franchises?.name,
      gym_id: user.gym_id,
      gym_name: user.gyms?.name,
      last_sign_in: user.last_sign_in_at || user.created_at,
      created_at: user.created_at
    }))

    // 6. Calculer métriques
    const metrics = {
      totalUsers: formattedUsers.length,
      superAdmins: formattedUsers.filter(u => u.role === 'super_admin').length,
      franchiseOwners: formattedUsers.filter(u => u.role === 'franchise_owner').length,
      gymManagers: formattedUsers.filter(u => u.role === 'gym_manager').length,
      mfaEnabled: formattedUsers.filter(u => u.is_mfa_enabled).length
    }

    return NextResponse.json({
      users: formattedUsers,
      metrics
    })

  } catch (error) {
    console.error('[API] Unexpected error in GET /api/dashboard/admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



