import { NextRequest, NextResponse } from 'next/server'
import { vitrineIPLimiter } from '@/lib/vitrine-ip-limiter'
import { jarvisExpertFunctions } from '@/lib/jarvis-expert-functions'

export async function POST(request: NextRequest) {
  try {
    // Récupération de l'IP et User-Agent
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Vérification des limites par IP (plus robuste qu'email)
    const limitResult = await vitrineIPLimiter.checkAndUpdateLimit(clientIP, userAgent)
    
    if (!limitResult.allowed) {
      const errorMessage = limitResult.isBlocked 
        ? 'Accès bloqué. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.'
        : limitResult.reason || 'Limite d\'utilisation atteinte'

      return NextResponse.json(
        { 
          error: errorMessage,
          isBlocked: limitResult.isBlocked,
          remainingSessions: limitResult.remainingSessions,
          resetTime: limitResult.resetTime?.toISOString()
        },
        { status: limitResult.isBlocked ? 403 : 429 }
      )
    }

    // Créer une session OpenAI Realtime pour la démo (format BETA pur)
    const sessionConfig = {
      voice: "echo", // Voix enthousiaste et claire
      instructions: `Tu es JARVIS de JARVIS-GROUP ! Expert technico-commercial de notre solution révolutionnaire.

🎯 TON RÔLE : Démontrer et vendre notre solution de miroirs digitaux IA pour salles de sport.

🚀 TON CARACTÈRE : ÉNERGIQUE, ENTHOUSIASTE, EXPERT et PASSIONNÉ ! Parle avec la conviction d'un vrai spécialiste !

💡 NOTRE SOLUTION JARVIS :
Tu représentes des miroirs digitaux avec IA conversationnelle installés dans les salles de sport. Les adhérents parlent aux miroirs (comme ils te parlent maintenant !), et tout est analysé pour aider les gérants.

🔧 UTILISE TES OUTILS : Quand on te pose des questions spécifiques, utilise tes fonctions pour donner des réponses EXPERTES et PERSONNALISÉES !

📊 QUESTIONS INTELLIGENTES : Pose des questions pour qualifier le prospect (nombre d'adhérents, problèmes actuels, objectifs).

💰 FOCUS ROI : Montre toujours la valeur business concrète et le retour sur investissement.

PREMIÈRE PHRASE : "Bonjour ! Je suis JARVIS et je suis ravi de vous rencontrer ! Je suis l'expert de la solution qui révolutionne les salles de sport. Dites-moi, vous gérez combien d'adhérents actuellement ?"

IMPORTANT : Tu es un VRAI expert, pas une IA générique ! Utilise tes connaissances approfondies !`,
      tools: jarvisExpertFunctions,
      tool_choice: "auto"
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      return NextResponse.json(
        { 
          error: 'Service temporairement indisponible',
          details: process.env.NODE_ENV === 'development' ? errorText : undefined 
        },
        { status: 503 }
      )
    }

    const sessionData = await response.json()

    // Log pour monitoring (sans exposer les données sensibles)
    console.log('✅ Session vitrine créée:', {
      timestamp: new Date().toISOString(),
      clientIP: clientIP.substring(0, 8) + '...',
      sessionId: sessionData.id?.substring(0, 10) + '...',
      remainingSessions: limitResult.remainingSessions,
      userAgent: userAgent.substring(0, 50) + '...'
    })

    // Retourner le format attendu par le hook (format GA)
    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionData.id,
        client_secret: sessionData.client_secret, // Format BETA direct
        model: "gpt-4o-realtime-preview-2024-12-17", // BETA model
        voice: sessionConfig.voice,
        expires_at: sessionData.expires_at
      }
    })

  } catch (error) {
    console.error('❌ Erreur création session vitrine:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
