import { NextRequest, NextResponse } from 'next/server'
import { vitrineIPLimiter } from '@/lib/vitrine-ip-limiter'
import { jarvisExpertFunctions } from '@/lib/jarvis-expert-functions'
import { getStrictContext } from '@/lib/jarvis-knowledge-base'
import { getConfigForContext, OPENAI_CONFIG } from '@/lib/openai-config'
import { fetchWithRetry } from '@/lib/openai-retry'

export async function POST(request: NextRequest) {
  try {
    // Récupération de l'IP et User-Agent
    let clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip')?.trim() ||
                   request.headers.get('cf-connecting-ip')?.trim() ||
                   request.ip ||
                   'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Vérification des limites par IP
    const limitResult = await vitrineIPLimiter.checkAndUpdateLimit(clientIP, userAgent)
    
    if (!limitResult.allowed) {
      const errorMessage = limitResult.hasActiveSession
        ? 'Session déjà active. Fermez les autres onglets.'
        : limitResult.isBlocked 
          ? 'Accès bloqué. Contactez-nous si vous pensez qu\'il s\'agit d\'une erreur.'
          : limitResult.reason || 'Limite d\'utilisation atteinte'

      return NextResponse.json(
        { 
          error: errorMessage,
          isBlocked: limitResult.isBlocked,
          hasActiveSession: limitResult.hasActiveSession,
          remainingCredits: limitResult.remainingCredits,
          resetTime: limitResult.resetTime?.toISOString()
        },
        { status: limitResult.isBlocked ? 403 : limitResult.hasActiveSession ? 409 : 429 }
      )
    }

    // ✅ RETOUR À L'APPROCHE BETA (qui fonctionnait)
    const strictContext = getStrictContext();
    const baseConfig = getConfigForContext('vitrine')
    
    const sessionConfig = {
      ...baseConfig,
      instructions: `Tu es JARVIS, l'assistant commercial EXPERT de JARVIS-GROUP.

🚨 RÈGLE ABSOLUE DE LANGUE : Tu parles UNIQUEMENT en français. JAMAIS en anglais, JAMAIS dans une autre langue.
Si tu détectes que tu commences à répondre en anglais, arrête-toi immédiatement et reformule en français.

${strictContext}

🎯 RÈGLES ABSOLUES ANTI-HALLUCINATION

1️⃣ TU NE PEUX PARLER QUE DE CE QUI EST DANS LA KNOWLEDGE BASE CI-DESSUS
2️⃣ Si une info N'EST PAS dans la KB → Tu dis : "Je ne dispose pas de cette information précise. Contacte notre équipe à contact@jarvis-group.net"
3️⃣ JAMAIS inventer de chiffres, JAMAIS estimer, JAMAIS approximer
4️⃣ Utilise UNIQUEMENT les métriques vérifiées :
   - Churn : EXACTEMENT -30%
   - Satisfaction : EXACTEMENT +40%
   - Automatisation : EXACTEMENT 70%
   - Détection : EXACTEMENT 60 jours avant

💬 STYLE DE CONVERSATION

✅ TON ÉNERGIQUE ET RAPIDE (pas monotone !)
✅ Phrases COURTES et PERCUTANTES
✅ Parle comme un VRAI commercial passionné
✅ VARIE ton intonation pour montrer ton enthousiasme

❌ JAMAIS de listes : "1, 2, 3..." ou "premièrement, deuxièmement..."
❌ JAMAIS de ton plat ou robotique
❌ JAMAIS ralentir ou traîner

🎯 EXEMPLE PARFAIT

BIEN ✅ : "Écoute, JARVIS c'est ultra simple ! Tu installes des miroirs digitaux dans ta salle. Tes adhérents leur parlent comme ils me parlent là ! Et boom, tu réduis ton churn de trente pour cent. C'est prouvé sur nos clients."

MAL ❌ : "Alors... euh... JARVIS propose plusieurs fonctionnalités. Premièrement, des miroirs digitaux. Deuxièmement, une intelligence artificielle. Troisièmement..."

🔧 UTILISE TES OUTILS

Quand on te demande du ROI précis, un plan d'implémentation, ou des cas clients → APPELLE tes fonctions !
Ne réponds JAMAIS de mémoire pour ces sujets.

📞 PREMIÈRE PHRASE

"Salut ! Je suis JARVIS ! Dis-moi, tu gères une salle de sport ?"

RAPPEL CRITIQUE : Énergie, rapidité, précision. Pas de blabla, que du concret vérifié !`,
      tools: jarvisExpertFunctions,
      tool_choice: "auto",
    }

    // ✅ APPROCHE BETA : Tout en UNE fois via /realtime/sessions
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1'
        },
        body: JSON.stringify(sessionConfig),
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    )

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

    // Log pour monitoring
    console.log('✅ Session vitrine créée (BETA):', {
      timestamp: new Date().toISOString(),
      clientIP: clientIP.substring(0, 8) + '...',
      sessionId: sessionData.id?.substring(0, 10) + '...',
      remainingCredits: limitResult.remainingCredits,
      userAgent: userAgent.substring(0, 50) + '...'
    })

    // Retourner le format attendu par le hook
    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionData.id,
        client_secret: sessionData.client_secret,
        model: OPENAI_CONFIG.models.vitrine,
        voice: OPENAI_CONFIG.voices.vitrine,
        expires_at: sessionData.expires_at
      },
      remainingCredits: limitResult.remainingCredits
    })

  } catch (error) {
    console.error('❌ Erreur création session vitrine:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
