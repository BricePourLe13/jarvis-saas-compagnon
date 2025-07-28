import { NextRequest, NextResponse } from 'next/server'
import { RealOpenAICostsService } from '@/lib/real-openai-costs'

export async function POST(request: NextRequest) {
  try {
    const { action, gymId = 'gym-yatblc8h' } = await request.json()

    if (action === 'test_real_costs_display') {
      console.log('💰 [TEST SIMPLE] Test affichage vrais coûts pour gym:', gymId)
      
      // Tester directement le service qui sera utilisé dans l'interface
      const metrics = await RealOpenAICostsService.getRealTimeMetricsByGym(gymId)
      
      if (!metrics) {
        return NextResponse.json({
          success: false,
          message: 'Aucune donnée trouvée',
          info: 'Vérifiez que des sessions JARVIS existent et que l\'API OpenAI fonctionne'
        })
      }

      // Formater les données comme elles seront affichées
      const todayCostEUR = (metrics.today.totalCostUSD * 0.85).toFixed(2)
      const avgDurationMinutes = metrics.today.totalSessions > 0 ? 
        Math.round(metrics.today.totalDurationMinutes / metrics.today.totalSessions) : 0

      return NextResponse.json({
        success: true,
        message: 'Vrais coûts OpenAI récupérés avec succès',
        displayData: {
          sessions: metrics.today.totalSessions,
          cost: `€${todayCostEUR}`,
          avgDuration: `${avgDurationMinutes}min`,
          status: 'EN LIGNE'
        },
        rawData: {
          todayUSD: metrics.today.totalCostUSD,
          yesterdayUSD: metrics.yesterday.totalCostUSD,
          changes: metrics.changes
        },
        info: 'Ces données s\'affichent maintenant dans Vue d\'ensemble > Métriques Aujourd\'hui'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Action non reconnue',
      availableActions: [
        'test_real_costs_display - Tester l\'affichage des vrais coûts'
      ]
    }, { status: 400 })

  } catch (error) {
    console.error('💰 [TEST SIMPLE] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 