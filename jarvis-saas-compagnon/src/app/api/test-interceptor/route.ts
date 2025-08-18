import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST] Starting interceptor tests...')
  
  // Test 1: Simuler les patterns exacts des logs
  console.log('🎯 [GOODBYE] Speech Recognition: jarvis tu m\'entends')
  console.log('📝 Transcript final: Hey Pierre ! Oui, je t\'entends. Ça va ? Ready pour un bon entraînement ?')
  
  // Test 2: Patterns alternatifs
  console.log('🎯 [GOODBYE] Speech Recognition: test message')
  console.log('📝 Transcript final: test response')
  
  // Test 3: Debug l'état de l'interceptor
  const hasInterceptor = typeof window !== 'undefined' && (window as any).consoleInterceptor
  
  return NextResponse.json({
    success: true,
    message: 'Tests interceptor envoyés - vérifier console',
    interceptor_available: hasInterceptor,
    timestamp: new Date().toISOString()
  })
}
