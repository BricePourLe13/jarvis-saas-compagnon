import { NextRequest, NextResponse } from 'next/server'
import { trackSessionCost } from '@/lib/openai-cost-tracker'

export async function POST(request: NextRequest) {
  try {
    const { gymSlug } = await request.json()
    
    if (!gymSlug) {
      return NextResponse.json({
        success: false,
        error: 'gymSlug est requis'
      }, { status: 400 })
    }

    console.log('🧪 [TEST] Test complet du tracking pour:', gymSlug)

    // 1. Tester l'API kiosk
    console.log('🧪 [TEST] Étape 1: Test API kiosk...')
    const kioskResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/kiosk/${gymSlug}`)
    
    if (!kioskResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'API kiosk inaccessible',
        details: {
          status: kioskResponse.status,
          statusText: kioskResponse.statusText
        }
      }, { status: 500 })
    }

    const kioskData = await kioskResponse.json()
    console.log('🧪 [TEST] Données kiosk reçues:', kioskData)

    // 2. Extraire les IDs comme le fait le hook useVoiceChat
    const extractedGymId = kioskData.data?.id || kioskData.gym?.id || kioskData.kiosk?.id
    const extractedFranchiseId = kioskData.data?.franchise_id || kioskData.gym?.franchise_id

    console.log('🧪 [TEST] IDs extraits:', {
      gymId: extractedGymId,
      franchiseId: extractedFranchiseId
    })

    if (!extractedGymId) {
      return NextResponse.json({
        success: false,
        error: 'Impossible d\'extraire gymId',
        details: {
          kioskDataStructure: {
            hasData: !!kioskData.data,
            hasGym: !!kioskData.gym,
            hasKiosk: !!kioskData.kiosk,
            dataId: kioskData.data?.id,
            gymId: kioskData.gym?.id,
            kioskId: kioskData.kiosk?.id
          }
        }
      }, { status: 500 })
    }

    // 3. Créer une session de test
    console.log('🧪 [TEST] Étape 2: Création session de test...')
    const testSession = await trackSessionCost({
      sessionId: `test_tracking_${Date.now()}`,
      gymId: extractedGymId,
      franchiseId: extractedFranchiseId,
      timestamp: new Date(),
      durationSeconds: 90, // 1.5 minutes
      textInputTokens: 25,
      textOutputTokens: 75,
      audioInputTokens: 2500, // ~1.5 min audio input
      audioOutputTokens: 1250, // ~45s audio output
      userSatisfaction: 4.8,
      errorOccurred: false,
      endReason: 'user_ended',
      audioInputSeconds: 90,
      audioOutputSeconds: 45
    })

    console.log('🧪 [TEST] Session créée avec succès:', testSession.sessionId)

    return NextResponse.json({
      success: true,
      message: 'Test de tracking réussi!',
      results: {
        kiosk_api: {
          status: 'OK',
          gymId: extractedGymId,
          franchiseId: extractedFranchiseId,
          gymName: kioskData.gym?.name || kioskData.kiosk?.name
        },
        session_tracking: {
          status: 'OK',
          sessionId: testSession.sessionId,
          totalCost: testSession.totalCost,
          durationSeconds: testSession.durationSeconds
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('🧪 [TEST] Erreur test tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test de tracking',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 