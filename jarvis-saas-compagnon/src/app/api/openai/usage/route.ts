import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') // YYYY-MM-DD
    const endDate = searchParams.get('end_date') // YYYY-MM-DD
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY manquante'
      }, { status: 500 })
    }

    // ✅ CORRECTION: Utiliser le paramètre 'date' requis par l'API OpenAI
    const targetDate = startDate || endDate || new Date().toISOString().split('T')[0]
    // ✅ LOG RÉDUIT: Seulement pour debug si nécessaire
    // console.log('💰 [USAGE] Récupération usage OpenAI pour la date:', targetDate)

    // Construire l'URL de l'API OpenAI Usage avec le bon paramètre
    const usageUrl = new URL('https://api.openai.com/v1/usage')
    usageUrl.searchParams.set('date', targetDate) // ✅ CORRECTION: 'date' au lieu de 'start_date'/'end_date'

    const usageResponse = await fetch(usageUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!usageResponse.ok) {
      const errorData = await usageResponse.text()
      console.error('💰 [USAGE] Erreur API OpenAI:', usageResponse.status, errorData)
      
      return NextResponse.json({
        success: false,
        error: 'Erreur API OpenAI Usage',
        details: {
          status: usageResponse.status,
          message: errorData
        }
      }, { status: usageResponse.status })
    }

    const usageData = await usageResponse.json()
    
    // ✅ CORRECTION: Parser correctement les données OpenAI Usage
    // Les données sont dans usageData.data, pas directement dans usageData
    const realTimeData = usageData.data || []
    const whisperData = usageData.whisper_api_data || []
    
    // Calculer le coût total depuis les données réelles
    const totalCostFromRealtime = realTimeData.reduce((sum: number, item: any) => {
      const textTokensCost = ((item.n_context_tokens_total || 0) * 5.0 + (item.n_generated_tokens_total || 0) * 15.0) / 1000000
      const audioTokensCost = ((item.n_context_audio_tokens_total || 0) * 100.0 + (item.n_generated_audio_tokens_total || 0) * 200.0) / 1000000
      return sum + textTokensCost + audioTokensCost
    }, 0)
    
    console.log('💰 [USAGE] Coût calculé:', { 
      realTimeItems: realTimeData.length,
      totalCost: totalCostFromRealtime 
    })

    // Traiter et formater les données d'usage
    const processedUsage = {
      total_usage: totalCostFromRealtime,
      daily_costs: realTimeData,
      object: usageData.object,
      start_date: targetDate,
      end_date: targetDate,
      // Calculer des métriques utiles
      summary: {
        total_cost_usd: totalCostFromRealtime,
        total_requests: realTimeData.reduce((sum: number, item: any) => 
          sum + (item.n_requests || 0), 0) || 0,
        total_tokens: realTimeData.reduce((sum: number, item: any) => 
          sum + (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0), 0) || 0
      }
    }

    return NextResponse.json({
      success: true,
      usage: processedUsage,
      timestamp: new Date().toISOString(),
      source: 'openai_api'
    })

  } catch (error) {
    console.error('💰 [USAGE] Erreur récupération usage:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de l\'usage OpenAI',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionIds } = await request.json()

    if (action === 'sync_sessions') {
      // Synchroniser les coûts réels pour des sessions spécifiques
      console.log('💰 [USAGE] Synchronisation sessions:', sessionIds)
      
      // TODO: Implémenter la logique de synchronisation
      // 1. Récupérer l'usage global depuis OpenAI
      // 2. Calculer la répartition par session
      // 3. Mettre à jour les coûts dans Supabase
      
      return NextResponse.json({
        success: true,
        message: 'Synchronisation en cours...',
        synchronized_sessions: sessionIds?.length || 0
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Action non reconnue'
    }, { status: 400 })

  } catch (error) {
    console.error('💰 [USAGE] Erreur POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du traitement',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
} 