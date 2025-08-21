import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createSimpleClient()

    // Log supprimé pour production

    // Chercher la salle par kiosk_url_slug SANS JOIN franchises
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        kiosk_config,
        franchise_id,
        status
      `)
      .eq('kiosk_config->>kiosk_url_slug', slug)
      .eq('status', 'active')
      .single()

    // Log supprimé pour production
    // Log supprimé pour production

    if (gymError || !gym) {
      // Log supprimé pour production
      
      // Debug supplémentaire
      const { data: allKioskGyms } = await supabase
        .from('gyms')
        .select('id, name, kiosk_config')
        .not('kiosk_config->>kiosk_url_slug', 'is', null)
        .limit(5)
      
      // Log supprimé pour production

      return NextResponse.json(
        { 
          valid: false, 
          error: 'Kiosk non trouvé ou inactif',
          debug: {
            slug,
            allKioskGyms
          }
        },
        { status: 404 }
      )
    }

    // Récupérer la configuration du kiosk
    const kioskConfig = gym.kiosk_config as any
    // Log supprimé pour production
    
    // ✅ CORRECTION : Permettre l'accès aux kiosks non provisionnés pour le provisioning
    // Au lieu de rejeter, on retourne les infos pour que le frontend affiche l'interface de provisioning

    // Essayer de récupérer la franchise séparément (peut échouer à cause de RLS)
    let franchiseName = 'Franchise'
    let franchiseConfig: any = {}
    try {
      const { data: franchise } = await supabase
        .from('franchises')
        .select('name, jarvis_config')
        .eq('id', gym.franchise_id)
        .single()
      
      if (franchise) {
        franchiseName = franchise.name
        franchiseConfig = franchise.jarvis_config || {}
      }
    } catch (e) {
      // Log supprimé pour production
    }

    // Construire la réponse avec les données nécessaires
    const response = {
      valid: true,
      kiosk: {
        id: gym.id,
        name: gym.name,
        franchise_name: franchiseName,
        is_provisioned: kioskConfig?.is_provisioned || false,
        provisioning_required: !kioskConfig?.is_provisioned,
        kiosk_config: {
          ...kioskConfig,
          // Couleurs par défaut si pas de franchise
          brand_colors: kioskConfig.brand_colors || franchiseConfig.brand_colors || {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6'
          },
          welcome_message: kioskConfig.welcome_message || `Bienvenue à ${gym.name} !`
        }
      },
      gym: {
        id: gym.id,
        name: gym.name,
        franchise_id: gym.franchise_id, // ✅ Ajout pour le tracking
        address: '', // Pour compatibility
        franchise_name: franchiseName
      },
      // ✅ Ajout d'une section data pour compatibilité avec le tracking
      data: {
        id: gym.id,
        franchise_id: gym.franchise_id,
        name: gym.name
      }
    }

    // Log supprimé pour production
    return NextResponse.json(response)

  } catch (error) {
    // Log supprimé pour production
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Erreur serveur lors de la validation du kiosk',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

// Gérer les autres méthodes HTTP
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée sur cet endpoint' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée sur cet endpoint' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée sur cet endpoint' },
    { status: 405 }
  )
} 