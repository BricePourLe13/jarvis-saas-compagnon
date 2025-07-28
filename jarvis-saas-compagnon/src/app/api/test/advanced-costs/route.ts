import { NextRequest, NextResponse } from 'next/server'
import { trackSessionCost } from '@/lib/openai-cost-tracker'
import { RealCostSyncService } from '@/lib/real-cost-sync'

export async function POST(request: NextRequest) {
  try {
    const { action, gymId = 'gym-yatblc8h', franchiseId = 'test-franchise-id' } = await request.json()

    if (action === 'create_estimated_sessions') {
      console.log('💰 [TEST AVANCÉ] Création de sessions avec coûts estimés...')
      
      const sessions = []
      
      // Créer 5 sessions de test avec des coûts estimés
      for (let i = 0; i < 5; i++) {
        const session = await trackSessionCost({
          sessionId: `advanced_test_${Date.now()}_${i}`,
          gymId,
          franchiseId,
          timestamp: new Date(Date.now() - (i * 60 * 1000)), // Espacés de 1 minute
          durationSeconds: 90 + (i * 30), // Durées variées
          textInputTokens: 40 + (i * 15),
          textOutputTokens: 100 + (i * 25),
          audioInputTokens: 2500 + (i * 400),
          audioOutputTokens: 1200 + (i * 300),
          userSatisfaction: 4.0 + (i * 0.2),
          errorOccurred: false,
          endReason: 'user_ended',
          audioInputSeconds: 150 + (i * 25),
          audioOutputSeconds: 72 + (i * 18)
        })
        
        sessions.push({
          sessionId: session.sessionId,
          estimatedCost: session.totalCost,
          isReal: false
        })
      }

      return NextResponse.json({
        success: true,
        message: '5 sessions avec coûts estimés créées',
        sessions,
        info: 'Ces sessions ont is_cost_real=false',
        nextStep: 'Utilisez action=check_sync pour vérifier le besoin de synchronisation'
      })
    }

    if (action === 'check_sync') {
      console.log('💰 [TEST AVANCÉ] Vérification du besoin de synchronisation...')
      
      const needsSync = await RealCostSyncService.needsSync()
      
      return NextResponse.json({
        success: true,
        needsSync,
        message: needsSync 
          ? 'Des sessions nécessitent une synchronisation'
          : 'Toutes les sessions ont des coûts réels',
        action: needsSync 
          ? 'Utilisez action=sync_real_costs pour synchroniser'
          : 'Créez d\'abord des sessions avec action=create_estimated_sessions'
      })
    }

    if (action === 'sync_real_costs') {
      console.log('💰 [TEST AVANCÉ] Synchronisation avec les coûts réels OpenAI...')
      
      const result = await RealCostSyncService.syncRealCosts(1) // Dernières 24h
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        sessionsUpdated: result.sessionsUpdated,
        totalRealCost: result.totalRealCost,
        info: result.success 
          ? 'Les sessions ont maintenant is_cost_real=true avec les vrais coûts OpenAI'
          : 'Erreur lors de la synchronisation',
        details: result
      })
    }

    if (action === 'verify_results') {
      console.log('💰 [TEST AVANCÉ] Vérification des résultats...')
      
      const { createClient } = await import('@/lib/supabase-simple')
      const supabase = createClient()
      
      const { data: estimatedSessions } = await supabase
        .from('jarvis_session_costs')
        .select('session_id, total_cost, is_cost_real, estimated_cost_updated_at')
        .eq('gym_id', gymId)
        .eq('is_cost_real', false)
        .order('timestamp', { ascending: false })
        .limit(10)
      
      const { data: realSessions } = await supabase
        .from('jarvis_session_costs')
        .select('session_id, total_cost, is_cost_real, real_cost_updated_at')
        .eq('gym_id', gymId)
        .eq('is_cost_real', true)
        .order('timestamp', { ascending: false })
        .limit(10)
      
      return NextResponse.json({
        success: true,
        message: 'État actuel du système',
        results: {
          estimatedSessions: estimatedSessions?.length || 0,
          realSessions: realSessions?.length || 0,
          sampleEstimated: estimatedSessions?.slice(0, 3) || [],
          sampleReal: realSessions?.slice(0, 3) || []
        },
        info: 'Les sessions estimées (~€X.XX) vs réelles (€X.XX) sont maintenant distinguées'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Action non reconnue',
      availableActions: [
        'create_estimated_sessions - Créer des sessions avec coûts estimés',
        'check_sync - Vérifier le besoin de synchronisation',
        'sync_real_costs - Synchroniser avec les vrais coûts OpenAI',
        'verify_results - Vérifier les résultats de la synchronisation'
      ]
    }, { status: 400 })

  } catch (error) {
    console.error('💰 [TEST AVANCÉ] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test avancé',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 