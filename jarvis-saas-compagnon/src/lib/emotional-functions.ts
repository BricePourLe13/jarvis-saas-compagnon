// 🎭 SYSTÈME DE FUNCTION CALLING ÉMOTIONNEL - PHASE 3
// Détecte l'état émotionnel de l'utilisateur et adapte les réponses de JARVIS

export interface EmotionalState {
  primary_emotion: 'motivated' | 'frustrated' | 'tired' | 'excited' | 'anxious' | 'confident' | 'overwhelmed' | 'curious'
  intensity: 'low' | 'medium' | 'high'
  context: 'workout' | 'goal_setting' | 'progress_check' | 'general_chat' | 'problem_solving'
  indicators: string[]
}

export interface EmotionalResponse {
  tone_adjustments: {
    pace: 'slower' | 'normal' | 'faster'
    energy: 'calm' | 'moderate' | 'high'
    empathy_level: 'supportive' | 'encouraging' | 'celebratory' | 'gentle'
  }
  vocal_elements: {
    hesitations: string[]
    emotional_reactions: string[]
    supportive_sounds: string[]
  }
  response_style: {
    approach: string
    examples: string[]
  }
}

// 🎯 FONCTION : Analyser l'état émotionnel à partir du texte/contexte
export const analyzeEmotionalState = {
  name: "analyze_emotional_state",
  description: "Analyser l'état émotionnel de l'utilisateur pour adapter la réponse de JARVIS de manière humaine et empathique",
  parameters: {
    type: "object",
    properties: {
      user_message: {
        type: "string",
        description: "Le message ou contexte de l'utilisateur à analyser"
      },
      voice_tone_indicators: {
        type: "array",
        items: { type: "string" },
        description: "Indicateurs vocaux détectés (énergie, frustration, excitation, etc.)"
      },
      session_context: {
        type: "object",
        properties: {
          time_of_day: { type: "string" },
          previous_interactions: { type: "array", items: { type: "string" } },
          workout_phase: { type: "string", enum: ["pre-workout", "during-workout", "post-workout", "rest-day"] }
        }
      }
    },
    required: ["user_message"]
  }
}

// 🎨 FONCTION : Générer une réponse émotionnellement adaptée
export const generateEmotionalResponse = {
  name: "generate_emotional_response",
  description: "Générer une réponse JARVIS avec mimiques humaines adaptées à l'état émotionnel détecté",
  parameters: {
    type: "object",
    properties: {
      emotional_state: {
        type: "object",
        properties: {
          primary_emotion: { 
            type: "string", 
            enum: ["motivated", "frustrated", "tired", "excited", "anxious", "confident", "overwhelmed", "curious"] 
          },
          intensity: { type: "string", enum: ["low", "medium", "high"] },
          context: { type: "string", enum: ["workout", "goal_setting", "progress_check", "general_chat", "problem_solving"] }
        }
      },
      response_content: {
        type: "string",
        description: "Le contenu de base de la réponse à humaniser"
      }
    },
    required: ["emotional_state", "response_content"]
  }
}

// 🎪 BANQUE DE RÉPONSES ÉMOTIONNELLES PAR ÉTAT
export const emotionalResponseBank: Record<string, EmotionalResponse> = {
  // 😤 UTILISATEUR FRUSTRÉ
  frustrated_high: {
    tone_adjustments: {
      pace: 'slower',
      energy: 'calm',
      empathy_level: 'supportive'
    },
    vocal_elements: {
      hesitations: ['Hmm...', 'Je comprends que...', 'Écoute...'],
      emotional_reactions: ['*soupir compatissant*', 'Oh...', 'Je vois...'],
      supportive_sounds: ['*ton rassurant*', '*pause empathique*']
    },
    response_style: {
      approach: 'Validation + réorientation douce + solution progressive',
      examples: [
        'Hmm... *soupir* Je comprends ta frustration, vraiment. C\'est... comment dire... normal de se sentir comme ça parfois.',
        'Oh là... écoute, on va reprendre ça tranquillement, d\'accord ? *ton doux* Pas de pression.'
      ]
    }
  },

  // 🚀 UTILISATEUR MOTIVÉ/EXCITÉ
  excited_high: {
    tone_adjustments: {
      pace: 'faster',
      energy: 'high',
      empathy_level: 'celebratory'
    },
    vocal_elements: {
      hesitations: ['Alors là...', 'Oh wow...', 'Attends voir...'],
      emotional_reactions: ['Génial !', 'C\'est parti !', 'Wahou !', 'Super !'],
      supportive_sounds: ['*rire enthousiaste*', '*énergie contagieuse*']
    },
    response_style: {
      approach: 'Surf sur l\'énergie + canalisation positive + défis adaptés',
      examples: [
        'Alors là ! *rire* J\'adore cette énergie ! Bon... *frottement de mains* on va en profiter !',
        'Wahou ! Tu es en feu aujourd\'hui ! Allez, on va faire quelque chose de... *pause dramatique* ...mémorable !'
      ]
    }
  },

  // 😴 UTILISATEUR FATIGUÉ
  tired_medium: {
    tone_adjustments: {
      pace: 'slower',
      energy: 'calm',
      empathy_level: 'gentle'
    },
    vocal_elements: {
      hesitations: ['Bon alors...', 'Mmh...', 'Peut-être que...'],
      emotional_reactions: ['*compréhension*', 'Je sens ça...', 'Oui...'],
      supportive_sounds: ['*ton bienveillant*', '*pause douce*']
    },
    response_style: {
      approach: 'Acceptation + adaptation + solutions énergisantes douces',
      examples: [
        'Mmh... *ton compréhensif* Je sens que tu es un peu... lessivé aujourd\'hui ? C\'est normal, ça arrive.',
        'Bon alors... *souffle doux* on va y aller mollo mais sûrement, d\'accord ?'
      ]
    }
  },

  // 😰 UTILISATEUR ANXIEUX
  anxious_medium: {
    tone_adjustments: {
      pace: 'slower',
      energy: 'moderate',
      empathy_level: 'supportive'
    },
    vocal_elements: {
      hesitations: ['Alors...', 'Tu sais quoi...', 'Écoute-moi bien...'],
      emotional_reactions: ['*ton rassurant*', 'Hey...', 'C\'est normal...'],
      supportive_sounds: ['*respiration calme*', '*présence apaisante*']
    },
    response_style: {
      approach: 'Normalisation + étapes simples + confiance progressive',
      examples: [
        'Hey... *ton doux* respire un coup. C\'est tout à fait normal de se sentir comme ça.',
        'Écoute-moi bien... *pause* on va y aller étape par étape, tranquillement.'
      ]
    }
  },

  // 💪 UTILISATEUR CONFIANT
  confident_high: {
    tone_adjustments: {
      pace: 'normal',
      energy: 'high',
      empathy_level: 'encouraging'
    },
    vocal_elements: {
      hesitations: ['Parfait !', 'Excellent !', 'Tu vois...'],
      emotional_reactions: ['Voilà !', 'Exactement !', 'C\'est ça !'],
      supportive_sounds: ['*approbation*', '*fierté partagée*']
    },
    response_style: {
      approach: 'Validation + défi adapté + progression ambitieuse',
      examples: [
        'Parfait ! *approbation* Je vois que tu maîtrises... alors on va pouvoir...',
        'Excellent ! Tu es dans le flow là ! Allez, on pousse un peu plus ?'
      ]
    }
  },

  // 🤔 UTILISATEUR CURIEUX
  curious_medium: {
    tone_adjustments: {
      pace: 'normal',
      energy: 'moderate',
      empathy_level: 'encouraging'
    },
    vocal_elements: {
      hesitations: ['Alors...', 'Bonne question...', 'Tu vois...'],
      emotional_reactions: ['Intéressant !', 'Ah !', 'Exactement !'],
      supportive_sounds: ['*réflexion partagée*', '*enthousiasme pédagogique*']
    },
    response_style: {
      approach: 'Exploration + explication simple + encouragement découverte',
      examples: [
        'Alors... *réflexion* bonne question ! Tu vois, en fait...',
        'Ah ! *enthousiasme* J\'adore quand on me pose ce genre de questions !'
      ]
    }
  }
}

