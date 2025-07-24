import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[VOICE TEST] 🧪 Test configuration OpenAI')
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY manquante',
        configured: false
      }, { status: 500 })
    }

    // Test simple de l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${response.status}`,
        configured: true,
        apiWorking: false
      }, { status: response.status })
    }

    const data = await response.json()
    const hasRealtimeModel = data.data.some((model: any) => 
      model.id.includes('gpt-4o-realtime')
    )

    return NextResponse.json({
      success: true,
      configured: true,
      apiWorking: true,
      hasRealtimeModel,
      modelCount: data.data.length,
      message: hasRealtimeModel ? 
        'Configuration OpenAI OK - Realtime disponible' : 
        'Configuration OpenAI OK - Realtime non trouvé'
    })

  } catch (error) {
    console.error('[VOICE TEST] ❌ Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      configured: !!process.env.OPENAI_API_KEY,
      apiWorking: false
    }, { status: 500 })
  }
} 