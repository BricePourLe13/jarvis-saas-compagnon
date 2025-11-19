import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

/**
 * 🏥 API KIOSK VALIDATION
 * GET /api/kiosk/[slug]
 * 
 * Valide qu'un kiosk existe et que sa gym est active.
 * Public (pas d'auth requise - Middleware l'exclut).
 * 
 * REDÉPLOYÉ LE 19/11/2025 15:30 (Force rebuild #3)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createSimpleClient()

    console.log(`[KIOSK API] Validating slug: ${slug}`)

    // Chercher le kiosk par slug
    // NOTE: On retire le filtre .eq('gyms.status', 'active') de la requête SQL
    // pour éviter les erreurs de jointure PostgREST (400 Bad Request)
    // et on filtre en JS ensuite.
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select(`
        id,
        gym_id,
        slug,
        name,
        provisioning_code,
        status,
        last_heartbeat,
        voice_model,
        language,
        openai_model,
        hardware_info,
        location_in_gym,
        gyms!inner(
          id,
          name,
          franchise_id,
          status
        )
      `)
      .eq('slug', slug)
      .single()

    if (kioskError || !kiosk) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Kiosk non trouvé',
          debug: { slug, errorDetails: kioskError?.message }
        },
        { status: 404 }
      )
    }

    // Vérification manuelle du statut de la salle
    // @ts-ignore - gyms est un objet unique grâce à !inner et single()
    const gym = kiosk.gyms
    
    if (!gym) {
      return NextResponse.json(
        { valid: false, error: 'Gym associée non trouvée' },
        { status: 404 }
      )
    }

    if (gym.status !== 'active') {
      return NextResponse.json(
        { valid: false, error: 'La salle de sport n\'est pas active' },
        { status: 403 } // Forbidden au lieu de 404 pour debugging plus clair
      )
    }

    // Essayer de récupérer la franchise séparément (peut échouer à cause de RLS)
    let franchiseName = 'Franchise'
    let franchiseConfig: any = {}
    try {
      if (gym.franchise_id) {
        const { data: franchise } = await supabase
          .from('franchises')
          .select('name, jarvis_config')
          .eq('id', gym.franchise_id)
          .single()
        
        if (franchise) {
          franchiseName = franchise.name
          franchiseConfig = franchise.jarvis_config || {}
        }
      }
    } catch (e) {
      // Ignorer erreur franchise
    }

    // Déterminer si le kiosk est provisionné (online = provisionné)
    const isProvisioned = kiosk.status === 'online'

    // Construire la réponse avec les données nécessaires
    const response = {
      valid: true,
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        franchise_name: franchiseName,
        is_provisioned: isProvisioned,
        provisioning_required: !isProvisioned,
        kiosk_config: {
          kiosk_url_slug: kiosk.slug,
          provisioning_code: kiosk.provisioning_code,
          is_provisioned: isProvisioned,
          last_heartbeat: kiosk.last_heartbeat,
          // Configuration JARVIS
          voice_model: kiosk.voice_model,
          language_default: kiosk.language,
          openai_model: kiosk.openai_model,
          // Couleurs par défaut si pas de franchise
          brand_colors: franchiseConfig.brand_colors || {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6'
          },
          welcome_message: franchiseConfig.welcome_message || `Bienvenue à ${gym.name} !`,
          // Hardware info
          hardware_info: kiosk.hardware_info || {},
          location_in_gym: kiosk.location_in_gym
        }
      },
      gym: {
        id: gym.id,
        name: gym.name,
        franchise_id: gym.franchise_id,
        address: '',
        franchise_name: franchiseName
      },
      // Section data pour compatibilité avec le tracking
      data: {
        id: gym.id,
        franchise_id: gym.franchise_id,
        name: gym.name,
        kiosk_id: kiosk.id
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Erreur serveur lors de la validation du kiosk',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function PUT() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
