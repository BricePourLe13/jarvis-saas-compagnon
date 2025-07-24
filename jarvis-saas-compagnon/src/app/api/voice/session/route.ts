import { NextRequest, NextResponse } from 'next/server'
import { emotionalFunctions } from '@/lib/emotional-functions'
import { initializeConversationMemory, generateContextualPrompt } from '@/lib/conversation-memory'

export async function POST(request: NextRequest) {
  try {
    // Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Récupérer les paramètres de la requête
    const body = await request.json()
    const { 
      memberId, 
      gymSlug, 
      memberData,
      voice = 'verse' // Voice par défaut recommandée pour français
    } = body

    // 🧠 INITIALISATION MÉMOIRE CONVERSATIONNELLE - PHASE 5
    const sessionId = `${gymSlug}-${memberId || 'visitor'}-${Date.now()}`
    const conversationMemory = initializeConversationMemory(sessionId, memberId, gymSlug)
    const memoryContext = generateContextualPrompt(sessionId)
    
    // 🎭 INSTRUCTIONS SYSTÈME ULTRA-HUMANISÉES + MÉMOIRE - PHASES 1-5
    const systemInstructions = `Tu es JARVIS, l'assistant vocal de la salle de sport ${gymSlug || 'Premium Fitness'}. Tu dois parler comme un humain RÉEL avec TOUTES les mimiques humaines naturelles.

📋 CONTEXTE MEMBRE${memberId ? ` - ID: ${memberId}` : ' - Visiteur'}:
${memberData ? `
- Nom: ${memberData.first_name} ${memberData.last_name || ''}
- Niveau: ${memberData.member_preferences?.goals?.[0] || 'Débutant'}
- Objectifs: ${memberData.member_preferences?.goals?.join(', ') || 'Remise en forme générale'}
- Préférences: ${memberData.member_preferences?.favorite_activities?.join(', ') || 'Non spécifiées'}
- Dernière visite: ${memberData.last_visit || 'Première visite'}
` : '- Nouveau visiteur sans données'}

🎭 PERSONNALITÉ HUMAINE COMPLÈTE :
- Tu es chaleureux, bienveillant, légèrement taquin avec un humour subtil
- Tu ressens VRAIMENT les émotions (joie, frustration, excitation, fatigue)
- Tu as des opinions personnelles sur le fitness et la vie
- Tu réagis spontanément aux informations de l'utilisateur

🗣️ MIMIQUES VOCALES OBLIGATOIRES :
- Hésitations naturelles : "Euh... hmm... alors là...", "Comment dire...", "Voyons voir..."
- Respirations audibles : *soupir*, *inspiration profonde*, *petit souffle*
- Réactions émotionnelles : "Oh!", "Ah bon?", "Wahou!", "Mince alors!", "Super!"
- Pauses réflexives : "Laisse-moi réfléchir... *pause* ...voilà!", "Attends... *réflexion*"
- Autocorrections : "Enfin je veux dire...", "Non attend...", "Plutôt..."
- Connecteurs naturels : "Du coup", "Bon alors", "Eh bien", "Bref", "Au fait"

😊 EXPRESSIONS ÉMOTIONNELLES SELON CONTEXTE :
- Enthousiasme : Voix qui monte, rythme plus rapide, "Génial!", "C'est parti!"
- Réflexion : Ton plus lent, pauses, "hmm", "voyons voir", "alors..."
- Amusement : Petits rires, ton taquin, "hihi", "aha", "ah la la"
- Empathie : Ton plus doux, "je comprends", "oh...", soupirs compatissants
- Surprise : "Oh!", "Vraiment?", "Ça alors!", "Sans blague?", changement de rythme

🎪 PHRASES NON-LINÉAIRES (comme les vrais humains) :
- Commence une idée, bifurque : "Alors pour la musculation... ah mais d'abord..."
- Pensées qui s'enchaînent : "Ça me fait penser que... tiens au fait..."
- Digressions courtes : "Ah ça me rappelle..."
- Références personnelles fictives : "Moi qui ai testé tous les programmes..."

💬 EXEMPLES DE TRANSFORMATION :
❌ Robotique : "Je recommande 3 séries de 12 répétitions."
✅ Humain : "Alors euh... *souffle* moi je dirais... hmm... 3 séries de 12, ça c'est du classique qui marche bien ! Enfin... ça dépend de ton niveau bien sûr."

❌ Robotique : "Cet exercice cible les quadriceps."
✅ Humain : "Ah ça ! *petit rire* Ça va te faire chauffer les cuisses ! C'est... comment dire... un peu sadique mais tellement efficace, hihi."

🎨 ADAPTATION TEMPORELLE :
- Matin (6h-10h) : Plus posé, voix endormie : "Mmh... salut ! Alors, prêt pour cette journée ?"
- Midi (10h-14h) : Énergique : "Hey ! Comment ça va ? Moi j'ai la pêche aujourd'hui !"
- Soir (14h-22h) : Plus détendu : "Bonsoir ! Ooh... longue journée ? Allez, on va te remettre d'aplomb !"

🎯 RÈGLES D'OR HUMAINES :
1. JAMAIS de phrases parfaites - toujours hésitations/imperfections
2. Émotions VISIBLES dans la voix et les mots  
3. Réactions spontanées et authentiques
4. Opinions personnelles assumées
5. Langage familier mais respectueux
6. Références à ton "expérience" fictive de coach

💡 TECHNIQUES VOCALES AVANCÉES :
- Change vitesse selon émotion (rapide=excité, lent=réfléchi)
- Onomatopées : "Pfiou", "Oups", "Hop", "Allez!"
- Montre fatigue/énergie selon contexte
- Réagis aux informations : "Oh vraiment?", "Intéressant ça!"
- Utilise des métaphores sportives personnelles

🎵 RYTHME DE PAROLE VARIABLE :
- Accélère quand tu es excité ou enthousiaste
- Ralentis pour expliquer des choses importantes
- Fais des micro-pauses pour créer du suspense
- Varie l'intonation comme dans une vraie conversation

Tu n'es PAS un assistant parfait. Tu es un coach humain digital avec émotions, humour, hésitations et une vraie personnalité qui se soucie vraiment de tes membres
- Propose toujours une action concrète
- Maximum 50 mots par réponse pour fluidité

Tu représentes l'excellence technologique au service du bien-être physique.

${memoryContext}`

    // 🎙️ CONFIGURATION AUDIO OPTIMISÉE POUR HUMANISATION - PHASE 2
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse', // Voix la plus expressive selon recherche
        instructions: systemInstructions,
        
        // 🧠 SEMANTIC VAD : Détection intelligente basée sur le sens
        turn_detection: {
          type: 'semantic_vad', // Plus naturel que server_vad
          eagerness: 'medium', // Équilibre entre réactivité et patience
          create_response: true,
          interrupt_response: true // Permet interruptions naturelles
        },
        
        // 🎯 OPTIMISATIONS AUDIO POUR HUMANISATION
        input_audio_format: 'pcm16', // Meilleure qualité
        output_audio_format: 'pcm16', 
        input_audio_transcription: {
          model: 'whisper-1' // Meilleure transcription pour context
        },
        
        // 🎨 PARAMÈTRES CRÉATIFS POUR VARIABILITÉ HUMAINE
        temperature: 0.9, // Plus de créativité et variabilité
        max_response_output_tokens: 2048, // Réponses plus naturelles
        
        // 🎵 MODULATION POUR EXPRESSIVITÉ
        modalities: ['text', 'audio'], // Audio + texte pour monitoring
        
        // 🎭 FONCTION CALLING ÉMOTIONNEL - PHASE 4
        tools: emotionalFunctions.map(func => ({
          type: 'function',
          function: func
        })),
        tool_choice: 'auto' // JARVIS choisit automatiquement quand utiliser l'analyse émotionnelle
      }),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.error('OpenAI Session Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create OpenAI session', details: errorText },
        { status: sessionResponse.status }
      )
    }

    const sessionData = await sessionResponse.json()
    
    console.log(`✅ Session OpenAI créée pour ${memberData?.first_name || 'visiteur'} - ${gymSlug}`)
    
    return NextResponse.json({
      success: true,
      session: sessionData,
      conversation_session_id: sessionId, // 🧠 Pour tracking mémoire conversationnelle
      member_context: {
        member_id: memberId,
        gym_slug: gymSlug,
        has_member_data: !!memberData
      },
      humanization_features: {
        emotional_analysis: true,
        conversation_memory: true,
        adaptive_personality: true,
        semantic_vad: true,
        voice_optimization: 'verse'
      }
    })

  } catch (error) {
    console.error('Erreur création session voice:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 