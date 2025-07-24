// 🧠 SYSTÈME DE MÉMOIRE CONVERSATIONNELLE - PHASE 5
// Maintient la cohérence émotionnelle et la personnalité de JARVIS

export interface ConversationMemory {
  session_id: string
  member_id?: string
  gym_slug: string
  
  // 🎭 Historique émotionnel
  emotional_history: {
    timestamp: number
    user_emotion: string
    jarvis_response_tone: string
    interaction_quality: 'positive' | 'neutral' | 'negative'
  }[]
  
  // 🎪 Personnalité adaptative
  personality_traits: {
    humor_level: number // 0-1, s'adapte selon les réactions utilisateur
    formality_level: number // 0-1, devient plus familier avec le temps
    energy_baseline: number // 0-1, niveau d'énergie habituel pour cet utilisateur
    empathy_sensitivity: number // 0-1, à quel point JARVIS doit être empathique
  }
  
  // 🗣️ Patterns de conversation
  conversation_patterns: {
    preferred_hesitations: string[] // Hésitations qui fonctionnent bien avec cet utilisateur
    effective_reactions: string[] // Réactions émotionnelles appréciées
    successful_humor: string[] // Types d'humour qui font mouche
    conversation_pace: 'slow' | 'medium' | 'fast'
  }
  
  // 📈 Contexte de progression
  progress_context: {
    workout_mood_trends: string[] // Humeur typique pendant les entraînements
    motivational_triggers: string[] // Ce qui motive vraiment l'utilisateur
    frustration_patterns: string[] // Ce qui cause de la frustration
    success_celebrations: string[] // Comment l'utilisateur aime célébrer
  }
  
  // ⏰ Adaptation temporelle
  time_patterns: {
    morning_personality: 'energetic' | 'calm' | 'grumpy' | 'focused'
    evening_personality: 'tired' | 'relaxed' | 'social' | 'motivated'
    workout_time_preferences: string[]
  }
  
  // 🎯 Objectifs relationnels
  relationship_building: {
    trust_level: number // 0-1, confiance établie
    familiarity_level: number // 0-1, niveau de familiarité
    inside_jokes: string[] // Blagues/références internes développées
    shared_experiences: string[] // Expériences partagées mémorables
  }
}

// 💾 STOCKAGE EN MÉMOIRE (Redis/cache en production)
const conversationMemories = new Map<string, ConversationMemory>()

// 🎬 FONCTION : Initialiser la mémoire conversationnelle
export function initializeConversationMemory(
  sessionId: string,
  memberId?: string,
  gymSlug: string = 'default'
): ConversationMemory {
  
  const defaultMemory: ConversationMemory = {
    session_id: sessionId,
    member_id: memberId,
    gym_slug: gymSlug,
    
    emotional_history: [],
    
    personality_traits: {
      humor_level: 0.7, // Assez taquin par défaut
      formality_level: 0.6, // Professionnel mais amical
      energy_baseline: 0.8, // Plutôt énergique
      empathy_sensitivity: 0.8 // Très empathique
    },
    
    conversation_patterns: {
      preferred_hesitations: ['Alors...', 'Hmm...', 'Écoute...'],
      effective_reactions: ['Super !', 'Ah !', 'Intéressant !'],
      successful_humor: [],
      conversation_pace: 'medium'
    },
    
    progress_context: {
      workout_mood_trends: [],
      motivational_triggers: [],
      frustration_patterns: [],
      success_celebrations: []
    },
    
    time_patterns: {
      morning_personality: 'energetic',
      evening_personality: 'motivated',
      workout_time_preferences: []
    },
    
    relationship_building: {
      trust_level: 0.5, // Neutre au début
      familiarity_level: 0.3, // Peu familier
      inside_jokes: [],
      shared_experiences: []
    }
  }
  
  conversationMemories.set(sessionId, defaultMemory)
  return defaultMemory
}

