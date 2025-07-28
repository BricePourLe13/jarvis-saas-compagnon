import { NextRequest, NextResponse } from 'next/server'
import { RealCostSyncService } from '@/lib/real-cost-sync'

export async function POST(request: NextRequest) {
  try {
    const { daysBack = 1, force = false } = await request.json()

    console.log('💰 [SYNC API] Démarrage synchronisation coûts réels')

    // Vérifier si une synchronisation est nécessaire (sauf si forcée)
    if (!force) {
      const needsSync = await RealCostSyncService.needsSync()
      if (!needsSync) {
        return NextResponse.json({
          success: true,
          message: 'Aucune synchronisation nécessaire',
          sessionsUpdated: 0,
          totalRealCost: 0,
          skipped: true
        })
      }
    }

    // Lancer la synchronisation
    const result = await RealCostSyncService.syncRealCosts(daysBack)

    const statusCode = result.success ? 200 : 500
    return NextResponse.json(result, { status: statusCode })

  } catch (error) {
    console.error('💰 [SYNC API] Erreur:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la synchronisation',
      details: error instanceof Error ? error.message : error,
      sessionsUpdated: 0,
      totalRealCost: 0
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'check') {
      // Vérifier si une synchronisation est nécessaire
      const needsSync = await RealCostSyncService.needsSync()
      
      return NextResponse.json({
        success: true,
        needsSync,
        message: needsSync 
          ? 'Synchronisation recommandée' 
          : 'Pas de synchronisation nécessaire'
      })
    }

    if (action === 'status') {
      // Obtenir le statut des coûts (estimés vs réels)
      // TODO: Implémenter les statistiques de coûts
      return NextResponse.json({
        success: true,
        stats: {
          totalSessions: 0,
          estimatedCosts: 0,
          realCosts: 0,
          lastSync: null
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Action non reconnue. Utilisez ?action=check ou ?action=status'
    }, { status: 400 })

  } catch (error) {
    console.error('💰 [SYNC API] Erreur GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 