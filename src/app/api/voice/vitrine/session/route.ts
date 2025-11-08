import { NextRequest, NextResponse } from 'next/server'
import { vitrineIPLimiter } from '@/lib/vitrine-ip-limiter'
import { jarvisExpertFunctions } from '@/lib/jarvis-expert-functions'
import { getStrictContext } from '@/lib/jarvis-knowledge-base'
import { getConfigForContext, OPENAI_CONFIG, convertToGAFormat } from '@/lib/openai-config'
import { fetchWithRetry } from '@/lib/openai-retry'

export async function POST(request: NextRequest) {
  try {
    // Récupération de l'IP et User-Agent
    // Essayer plusieurs méthodes pour détecter l'IP réelle
    let clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip')?.trim() ||
                   request.headers.get('cf-connecting-ip')?.trim() || // Cloudflare
                   request.ip || // Next.js request.ip
                   'unknown'
    
    // Log pour debug (masqué en production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 IP détectée:', {
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'x-real-ip': request.headers.get('x-real-ip'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
        'request.ip': request.ip,
        'final': clientIP
      })
    }
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Vérification des limites par IP (plus robuste qu'email)
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
          remainingCredits: limitResult.remainingCredits, // Crédits (minutes) au lieu de sessions
          resetTime: limitResult.resetTime?.toISOString()
        },
        { status: limitResult.isBlocked ? 403 : limitResult.hasActiveSession ? 409 : 429 }
      )
    }

    // 📚 Récupérer le contexte strict de la knowledge base
    const strictContext = getStrictContext();

    // Créer une session OpenAI Realtime pour la démo
    const baseConfig = getConfigForContext('vitrine')
    
    // Instructions complètes pour JARVIS commercial
    const instructions = `Tu es JARVIS, l'assistant commercial EXPERT de JARVIS-GROUP.

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

RAPPEL CRITIQUE : Énergie, rapidité, précision. Pas de blabla, que du concret vérifié !`
    
    // Convertir au format GA avec instructions et tools
    const gaConfig = convertToGAFormat(baseConfig)
    const sessionConfig = {
      ...gaConfig,
      instructions,
      tools: jarvisExpertFunctions,
      tool_choice: "auto",
    }

    // 🔍 DEBUG: Log de la config envoyée à OpenAI
    console.log('📡 [VITRINE] Appel OpenAI avec:', {
      model: sessionConfig.model,
      voice: sessionConfig.audio.output.voice,
      output_modalities: sessionConfig.output_modalities,
      turn_detection: sessionConfig.audio.input.turn_detection,
      instructions_length: sessionConfig.instructions.length,
      tools_count: sessionConfig.tools?.length || 0,
      has_api_key: !!process.env.OPENAI_API_KEY
    })
    
    // ✅ Retry automatique avec backoff exponentiel
    // 🚨 FORMAT GA : Endpoint /v1/realtime/client_secrets (pas /sessions)
    // Doc ligne 336-362: https://platform.openai.com/docs/api-reference/realtime-sessions/create-realtime-client-secret
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionConfig  // ✅ FORMAT GA : sessionConfig déjà au bon format
        }),
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        retryableStatuses: [429, 500, 502, 503, 504]
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [VITRINE] Erreur OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        model_used: sessionConfig.model,
        voice_used: sessionConfig.audio.output.voice,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // 🚨 CRITIQUE: Parser l'erreur OpenAI pour diagnostic
      let parsedError
      try {
        parsedError = JSON.parse(errorText)
      } catch (e) {
        parsedError = errorText
      }
      
      console.error('❌ [VITRINE] Détails erreur parsée:', parsedError)
      
      return NextResponse.json(
        { 
          error: 'Service temporairement indisponible',
          details: process.env.NODE_ENV === 'development' ? errorText : undefined,
          debug: {
            model: sessionConfig.model,
            status: response.status,
            error: parsedError
          }
        },
        { status: 503 }
      )
    }

    const sessionData = await response.json()
    
    // ✅ FORMAT GA : La réponse contient { value: "ek_xxx", expires_at: xxx }
    // Doc ligne 360-361: console.log(data.value)

    // Log pour monitoring (sans exposer les données sensibles)
    console.log('✅ Session vitrine créée:', {
      timestamp: new Date().toISOString(),
      clientIP: clientIP.substring(0, 8) + '...',
      tokenPrefix: sessionData.value?.substring(0, 10) + '...',
      remainingCredits: limitResult.remainingCredits, // Minutes restantes
      userAgent: userAgent.substring(0, 50) + '...'
    })

    // Retourner le format attendu par le hook (format GA)
    // Note: On génère un session_id temporaire côté serveur pour tracking
    const tempSessionId = `sess_vitrine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return NextResponse.json({
      success: true,
      session: {
        session_id: tempSessionId,
        client_secret: {
          value: sessionData.value,  // ✅ FORMAT GA : token ephemeral
          expires_at: sessionData.expires_at
        },
        model: OPENAI_CONFIG.models.vitrine,
        voice: OPENAI_CONFIG.voices.vitrine,
        expires_at: sessionData.expires_at || 0
      },
      remainingCredits: limitResult.remainingCredits // Informer le client des crédits restants
    })

  } catch (error) {
    console.error('❌ Erreur création session vitrine:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
