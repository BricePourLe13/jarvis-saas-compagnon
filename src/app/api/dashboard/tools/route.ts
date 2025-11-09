/**
 * API Route: Custom Tools Management
 * GET: Liste des tools d'une gym
 * POST: Créer un nouveau tool
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCustomTool, isToolNameUnique } from '@/lib/custom-tools/validators'
import type { CustomToolFormData } from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET - Récupère tous les tools d'une gym
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')
    
    if (!gymId) {
      return NextResponse.json(
        { error: 'gym_id is required' },
        { status: 400 }
      )
    }
    
    const { data: tools, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[API] Error fetching tools:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tools' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tools: tools || []
    })
    
  } catch (error: any) {
    console.error('[API] Error in GET /tools:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Créer un nouveau custom tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gym_id, tool_data } = body as {
      gym_id: string
      tool_data: CustomToolFormData
    }
    
    if (!gym_id || !tool_data) {
      return NextResponse.json(
        { error: 'gym_id and tool_data are required' },
        { status: 400 }
      )
    }
    
    // 1. Valider données
    const validation = validateCustomTool(tool_data)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validation_errors: validation.errors
        },
        { status: 400 }
      )
    }
    
    // 2. Vérifier unicité du nom
    const isUnique = await isToolNameUnique(gym_id, tool_data.name)
    if (!isUnique) {
      return NextResponse.json(
        { error: `Un tool nommé "${tool_data.name}" existe déjà pour cette gym` },
        { status: 409 }
      )
    }
    
    // 3. Créer le tool
    const { data: newTool, error } = await supabase
      .from('custom_tools')
      .insert({
        gym_id,
        name: tool_data.name,
        display_name: tool_data.display_name,
        description: tool_data.description,
        category: tool_data.category,
        icon: tool_data.icon,
        type: tool_data.type,
        status: 'draft',
        config: tool_data.config,
        parameters: tool_data.parameters,
        auth_type: tool_data.auth_type,
        auth_config: tool_data.auth_config,
        rate_limit_per_member_per_day: tool_data.rate_limit_per_member_per_day,
        rate_limit_per_gym_per_hour: tool_data.rate_limit_per_gym_per_hour,
        test_cases: tool_data.test_cases || []
      })
      .select()
      .single()
    
    if (error) {
      console.error('[API] Error creating tool:', error)
      return NextResponse.json(
        { error: 'Failed to create tool', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tool: newTool
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('[API] Error in POST /tools:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

