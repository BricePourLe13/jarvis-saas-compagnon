/**
 * 🏢 API FRANCHISES - Prisma V2
 * Endpoints propres pour la gestion franchises
 */

import { NextRequest, NextResponse } from 'next/server'
import { FranchiseService } from '@/lib/services/franchise.service'

export const dynamic = 'force-dynamic'

/**
 * 🔍 GET - Récupérer toutes les franchises
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Ajouter vérification auth Super Admin
    
    const franchises = await FranchiseService.getAllFranchises()
    
    console.log(`✅ [FRANCHISES API] ${franchises.length} franchises récupérées`)
    
    return NextResponse.json({
      success: true,
      franchises,
      count: franchises.length
    })
    
  } catch (error: any) {
    console.error('❌ [FRANCHISES API] Erreur GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des franchises',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * ➕ POST - Créer nouvelle franchise
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Ajouter vérification auth Super Admin
    
    const body = await request.json()
    
    // Validation
    if (!body.name || !body.slug || !body.owner_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données requises manquantes: name, slug, owner_id' 
        },
        { status: 400 }
      )
    }
    
    const franchise = await FranchiseService.createFranchise({
      name: body.name,
      slug: body.slug,
      description: body.description,
      owner_id: body.owner_id,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      postal_code: body.postal_code
    })
    
    console.log(`✅ [FRANCHISES API] Franchise créée: ${franchise.name} (${franchise.slug})`)
    
    return NextResponse.json({
      success: true,
      franchise,
      message: 'Franchise créée avec succès'
    })
    
  } catch (error: any) {
    console.error('❌ [FRANCHISES API] Erreur POST:', error)
    
    // Erreur contrainte unique (slug)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce slug de franchise existe déjà',
          field: 'slug'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création de la franchise',
        details: error.message 
      },
      { status: 500 }
    )
  }
}