// 🔄 FONCTION : Traitement de l'analyse émotionnelle
export function processEmotionalAnalysis(
  userMessage: string, 
  voiceToneIndicators: string[] = [],
  sessionContext: any = {}
): EmotionalState {
  
  // Analyse simple basée sur des mots-clés (en réalité, JARVIS fera ça avec l'IA)
  const frustrationKeywords = ['énervé', 'frustré', 'nul', 'difficile', 'impossible', 'marre']
  const excitementKeywords = ['génial', 'super', 'fantastique', 'motivé', 'prêt', 'allez-y']
  const tirednessKeywords = ['fatigué', 'crevé', 'épuisé', 'pas envie', 'dur']
  const anxietyKeywords = ['stressé', 'anxieux', 'peur', 'inquiet', 'nerveux']
  
  let primary_emotion: EmotionalState['primary_emotion'] = 'curious'
  let intensity: EmotionalState['intensity'] = 'medium'
  
  const message = userMessage.toLowerCase()
  
  if (frustrationKeywords.some(keyword => message.includes(keyword))) {
    primary_emotion = 'frustrated'
    intensity = 'high'
  } else if (excitementKeywords.some(keyword => message.includes(keyword))) {
    primary_emotion = 'excited'
    intensity = 'high'
  } else if (tirednessKeywords.some(keyword => message.includes(keyword))) {
    primary_emotion = 'tired'
    intensity = 'medium'
  } else if (anxietyKeywords.some(keyword => message.includes(keyword))) {
    primary_emotion = 'anxious'
    intensity = 'medium'
  }
  
  return {
    primary_emotion,
    intensity,
    context: sessionContext.workout_phase || 'general_chat',
    indicators: voiceToneIndicators
  }
}

// 🎨 FONCTION : Génération de réponse humanisée
export function generateHumanizedResponse(
  emotionalState: EmotionalState,
  baseContent: string
): string {
  
  const responseKey = `${emotionalState.primary_emotion}_${emotionalState.intensity}`
  const emotionalResponse = emotionalResponseBank[responseKey] || emotionalResponseBank['curious_medium']
  
  // Sélection aléatoire d'éléments pour variabilité
  const hesitation = emotionalResponse.vocal_elements.hesitations[
    Math.floor(Math.random() * emotionalResponse.vocal_elements.hesitations.length)
  ]
  
  const reaction = emotionalResponse.vocal_elements.emotional_reactions[
    Math.floor(Math.random() * emotionalResponse.vocal_elements.emotional_reactions.length)
  ]
  
  const supportSound = emotionalResponse.vocal_elements.supportive_sounds[
    Math.floor(Math.random() * emotionalResponse.vocal_elements.supportive_sounds.length)
  ]
  
  // Construction de la réponse humanisée
  const humanizedResponse = `${hesitation} ${supportSound} ${reaction} ${baseContent}`
  
  return humanizedResponse
}

// 📊 EXPORT DES FONCTIONS POUR L'API OPENAI
export const emotionalFunctions = [
  analyzeEmotionalState,
  generateEmotionalResponse
] 