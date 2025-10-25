import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Gym, GymUpdateRequest } from '../../../../../types/franchise'

// Fonction utilitaire pour générer un code de provisioning
function generateProvisioningCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Fonction utilitaire pour générer un slug de kiosk
function generateGymSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'gym-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ===========================================
// 🔍 GET /api/admin/gyms/[id] - Récupérer une salle
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Récupérer la salle avec sa franchise et ses kiosks
    const { data: gym, error } = await supabase
      .from('gyms')
      .select(`
        *,
        franchises (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération de la salle',
          details: error.message 
        },
        { status: 500 }
      )
    }

    if (!gym) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Salle non trouvée' 
        },
        { status: 404 }
      )
    }

    // Récupérer les kiosks associés
    const { data: kiosks, error: kiosksError } = await supabase
      .from('kiosks')
      .select('*')
      .eq('gym_id', id)

    if (kiosksError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération des kiosks',
          details: kiosksError.message 
        },
        { status: 500 }
      )
    }

    // Si aucun kiosk n'existe, en créer un par défaut
    if (!kiosks || kiosks.length === 0) {
      const defaultKiosk = {
        gym_id: gym.id,
        slug: generateGymSlug(),
        name: `${gym.name} - Kiosk Principal`,
        provisioning_code: generateProvisioningCode(),
        status: 'provisioning',
        voice_model: 'alloy',
        language: 'fr'
      }

      const { data: newKiosk, error: createError } = await supabase
        .from('kiosks')
        .insert(defaultKiosk)
        .select()
        .single()

      if (!createError && newKiosk) {
        return NextResponse.json({
          success: true,
          data: {
            ...gym,
            kiosks: [newKiosk],
            kiosk_config: {
              provisioning_code: newKiosk.provisioning_code,
              kiosk_url_slug: newKiosk.slug,
              is_provisioned: false
            }
          }
        })
      }
    }

    // Retourner avec les kiosks et maintenir kiosk_config pour compatibilité
    const primaryKiosk = kiosks?.[0]
    return NextResponse.json({
      success: true,
      data: {
        ...gym,
        kiosks: kiosks || [],
        kiosk_config: primaryKiosk ? {
          provisioning_code: primaryKiosk.provisioning_code,
          kiosk_url_slug: primaryKiosk.slug,
          is_provisioned: primaryKiosk.status === 'online'
        } : gym.kiosk_config
      }
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

// ===========================================
// 🔄 POST /api/admin/gyms/[id] - Régénérer le code de provisioning
// ===========================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action, kiosk_id } = await request.json()
    
    if (action !== 'regenerate_provisioning_code') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Action non supportée' 
        },
        { status: 400 }
      )
    }

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

    // Récupérer les kiosks de la salle
    const { data: kiosks, error: fetchError } = await supabase
      .from('kiosks')
      .select('*')
      .eq('gym_id', id)

    if (fetchError || !kiosks || kiosks.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucun kiosk trouvé pour cette salle' 
        },
        { status: 404 }
      )
    }

    // Si kiosk_id fourni, utiliser celui-là, sinon prendre le premier
    const targetKiosk = kiosk_id 
      ? kiosks.find(k => k.id === kiosk_id) 
      : kiosks[0]

    if (!targetKiosk) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kiosk spécifié non trouvé' 
        },
        { status: 404 }
      )
    }

    // Générer un nouveau code
    const newProvisioningCode = generateProvisioningCode()

    // Mettre à jour le kiosk (reset provisioning)
    const { error: updateError } = await supabase
      .from('kiosks')
      .update({ 
        provisioning_code: newProvisioningCode,
        status: 'provisioning', // Reset status
        updated_at: new Date().toISOString()
      })
      .eq('id', targetKiosk.id)

    if (updateError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la régénération du code' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        kiosk_id: targetKiosk.id,
        provisioning_code: newProvisioningCode
      },
      message: 'Code de provisioning régénéré avec succès'
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

// ===========================================
// ✏️ PUT /api/admin/gyms/[id] - Modifier une salle  
// ===========================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updateData: GymUpdateRequest = await request.json()
    
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

    // Mise à jour de la salle
    const { data: updatedGym, error } = await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la mise à jour de la salle',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedGym,
      message: 'Salle mise à jour avec succès'
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

// ===========================================
// 🗑️ DELETE /api/admin/gyms/[id] - Supprimer une salle
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Supprimer la salle
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', id)

    if (error) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la suppression de la salle',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Salle supprimée avec succès'
    })

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
} 