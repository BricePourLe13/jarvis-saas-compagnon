import { NextRequest, NextResponse } from 'next/server'
import { VitrineIPLimiter } from '@/lib/vitrine-ip-limiter'

const vitrineIPLimiter = new VitrineIPLimiter()

/**
 * 🔒 API pour enregistrer la fin d'une session vitrine et comptabiliser le temps utilisé
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    
    const { durationSeconds } = await request.json()
    
    if (!durationSeconds || typeof durationSeconds !== 'number') {
      return NextResponse.json(
        { error: 'Durée invalide' },
        { status: 400 }
      )
    }
    
    // Enregistrer la durée
    const success = await vitrineIPLimiter.endSession(clientIP, durationSeconds)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erreur enregistrement durée' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      durationSeconds,
      creditsUsed: Math.ceil(durationSeconds / 60)
    })
    
  } catch (error) {
    console.error('❌ Erreur end-session:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


