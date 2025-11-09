/**
 * API Route: Single Custom Tool Actions
 * GET: Récupérer un tool
 * PATCH: Mettre à jour un tool
 * DELETE: Supprimer un tool
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCustomTool } from '@/lib/custom-tools/validators'
import type { CustomToolFormData } from '@/types/custom-tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET - Récupérer un tool par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params
    
    const { data: tool, error } = await supabase
      .from('custom_tools')
      .select('*')
      .eq('id', toolId)
      .single()
    
    if (error || !tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tool
    })
    
  } catch (error: any) {
    console.error('[API] Error in GET /tools/[toolId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Mettre à jour un tool
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params
    const body = await request.json()
    const { tool_data } = body as { tool_data: Partial<CustomToolFormData> }
    
    if (!tool_data) {
      return NextResponse.json(
        { error: 'tool_data is required' },
        { status: 400 }
      )
    }
    
    // Valider si données complètes
    if (tool_data.name && tool_data.description) {
      const validation = validateCustomTool(tool_data as CustomToolFormData)
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            validation_errors: validation.errors
          },
          { status: 400 }
        )
      }
    }
    
    // Mettre à jour
    const { data: updatedTool, error } = await supabase
      .from('custom_tools')
      .update({
        ...tool_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', toolId)
      .select()
      .single()
    
    if (error) {
      console.error('[API] Error updating tool:', error)
      return NextResponse.json(
        { error: 'Failed to update tool', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tool: updatedTool
    })
    
  } catch (error: any) {
    console.error('[API] Error in PATCH /tools/[toolId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer un tool
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params
    
    // Supprimer (cascade delete sur executions)
    const { error } = await supabase
      .from('custom_tools')
      .delete()
      .eq('id', toolId)
    
    if (error) {
      console.error('[API] Error deleting tool:', error)
      return NextResponse.json(
        { error: 'Failed to delete tool', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Tool deleted successfully'
    })
    
  } catch (error: any) {
    console.error('[API] Error in DELETE /tools/[toolId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