// 📝 FONCTION : Enregistrer une interaction
export function recordInteraction(
  sessionId: string,
  userEmotion: string,
  jarvisResponseTone: string,
  interactionQuality: 'positive' | 'neutral' | 'negative',
  additionalContext?: {
    user_reaction?: string
    humor_success?: boolean
    new_pattern_discovered?: string
  }
): void {
  
  const memory = conversationMemories.get(sessionId)
  if (!memory) return
  
  // 📊 Enregistrer l'interaction
  memory.emotional_history.push({
    timestamp: Date.now(),
    user_emotion: userEmotion,
    jarvis_response_tone: jarvisResponseTone,
    interaction_quality: interactionQuality
  })
  
  // 🎭 Adapter la personnalité selon les réactions
  if (additionalContext?.humor_success && jarvisResponseTone.includes('taquin')) {
    memory.personality_traits.humor_level = Math.min(1, memory.personality_traits.humor_level + 0.1)
  } else if (additionalContext?.user_reaction === 'confused' && jarvisResponseTone.includes('blague')) {
    memory.personality_traits.humor_level = Math.max(0.3, memory.personality_traits.humor_level - 0.1)
  }
  
  // 🤝 Ajuster le niveau de familiarité
  if (interactionQuality === 'positive') {
    memory.relationship_building.familiarity_level = Math.min(1, memory.relationship_building.familiarity_level + 0.05)
    memory.relationship_building.trust_level = Math.min(1, memory.relationship_building.trust_level + 0.03)
  }
  
  // ⏰ Garder seulement les 50 dernières interactions pour performance
  if (memory.emotional_history.length > 50) {
    memory.emotional_history = memory.emotional_history.slice(-50)
  }
  
  conversationMemories.set(sessionId, memory)
}

// 🎯 FONCTION : Adapter la réponse selon la mémoire
export function adaptResponseToMemory(
  sessionId: string,
  baseResponse: string,
  currentEmotion: string
): string {
  
  const memory = conversationMemories.get(sessionId)
  if (!memory) return baseResponse
  
  const currentHour = new Date().getHours()
  const isEvening = currentHour >= 18
  const isMorning = currentHour <= 10
  
  // 🎪 Adaptation selon la personnalité acquise
  let adaptedResponse = baseResponse
  
  // 😄 Ajuster le niveau d'humour
  if (memory.personality_traits.humor_level > 0.8 && !adaptedResponse.includes('*rire*')) {
    adaptedResponse = adaptedResponse.replace('.', ' *petit rire*.')
  }
  
  // 🤝 Ajuster la familiarité
  if (memory.relationship_building.familiarity_level > 0.7) {
    adaptedResponse = adaptedResponse.replace(/^(Alors|Bon)/, 'Écoute')
    adaptedResponse = adaptedResponse.replace(/vous/, 'tu')
  }
  
  // ⏰ Adaptation temporelle
  if (isMorning && memory.time_patterns.morning_personality === 'calm') {
    adaptedResponse = adaptedResponse.replace(/!$/, '...')
    adaptedResponse = `*ton posé* ${adaptedResponse}`
  } else if (isEvening && memory.time_patterns.evening_personality === 'tired') {
    adaptedResponse = `*souffle* ${adaptedResponse}`
  }
  
  // 📈 Ajouter des références aux expériences partagées
  if (memory.relationship_building.shared_experiences.length > 0 && Math.random() < 0.3) {
    const experience = memory.relationship_building.shared_experiences[
      Math.floor(Math.random() * memory.relationship_building.shared_experiences.length)
    ]
    adaptedResponse += ` Ça me rappelle ${experience}...`
  }
  
  return adaptedResponse
}

