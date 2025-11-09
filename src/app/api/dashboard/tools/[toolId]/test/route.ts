/**
 * API Route: Test Custom Tool
 * POST: Tester un tool avec des arguments de test
 */

import { NextRequest, NextResponse } from 'next/server'
import { CustomToolExecutor } from '@/lib/custom-tools/executor'
import { getToolById, buildExecutionContext } from '@/lib/custom-tools/helpers'
import type { ToolTestCase } from '@/types/custom-tools'

/**
 * POST - Tester un tool
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params
    const body = await request.json()
    const { test_case, member_id, gym_id, session_id } = body as {
      test_case: ToolTestCase
      member_id: string
      gym_id: string
      session_id: string
    }
    
    if (!test_case || !test_case.input_args) {
      return NextResponse.json(
        { error: 'test_case with input_args is required' },
        { status: 400 }
      )
    }
    
    // 1. Charger le tool
    const tool = await getToolById(toolId)
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    // 2. Construire contexte d'exécution
    const context = await buildExecutionContext(
      member_id,
      gym_id,
      session_id || 'test-session'
    )
    
    // 3. Exécuter le tool
    const startTime = Date.now()
    const result = await CustomToolExecutor.execute(
      gym_id,
      tool.name,
      test_case.input_args,
      context
    )
    const executionTime = Date.now() - startTime
    
    // 4. Vérifier résultat attendu si fourni
    let passed = result.success
    if (test_case.expected_status) {
      passed = passed && (result.success ? 'success' : 'error') === test_case.expected_status
    }
    
    // 5. Préparer résultat du test
    const testResult = {
      test_case_name: test_case.name,
      status: result.success ? 'success' as const : 'error' as const,
      execution_time_ms: executionTime,
      output: result.data || null,
      error_message: result.error,
      passed
    }
    
    // 6. Sauvegarder résultat du test sur le tool
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase
      .from('custom_tools')
      .update({
        last_test_result: testResult,
        last_test_at: new Date().toISOString()
      })
      .eq('id', toolId)
    
    return NextResponse.json({
      success: true,
      test_result: testResult
    })
    
  } catch (error: any) {
    console.error('[API] Error testing tool:', error)
    return NextResponse.json(
      { 
        error: 'Test execution failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

