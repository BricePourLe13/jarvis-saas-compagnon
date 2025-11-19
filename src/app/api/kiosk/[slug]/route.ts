import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * 🏥 API KIOSK VALIDATION
 * GET /api/kiosk/[slug]
 * 
 * Valide qu'un kiosk existe et que sa gym est active.
 * Public (pas d'auth requise - Middleware l'exclut).
 * 
 * IMPORTANT : Utilise createAdminClient() pour bypass RLS sur gyms/kiosks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient() // Service Role (bypass RLS)

    console.log(`[KIOSK API] Step 1: Validating slug: ${slug}`)

    // ✅ SOLUTION: 2 requêtes séparées au lieu d'une jointure (évite PGRST116)
    // Étape 1: Chercher le kiosk par slug
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
        location_in_gym
      `)
      .eq('slug', slug)
      .single()

    console.log(`[KIOSK API] Step 2: Kiosk query result:`, { 
      found: !!kiosk, 
      error: kioskError?.message,
      errorCode: kioskError?.code 
    })

    if (kioskError || !kiosk) {
      console.log(`[KIOSK API] Step 3: RETURNING 404 - Kiosk not found`)
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Kiosk non trouvé',
          debug: { slug, errorDetails: kioskError?.message, errorCode: kioskError?.code }
        },
        { status: 404 }
      )
    }

    console.log(`[KIOSK API] Step 4: Kiosk found, fetching gym`)

    // Étape 2: Récupérer la gym associée
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, status')
      .eq('id', kiosk.gym_id)
      .single()

    console.log(`[KIOSK API] Step 5: Gym query result:`, {
      found: !!gym,
      error: gymError?.message,
      gymStatus: gym?.status
    })
    
    if (gymError || !gym) {
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

    console.log(`[KIOSK API] Step 6: All checks passed, returning kiosk config`)

    // ❌ DEPRECATED: franchise_id n'existe plus dans gyms (supprimé en Nov 2025)
    // Les configs de branding sont maintenant au niveau gym directement
    const franchiseName = gym.name
    const franchiseConfig: any = {}

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
        address: '',
        franchise_name: franchiseName
      },
      // Section data pour compatibilité avec le tracking
      data: {
        id: gym.id,
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