// 🔍 FONCTION : Analyser les patterns de conversation
export function analyzeConversationPatterns(sessionId: string): {
  dominant_emotions: string[]
  response_effectiveness: number
  relationship_progression: 'building' | 'stable' | 'declining'
  recommended_adjustments: string[]
} {
  
  const memory = conversationMemories.get(sessionId)
  if (!memory || memory.emotional_history.length < 5) {
    return {
      dominant_emotions: ['curious'],
      response_effectiveness: 0.5,
      relationship_progression: 'building',
      recommended_adjustments: []
    }
  }
  
  // 📊 Analyser les émotions dominantes
  const emotionCounts = memory.emotional_history.reduce((acc, interaction) => {
    acc[interaction.user_emotion] = (acc[interaction.user_emotion] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const dominant_emotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([emotion]) => emotion)
  
  // 📈 Calculer l'efficacité des réponses
  const positiveInteractions = memory.emotional_history.filter(i => i.interaction_quality === 'positive').length
  const response_effectiveness = positiveInteractions / memory.emotional_history.length
  
  // 🤝 Évaluer la progression relationnelle
  const recentTrust = memory.relationship_building.trust_level
  const recentFamiliarity = memory.relationship_building.familiarity_level
  
  let relationship_progression: 'building' | 'stable' | 'declining' = 'stable'
  
  if (recentTrust > 0.7 && recentFamiliarity > 0.6) {
    relationship_progression = 'building'
  } else if (response_effectiveness < 0.4) {
    relationship_progression = 'declining'
  }
  
  // 💡 Recommandations d'ajustement
  const recommended_adjustments: string[] = []
  
  if (memory.personality_traits.humor_level < 0.3) {
    recommended_adjustments.push('Réduire l\'humour, être plus sérieux')
  } else if (memory.personality_traits.humor_level > 0.9) {
    recommended_adjustments.push('Tempérer l\'humour, être plus équilibré')
  }
  
  if (response_effectiveness < 0.5) {
    recommended_adjustments.push('Ajuster l\'empathie et l\'écoute')
  }
  
  if (dominant_emotions.includes('frustrated')) {
    recommended_adjustments.push('Prioriser le soutien et la patience')
  }
  
  return {
    dominant_emotions,
    response_effectiveness,
    relationship_progression,
    recommended_adjustments
  }
}

// 🎨 FONCTION : Générer un prompt contextuel basé sur la mémoire
export function generateContextualPrompt(sessionId: string): string {
  const memory = conversationMemories.get(sessionId)
  if (!memory) return ''
  
  const patterns = analyzeConversationPatterns(sessionId)
  const currentHour = new Date().getHours()
  
  let contextualPrompt = `\n\n🧠 CONTEXTE MÉMORIEL POUR CETTE CONVERSATION :

📊 Profil utilisateur adaptatif :
- Niveau d'humour préféré : ${Math.round(memory.personality_traits.humor_level * 100)}%
- Familiarité établie : ${Math.round(memory.relationship_building.familiarity_level * 100)}%
- Confiance acquise : ${Math.round(memory.relationship_building.trust_level * 100)}%
- Rythme de conversation préféré : ${memory.conversation_patterns.conversation_pace}

🎭 Émotions dominantes récentes : ${patterns.dominant_emotions.join(', ')}
🎯 Efficacité des réponses : ${Math.round(patterns.response_effectiveness * 100)}%
🤝 Progression relationnelle : ${patterns.relationship_progression}

⏰ Adaptation temporelle (${currentHour}h) : 
${currentHour <= 10 ? `Mode matinal - ${memory.time_patterns.morning_personality}` : 
  currentHour >= 18 ? `Mode soirée - ${memory.time_patterns.evening_personality}` : 
  'Mode journée - équilibré'}

💡 Ajustements recommandés : ${patterns.recommended_adjustments.join(' | ')}

🎪 Éléments qui fonctionnent bien avec cet utilisateur :
- Hésitations efficaces : ${memory.conversation_patterns.preferred_hesitations.join(', ')}
- Réactions appréciées : ${memory.conversation_patterns.effective_reactions.join(', ')}
${memory.relationship_building.inside_jokes.length > 0 ? 
  `- Références internes : ${memory.relationship_building.inside_jokes.join(', ')}` : ''}

UTILISE CES INFORMATIONS pour adapter naturellement ton style sans mentionner explicitement ce système.`

  return contextualPrompt
}

// 🔄 EXPORTS: Les fonctions sont déjà exportées individuellement avec export function
export {
  conversationMemories
} 