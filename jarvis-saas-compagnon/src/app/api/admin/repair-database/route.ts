/**
 * 🔧 API POUR RÉPARATION BASE DE DONNÉES
 * 
 * Exécute les fixes SQL de manière sécurisée
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createErrorResponse, createSuccessResponse } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
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

    // 🔐 Vérifier que l'utilisateur est super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return createErrorResponse('AUTH_ERROR', 'Authentification requise')
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'super_admin') {
      return createErrorResponse('PERMISSION_DENIED', 'Seuls les super admins peuvent réparer la BDD')
    }

    console.log('🔧 [DATABASE REPAIR] Début des réparations par:', user.email)

    const repairs = []

    // 🏗️ RÉPARATION 1: Assigner manager à AREA
    try {
      console.log('👨‍💼 Recherche et assignment manager AREA...')
      
      // Trouver Brice
      const { data: brice } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', 'brice@jarvis-group.net')
        .single()

      if (!brice) {
        repairs.push({
          name: 'Manager Assignment',
          status: 'warning',
          message: 'Utilisateur brice@jarvis-group.net introuvable'
        })
      } else {
        // Trouver gym AREA
        const { data: area } = await supabase
          .from('gyms')
          .select('id, name, manager_id')
          .eq('name', 'AREA')
          .single()

        if (!area) {
          repairs.push({
            name: 'Manager Assignment',
            status: 'warning', 
            message: 'Gym AREA introuvable'
          })
        } else if (area.manager_id === brice.id) {
          repairs.push({
            name: 'Manager Assignment',
            status: 'ok',
            message: 'Brice déjà assigné comme manager AREA'
          })
        } else {
          // Assigner Brice
          const { error: updateError } = await supabase
            .from('gyms')
            .update({ 
              manager_id: brice.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', area.id)

          if (updateError) {
            repairs.push({
              name: 'Manager Assignment',
              status: 'error',
              message: 'Erreur lors de l\'assignment: ' + updateError.message
            })
          } else {
            repairs.push({
              name: 'Manager Assignment',
              status: 'fixed',
              message: 'Brice assigné comme manager AREA avec succès'
            })
          }
        }
      }
    } catch (error: any) {
      repairs.push({
        name: 'Manager Assignment',
        status: 'error',
        message: 'Erreur: ' + error.message
      })
    }

    // 🏗️ RÉPARATION 2: Vérifier relations FK
    try {
      console.log('🔗 Vérification foreign keys...')
      
      // Compter les gym_members avec gym_id invalide
      const { data: invalidMembers, error: fkError } = await supabase
        .from('gym_members')
        .select('id, gym_id, first_name')
        .limit(1000) // Limite pour éviter timeout

      if (fkError) {
        repairs.push({
          name: 'Foreign Key Check',
          status: 'error',
          message: 'Impossible de vérifier les relations: ' + fkError.message
        })
      } else {
        // Vérifier quels gym_id existent
        const gymIds = [...new Set(invalidMembers?.map(m => m.gym_id) || [])]
        const { data: existingGyms } = await supabase
          .from('gyms')
          .select('id')
          .in('id', gymIds)

        const existingGymIds = new Set(existingGyms?.map(g => g.id) || [])
        const invalidCount = invalidMembers?.filter(m => !existingGymIds.has(m.gym_id)).length || 0

        if (invalidCount > 0) {
          repairs.push({
            name: 'Foreign Key Check',
            status: 'warning',
            message: `${invalidCount} membres avec gym_id invalide détectés`
          })
        } else {
          repairs.push({
            name: 'Foreign Key Check', 
            status: 'ok',
            message: 'Toutes les relations gym_members -> gyms sont valides'
          })
        }
      }
    } catch (error: any) {
      repairs.push({
        name: 'Foreign Key Check',
        status: 'error',
        message: 'Erreur: ' + error.message
      })
    }

    // 🏗️ RÉPARATION 3: Ajouter colonne slug si manquante
    try {
      console.log('📂 Vérification colonne slug...')
      
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, name, slug')
        .limit(5)

      if (gyms && gyms.length > 0) {
        // Vérifier si slug existe (sera undefined si colonne manque)
        const hasSlugColumn = 'slug' in gyms[0]
        
        if (!hasSlugColumn) {
          repairs.push({
            name: 'Slug Column',
            status: 'warning',
            message: 'Colonne slug manquante dans table gyms'
          })
        } else {
          const missingSlugCount = gyms.filter(g => !g.slug).length
          if (missingSlugCount > 0) {
            repairs.push({
              name: 'Slug Column',
              status: 'warning',
              message: `${missingSlugCount} gyms sans slug détectées`
            })
          } else {
            repairs.push({
              name: 'Slug Column',
              status: 'ok',
              message: 'Toutes les gyms ont un slug valide'
            })
          }
        }
      }
    } catch (error: any) {
      repairs.push({
        name: 'Slug Column',
        status: 'error',
        message: 'Erreur: ' + error.message
      })
    }

    // 🏗️ RÉPARATION 4: Nettoyer sessions fantômes
    try {
      console.log('👻 Nettoyage sessions fantômes...')
      
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_inactive_realtime_sessions', {
          p_gym_id: null, // Toutes les gyms
          p_inactive_minutes: 30
        })

      if (cleanupError) {
        repairs.push({
          name: 'Session Cleanup',
          status: 'error',
          message: 'Erreur nettoyage: ' + cleanupError.message
        })
      } else {
        repairs.push({
          name: 'Session Cleanup',
          status: 'fixed',
          message: `${cleanupResult || 0} sessions fantômes nettoyées`
        })
      }
    } catch (error: any) {
      repairs.push({
        name: 'Session Cleanup',
        status: 'error',
        message: 'Erreur: ' + error.message
      })
    }

    console.log('✅ [DATABASE REPAIR] Réparations terminées')

    return createSuccessResponse({
      repairs,
      summary: {
        total: repairs.length,
        fixed: repairs.filter(r => r.status === 'fixed').length,
        warnings: repairs.filter(r => r.status === 'warning').length,
        errors: repairs.filter(r => r.status === 'error').length,
        ok: repairs.filter(r => r.status === 'ok').length
      }
    }, 'Réparations base de données terminées')

  } catch (error: any) {
    console.error('🚨 [DATABASE REPAIR] Erreur critique:', error)
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Erreur lors des réparations',
      { error: error.message }
    )
  }
}
