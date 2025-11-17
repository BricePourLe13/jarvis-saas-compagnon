/**
 * API Route: Execute Custom Tool
 * Exécute un custom tool via le CustomToolExecutor
 */

import { logger } from '@/lib/production-logger';
import { NextRequest, NextResponse } from 'next/server'
import { CustomToolExecutor } from '@/lib/custom-tools/executor'
import { buildExecutionContext } from '@/lib/custom-tools/helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      gym_id, 
      tool_name, 
      args, 
      member_id, 
      session_id 
    } = body

    if (!gym_id || !tool_name || !member_id || !session_id) {
      return NextResponse.json(
        { error: 'gym_id, tool_name, member_id et session_id sont requis' },
        { status: 400 }
      )
    }

    logger.info(`🔧 [CUSTOM TOOL] Exécution: ${tool_name} pour member ${member_id}`)

    // 1. Construire le contexte d'exécution
    const context = await buildExecutionContext(member_id, gym_id, session_id)

    // 2. Exécuter le tool
    const result = await CustomToolExecutor.execute(
      gym_id,
      tool_name,
      args || {},
      context
    )

    if (result.success) {
      logger.info(`✅ [CUSTOM TOOL] ${tool_name} exécuté avec succès`)
      
      return NextResponse.json({
        success: true,
        result: result.data,
        execution_time_ms: result.execution_time_ms
      })
    } else {
      logger.error(`❌ [CUSTOM TOOL] ${tool_name} échoué:`, result.error)
      
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          execution_time_ms: result.execution_time_ms
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('[API] Error executing custom tool:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur interne'
      },
      { status: 500 }
    )
  }
}


