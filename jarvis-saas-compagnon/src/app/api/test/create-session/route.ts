import { NextRequest, NextResponse } from 'next/server'
import { createTestSession, createMultipleTestSessions } from '@/lib/test-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      gymId, 
      franchiseId,
      multiple = false,
      count = 3
    } = body

    if (!gymId) {
      return NextResponse.json(
        { error: 'gymId est requis' },
        { status: 400 }
      )
    }

    console.log('🧪 [TEST API] Création de session(s) de test...')

    if (multiple) {
      // Créer plusieurs sessions
      const sessions = await createMultipleTestSessions(gymId, franchiseId, count)
      
      return NextResponse.json({
        success: true,
        message: `${sessions.length} sessions de test créées`,
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          totalCost: s.totalCost,
          durationSeconds: s.durationSeconds
        }))
      })
    } else {
      // Créer une seule session
      const session = await createTestSession(gymId, franchiseId)
      
      return NextResponse.json({
        success: true,
        message: 'Session de test créée',
        session: {
          sessionId: session.sessionId,
          totalCost: session.totalCost,
          durationSeconds: session.durationSeconds
        }
      })
    }

  } catch (error) {
    console.error('🧪 [TEST API] Erreur:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la session de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
} 