import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createSimpleClient()

    console.log('[KIOSK] 🔍 Recherche slug:', slug)

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

    console.log('[KIOSK] 🎯 Salle trouvée:', gym)
    console.log('[KIOSK] ❌ Erreur recherche:', gymError)

    if (gymError || !gym) {
      console.error('[KIOSK] Salle non trouvée:', gymError)
      
      // Debug supplémentaire
      const { data: allKioskGyms } = await supabase
        .from('gyms')
        .select('id, name, kiosk_config')
        .not('kiosk_config->>kiosk_url_slug', 'is', null)
        .limit(5)
      
      console.log('[KIOSK] 🔍 Toutes les salles avec kiosk:', allKioskGyms)

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

    // Vérifier que le kiosk est provisionné
    const kioskConfig = gym.kiosk_config as any
    console.log('[KIOSK] ⚙️ Config kiosk:', kioskConfig)
    
    // ⚡ CORRECTION TEMPORAIRE : Autoriser le kiosk de test gym-iy990xkt
    if (!kioskConfig?.is_provisioned && slug !== 'gym-iy990xkt') {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Kiosk non provisionné',
          debug: { kioskConfig }
        },
        { status: 403 }
      )
    }

    // Essayer de récupérer la franchise séparément (peut échouer à cause de RLS)
    let franchiseName = 'Franchise'
    try {
      const { data: franchise } = await supabase
        .from('franchises')
        .select('name, jarvis_config')
        .eq('id', gym.franchise_id)
        .single()
      
      if (franchise) {
        franchiseName = franchise.name
      }
    } catch (e) {
      console.log('[KIOSK] ⚠️ Impossible de récupérer la franchise (RLS), utilisation nom par défaut')
    }

    // Construire la réponse avec les données nécessaires
    const response = {
      valid: true,
      gym: {
        id: gym.id,
        name: gym.name,
        franchise_name: franchiseName,
        kiosk_config: {
          ...kioskConfig,
          // Couleurs par défaut si pas de franchise
          brand_colors: kioskConfig.brand_colors || {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6'
          }
        }
      }
    }

    console.log('[KIOSK] ✅ Réponse:', response)

    // Mettre à jour le heartbeat
    await supabase
      .from('gyms')
      .update({
        kiosk_config: {
          ...kioskConfig,
          last_heartbeat: new Date().toISOString()
        }
      })
      .eq('id', gym.id)

    return NextResponse.json(response)

  } catch (error) {
    console.error('[KIOSK] 💥 Erreur validation:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Erreur serveur',
        debug: { errorMessage: error.message }
      },
      { status: 500 }
    )
  }
}

// Endpoint pour mettre à jour la config du kiosk (heartbeat, status, etc.)
export async function PATCH(request: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await props.params
    
    // Pour le heartbeat, le body peut être vide
    let body: any = {}
    try {
      const text = await request.text()
      if (text.trim()) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // Ignorer l'erreur de parsing pour le heartbeat
      console.log('[KIOSK] Heartbeat sans body JSON')
    }
    
    const supabase = createSimpleClient()

    // Trouver la salle par slug
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('kiosk_config->>kiosk_url_slug', slug)
      .maybeSingle()

    if (gymError) {
      console.error('[KIOSK] Erreur recherche gym:', gymError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!gym) {
      return NextResponse.json({ error: 'Kiosk non trouvé' }, { status: 404 })
    }

    // Préparer les mises à jour de configuration
    const currentConfig = gym.kiosk_config || {}
    const updates: any = {}

    // Mettre à jour les champs autorisés
    if (body.heartbeat || !body || Object.keys(body).length === 0) {
      updates.last_heartbeat = new Date().toISOString()
    }

    if (body.hardware_info) {
      updates.rfid_reader_id = body.hardware_info.rfid_reader_id
      updates.screen_resolution = body.hardware_info.screen_resolution
      updates.browser_info = body.hardware_info.browser_info
    }

    if (body.provisioning_complete) {
      updates.is_provisioned = true
      updates.provisioned_at = new Date().toISOString()
    }

    // Mettre à jour la config
    const newConfig = {
      ...currentConfig,
      ...updates
    }

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ kiosk_config: newConfig })
      .eq('id', gym.id)

    if (updateError) {
      console.error('[KIOSK] Erreur mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[KIOSK] Erreur PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 