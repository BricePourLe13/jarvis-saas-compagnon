import { NextRequest, NextResponse } from 'next/server'
import { trackSessionCost } from '@/lib/openai-cost-tracker'
import { RealCostSyncService } from '@/lib/real-cost-sync'

export async function POST(request: NextRequest) {
  try {
    const { action, gymId = 'test-gym-id', franchiseId = 'test-franchise-id' } = await request.json()

    if (action === 'create_test_sessions') {
      console.log('💰 [TEST] Création de sessions de test avec coûts estimés...')
      
      const sessions = []
      
      // Créer 3 sessions de test avec des coûts estimés
      for (let i = 0; i < 3; i++) {
        const session = await trackSessionCost({
          sessionId: `test_real_cost_${Date.now()}_${i}`,
          gymId,
          franchiseId,
          timestamp: new Date(Date.now() - (i * 60 * 1000)), // Espacés de 1 minute
          durationSeconds: 90 + (i * 30), // 90s, 120s, 150s
          textInputTokens: 30 + (i * 10),
          textOutputTokens: 80 + (i * 20),
          audioInputTokens: 2000 + (i * 500),
          audioOutputTokens: 1000 + (i * 300),
          userSatisfaction: 4.0 + (i * 0.3),
          errorOccurred: false,
          endReason: 'user_ended',
          audioInputSeconds: 120 + (i * 30),
          audioOutputSeconds: 60 + (i * 15)
        })
        
        sessions.push({
          sessionId: session.sessionId,
          estimatedCost: session.totalCost,
          isReal: false
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Sessions de test créées',
        sessions,
        nextStep: 'Utilisez action=sync_test pour synchroniser avec des coûts réels simulés'
      })
    }

    if (action === 'sync_test') {
      console.log('💰 [TEST] Test de synchronisation des coûts réels...')
      
      // Déclencher la synchronisation (qui utilisera les vraies API)
      const result = await RealCostSyncService.syncRealCosts(1) // Dernières 24h
      
      return NextResponse.json({
        success: true,
        message: 'Test de synchronisation terminé',
        syncResult: result,
        info: 'Les coûts ont été synchronisés avec les données réelles d\'OpenAI'
      })
    }

    if (action === 'check_costs') {
      console.log('💰 [TEST] Vérification des coûts estimés vs réels...')
      
      // Vérifier s'il y a des sessions avec coûts estimés
      const needsSync = await RealCostSyncService.needsSync()
      
      return NextResponse.json({
        success: true,
        needsSync,
        message: needsSync 
          ? 'Des sessions avec coûts estimés ont été trouvées'
          : 'Toutes les sessions ont des coûts réels',
        recommendation: needsSync 
          ? 'Lancez une synchronisation avec action=sync_test'
          : 'Créez des sessions de test avec action=create_test_sessions'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Action non reconnue',
      availableActions: [
        'create_test_sessions - Créer des sessions avec coûts estimés',
        'sync_test - Synchroniser avec les coûts réels OpenAI',
        'check_costs - Vérifier le statut des coûts'
      ]
    }, { status: 400 })

  } catch (error) {
    console.error('💰 [TEST] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 