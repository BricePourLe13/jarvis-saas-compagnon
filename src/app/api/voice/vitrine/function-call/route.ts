import { NextRequest, NextResponse } from 'next/server'
import { executeJarvisFunction } from '@/lib/jarvis-expert-functions'

export async function POST(request: NextRequest) {
  try {
    const { function_name, arguments: functionArgs } = await request.json()

    console.log('🔧 Function call:', function_name, functionArgs)

    // Exécuter la fonction experte JARVIS
    const result = await executeJarvisFunction(function_name, functionArgs)

    console.log('✅ Function result:', result)

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('❌ Erreur function call:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur fonction'
      },
      { status: 500 }
    )
  }
}
