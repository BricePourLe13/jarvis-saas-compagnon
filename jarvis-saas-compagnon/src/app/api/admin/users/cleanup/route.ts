import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

// ===========================================
// 🔍 VALIDATION & HELPERS
// ===========================================

async function validateSuperAdmin(supabase: any) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { valid: false, error: 'Non authentifié' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return { valid: false, error: 'Permissions insuffisantes' }
    }

    return { valid: true, user, profile }
  } catch (error) {
    return { valid: false, error: 'Erreur validation' }
  }
}

// ===========================================
// 🗑️ DELETE - Nettoyer utilisateur
// ===========================================

export async function DELETE(request: NextRequest) {
  try {
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

    // 2. Vérifier authentification
    const authResult = await validateSuperAdmin(supabase)
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // 3. Récupérer l'email
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    // 4. Client admin pour supprimer
    const adminSupabase = createAdminClient()

    // 5. Trouver l'utilisateur dans auth.users
    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    const targetUser = authUsers.users.find((u: any) => u.email === email.toLowerCase())
    
    if (targetUser) {
      // Supprimer de auth.users
      const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(targetUser.id)
      if (deleteAuthError) {
        throw deleteAuthError
      }
    }

    // 6. Supprimer du profil users (au cas où)
    const { error: deleteProfileError } = await supabase
      .from('users')
      .delete()
      .eq('email', email.toLowerCase())

    // Pas grave si ça échoue, l'utilisateur n'existe peut-être pas

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${email} nettoyé avec succès`
    })

  } catch (error: any) {
    console.error('❌ Erreur nettoyage utilisateur:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        message: error.message || 'Impossible de nettoyer l\'utilisateur'
      },
      { status: 500 }
    )
  }
} 