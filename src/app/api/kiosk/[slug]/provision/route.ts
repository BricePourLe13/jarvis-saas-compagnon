import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface ProvisioningRequest {
  provisioning_code: string
  action: 'validate' | 'complete'
  hardware_info?: {
    rfid_reader_id?: string
    screen_resolution?: string
    browser_info?: Record<string, any>
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body: ProvisioningRequest = await request.json()
    const { provisioning_code, action, hardware_info } = body

    // Créer le client Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookieStore.set({ name, value, ...options })
          },
          remove: (name: string, options: any) => {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Vérifier que le kiosk existe
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select(`
        *,
        gyms!inner(id, name, status)
      `)
      .eq('slug', slug)
      .single()

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { error: 'Kiosk non trouvé' },
        { status: 404 }
      )
    }

    const gym = kiosk.gyms

    // Vérifier si déjà provisionné
    if (kiosk.status === 'online') {
      return NextResponse.json(
        { error: 'Kiosk déjà activé' },
        { status: 400 }
      )
    }

    // Valider le code de provisioning
    if (kiosk.provisioning_code !== provisioning_code) {
      return NextResponse.json(
        { error: 'Code d\'activation invalide' },
        { status: 400 }
      )
    }

    // Actions selon le type de requête
    if (action === 'validate') {
      // Simple validation du code
      return NextResponse.json({ 
        success: true, 
        message: 'Code valide',
        gym_name: gym.name
      })
    }

    if (action === 'complete') {
      // Finaliser le provisioning
      const now = new Date().toISOString()
      
      // Préparer les infos hardware à merger
      const updatedHardwareInfo = {
        ...((kiosk.hardware_info as any) || {}),
        ...(hardware_info?.rfid_reader_id && { rfid_reader_id: hardware_info.rfid_reader_id }),
        ...(hardware_info?.screen_resolution && { screen_resolution: hardware_info.screen_resolution }),
        ...(hardware_info?.browser_info && { browser_info: hardware_info.browser_info }),
      }

      // Mettre à jour le kiosk
      const { error: updateError } = await supabase
        .from('kiosks')
        .update({ 
          status: 'online',
          last_heartbeat: now,
          hardware_info: updatedHardwareInfo,
          updated_at: now
        })
        .eq('id', kiosk.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Erreur lors de l\'activation' },
          { status: 500 }
        )
      }

      // Activer la salle si elle ne l'est pas déjà
      await supabase
        .from('gyms')
        .update({ status: 'active' })
        .eq('id', kiosk.gym_id)

      return NextResponse.json({ 
        success: true,
        message: 'Kiosk activé avec succès',
        gym_name: gym.name,
        provisioned_at: now
      })
    }

    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    )

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { error: 'Erreur serveur lors du provisioning' },
      { status: 500 }
    )
  }
} 