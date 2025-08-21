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

    // Récupérer la salle avec sa franchise
    const { data: gym, error } = await supabase
      .from('gyms')
      .select(`
        *,
        franchises (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      // Log supprimé pour production
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

    // Vérifier si le code de provisioning manque et le générer si nécessaire
    if (!gym.kiosk_config?.provisioning_code) {
      // Log supprimé pour production
      
      const newProvisioningCode = generateProvisioningCode()
      const updatedKioskConfig = {
        ...gym.kiosk_config,
        provisioning_code: newProvisioningCode,
        provisioning_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h
        installation_token: gym.kiosk_config?.installation_token || crypto.randomUUID()
      }

      // Mettre à jour en base
      const { error: updateError } = await supabase
        .from('gyms')
        .update({ kiosk_config: updatedKioskConfig })
        .eq('id', id)

      if (!updateError) {
        gym.kiosk_config = updatedKioskConfig
        // Log supprimé pour production
      } else {
        // Log supprimé pour production
      }
    }

    return NextResponse.json({
      success: true,
      data: gym
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
    const { action } = await request.json()
    
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

    // Récupérer la salle
    const { data: gym, error: fetchError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !gym) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Salle non trouvée' 
        },
        { status: 404 }
      )
    }

    // Générer un nouveau code
    const newProvisioningCode = generateProvisioningCode()
    const updatedKioskConfig = {
      ...gym.kiosk_config,
      provisioning_code: newProvisioningCode,
      provisioning_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h
      installation_token: gym.kiosk_config?.installation_token || crypto.randomUUID(),
      is_provisioned: false, // Reset du statut de provisioning
      provisioned_at: null
    }

    // Mettre à jour en base
    const { error: updateError } = await supabase
      .from('gyms')
      .update({ kiosk_config: updatedKioskConfig })
      .eq('id', id)

    if (updateError) {
      // Log supprimé pour production
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la régénération du code' 
        },
        { status: 500 }
      )
    }

    // Log supprimé pour production

    return NextResponse.json({
      success: true,
      data: {
        provisioning_code: newProvisioningCode,
        expires_at: updatedKioskConfig.provisioning_expires_at
      },
      message: 'Code de provisioning régénéré avec succès'
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