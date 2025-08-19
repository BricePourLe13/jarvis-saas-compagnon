/**
 * 🏢 API FRANCHISE BY ID - Prisma V2
 * Endpoint détail franchise
 */

import { NextRequest, NextResponse } from 'next/server'
import { FranchiseService } from '@/lib/services/franchise.service'

export const dynamic = 'force-dynamic'

/**
 * 🔍 GET - Récupérer franchise par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const franchise = await FranchiseService.getFranchiseStats(id)
    
    if (!franchise) {
      return NextResponse.json(
        { success: false, error: 'Franchise non trouvée' },
        { status: 404 }
      )
    }
    
    console.log(`✅ [FRANCHISE API] Franchise récupérée: ${franchise.franchise.name}`)
    
    return NextResponse.json({
      success: true,
      franchise: franchise.franchise,
      stats: franchise.stats
    })
    
  } catch (error: any) {
    console.error('❌ [FRANCHISE API] Erreur GET by ID:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération de la franchise',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
