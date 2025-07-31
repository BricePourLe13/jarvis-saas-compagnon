import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message: string
}

interface UserUpdateRequest {
  full_name?: string
  email?: string
  role?: 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff'
  franchise_access?: string[]
  gym_access?: string[]
  is_active?: boolean
  dashboard_preferences?: Record<string, any>
  notification_settings?: Record<string, any>
}

// ===========================================
// 🛡️ VÉRIFICATION PERMISSIONS
// ===========================================

async function validateSuperAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { valid: false, error: 'Non authentifié' }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile || userProfile.role !== 'super_admin') {
    return { valid: false, error: 'Accès non autorisé - Super admin requis' }
  }

  return { valid: true, user }
}

// ===========================================
// 📝 UPDATE USER - PUT
// ===========================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Vérification permissions
    const validation = await validateSuperAdmin(supabase)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, message: 'Permission refusée' },
        { status: 403 }
      )
    }

    const body: UserUpdateRequest = await request.json()
    const resolvedParams = await params
    const userId = resolvedParams.id

    // Validation des données
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis', message: 'Paramètre manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé', message: 'Utilisateur inexistant' },
        { status: 404 }
      )
    }

    // Validation email unique si modifié
    if (body.email && body.email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', body.email)
        .neq('id', userId)
        .single()

      if (emailCheck) {
        return NextResponse.json(
          { success: false, error: 'Email déjà utilisé', message: 'Cet email est déjà pris' },
          { status: 400 }
        )
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.full_name !== undefined) updateData.full_name = body.full_name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role !== undefined) updateData.role = body.role
    if (body.franchise_access !== undefined) updateData.franchise_access = body.franchise_access
    if (body.gym_access !== undefined) updateData.gym_access = body.gym_access
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.dashboard_preferences !== undefined) updateData.dashboard_preferences = body.dashboard_preferences
    if (body.notification_settings !== undefined) updateData.notification_settings = body.notification_settings

    // Mettre à jour l'utilisateur
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour utilisateur:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message, message: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    // Si modification email dans Supabase Auth aussi
    if (body.email && body.email !== existingUser.email) {
      try {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          { email: body.email }
        )
        
        if (authUpdateError) {
          console.warn('⚠️ Email mis à jour en base mais pas dans Auth:', authUpdateError)
        }
      } catch (authError) {
        console.warn('⚠️ Erreur mise à jour Auth (non bloquante):', authError)
      }
    }

    console.log('✅ Utilisateur mis à jour:', updatedUser.email)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API update user:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}

// ===========================================
// 🗑️ DELETE USER - DELETE
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Vérification permissions
    const validation = await validateSuperAdmin(supabase)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, message: 'Permission refusée' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const userId = resolvedParams.id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis', message: 'Paramètre manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe et récupérer ses infos
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé', message: 'Utilisateur inexistant' },
        { status: 404 }
      )
    }

    // Empêcher la suppression du dernier super_admin
    if (existingUser.role === 'super_admin') {
      const { data: superAdmins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'super_admin')

      if (superAdmins && superAdmins.length <= 1) {
        return NextResponse.json(
          { success: false, error: 'Impossible de supprimer le dernier super admin', message: 'Action interdite' },
          { status: 400 }
        )
      }
    }

    // Supprimer de la table users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('❌ Erreur suppression utilisateur:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message, message: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    // Supprimer de Supabase Auth
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        console.warn('⚠️ Utilisateur supprimé de la base mais pas de Auth:', authDeleteError)
      }
    } catch (authError) {
      console.warn('⚠️ Erreur suppression Auth (non bloquante):', authError)
    }

    console.log('✅ Utilisateur supprimé:', existingUser.email)

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API delete user:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', message: 'Une erreur inattendue s\'est produite' },
      { status: 500 }
    )
  }
}